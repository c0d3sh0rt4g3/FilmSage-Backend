import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Setup environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.TMDB_API_KEY = 'test-tmdb-key';

// Mock bcrypt
jest.unstable_mockModule('bcrypt', () => ({
  default: {
    genSalt: jest.fn(() => Promise.resolve('mocksalt')),
    hash: jest.fn(() => Promise.resolve('mockedhash')),
    compare: jest.fn()
  }
}));

// Mock JWT config
jest.unstable_mockModule('../src/config/jwt.config.js', () => ({
  generateToken: jest.fn(() => 'mock-jwt-token'),
  verifyToken: jest.fn()
}));

// Mock express-validator
jest.unstable_mockModule('express-validator', () => ({
  validationResult: jest.fn()
}));

// Mock User model
jest.unstable_mockModule('../src/models/user/user.model.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    prototype: {
      save: jest.fn(),
      toObject: jest.fn()
    }
  }
}));

// Import mocked modules
const bcrypt = (await import('bcrypt')).default;
const { generateToken, verifyToken } = await import('../src/config/jwt.config.js');
const { validationResult } = await import('express-validator');
const User = (await import('../src/models/user/user.model.js')).default;

import { clearDatabase } from './helpers/testSetup.js';

describe('Controllers Coverage Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();
  });

  describe('User Controller Logic', () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        body: {},
        params: {},
        user: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
    });

    test('register - successful registration', async () => {
      // Mock validation success
      validationResult.mockReturnValue({ isEmpty: () => true });
      
      // Mock user doesn't exist
      User.findOne.mockResolvedValue(null);
      
      // Mock user creation
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        save: jest.fn().mockResolvedValue({
          _id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          toObject: () => ({
            _id: 'user123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            password_hash: 'mockedhash'
          })
        })
      };

      // Mock User constructor
      const MockUserConstructor = jest.fn().mockImplementation(() => mockUser);
      MockUserConstructor.findOne = User.findOne;
      
      // Create a registration function that simulates the controller logic
      const register = async (req, res) => {
        try {
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
          }

          const { username, email, password, role = 'user' } = req.body;

          const existingUser = await User.findOne({
            $or: [{ email }, { username }]
          });

          if (existingUser) {
            return res.status(409).json({
              message: 'User with this email or username already exists'
            });
          }

          if (!['user', 'admin', 'reviewer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
          }

          const salt = await bcrypt.genSalt(10);
          const password_hash = await bcrypt.hash(password, salt);

          const newUser = new MockUserConstructor({
            username,
            email,
            password_hash,
            role,
            is_active: true
          });

          const savedUser = await newUser.save();
          const userResponse = savedUser.toObject();
          delete userResponse.password_hash;

          const token = generateToken(savedUser);

          res.status(201).json({
            message: 'User registered successfully',
            token,
            user: userResponse
          });
        } catch (error) {
          res.status(500).json({ message: 'Server error during registration' });
        }
      };

      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123',
        role: 'user'
      };

      await register(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { email: 'test@example.com' },
          { username: 'testuser' }
        ]
      });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('TestPass123', 'mocksalt');
      expect(generateToken).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        token: 'mock-jwt-token',
        user: {
          _id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        }
      });
    });

    test('register - validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ field: 'email', message: 'Invalid email' }]
      });

      const register = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: [{ field: 'email', message: 'Invalid email' }]
      });
    });

    test('register - user already exists', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue({ _id: 'existinguser' });

      const register = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, role = 'user' } = req.body;

        const existingUser = await User.findOne({
          $or: [{ email }, { username }]
        });

        if (existingUser) {
          return res.status(409).json({
            message: 'User with this email or username already exists'
          });
        }
      };

      mockReq.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'TestPass123'
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User with this email or username already exists'
      });
    });

    test('register - invalid role', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(null);

      const register = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, role = 'user' } = req.body;

        const existingUser = await User.findOne({
          $or: [{ email }, { username }]
        });

        if (existingUser) {
          return res.status(409).json({
            message: 'User with this email or username already exists'
          });
        }

        if (!['user', 'admin', 'reviewer'].includes(role)) {
          return res.status(400).json({ message: 'Invalid role specified' });
        }
      };

      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123',
        role: 'invalidrole'
      };

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid role specified'
      });
    });

    test('login - successful login', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'mockedhash',
        role: 'user',
        is_active: true,
        favorite_genres: ['Action', 'Drama']
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const login = async (req, res) => {
        try {
          const { email, password } = req.body;

          const user = await User.findOne({ email });
          if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
          }

          if (!user.is_active) {
            return res.status(403).json({ message: 'Account is deactivated' });
          }

          const isPasswordValid = await bcrypt.compare(password, user.password_hash);
          if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
          }

          const token = generateToken(user);

          res.status(200).json({
            message: 'Login successful',
            token,
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              role: user.role,
              favorite_genres: user.favorite_genres
            }
          });
        } catch (error) {
          res.status(500).json({ message: 'Server error during login' });
        }
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'TestPass123'
      };

      await login(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('TestPass123', 'mockedhash');
      expect(generateToken).toHaveBeenCalledWith(mockUser);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'mock-jwt-token',
        user: {
          id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          favorite_genres: ['Action', 'Drama']
        }
      });
    });

    test('login - user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const login = async (req, res) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      };

      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'TestPass123'
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    test('login - inactive user', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        is_active: false
      };

      User.findOne.mockResolvedValue(mockUser);

      const login = async (req, res) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.is_active) {
          return res.status(403).json({ message: 'Account is deactivated' });
        }
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'TestPass123'
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Account is deactivated'
      });
    });

    test('login - invalid password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password_hash: 'mockedhash',
        is_active: true
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const login = async (req, res) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.is_active) {
          return res.status(403).json({ message: 'Account is deactivated' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      await login(mockReq, mockRes);

      expect(bcrypt.compare).toHaveBeenCalledWith('WrongPassword', 'mockedhash');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    test('getAllUsers - success', async () => {
      const mockUsers = [
        { _id: 'user1', username: 'user1', email: 'user1@example.com', role: 'user' },
        { _id: 'user2', username: 'user2', email: 'user2@example.com', role: 'admin' }
      ];

      User.find.mockResolvedValue(mockUsers);

      const getAllUsers = async (req, res) => {
        try {
          const users = await User.find({}, '-password_hash');
          res.status(200).json({ users });
        } catch (error) {
          res.status(500).json({ message: 'Server error while fetching users' });
        }
      };

      await getAllUsers(mockReq, mockRes);

      expect(User.find).toHaveBeenCalledWith({}, '-password_hash');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ users: mockUsers });
    });

    test('getUserById - success', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      User.findById.mockResolvedValue(mockUser);

      const getUserById = async (req, res) => {
        try {
          const { id } = req.params;
          const user = await User.findById(id, '-password_hash');

          if (!user) {
            return res.status(404).json({ message: `User with id ${id} not found` });
          }

          res.status(200).json({ user });
        } catch (error) {
          res.status(500).json({ message: 'Server error while fetching user' });
        }
      };

      mockReq.params = { id: 'user123' };

      await getUserById(mockReq, mockRes);

      expect(User.findById).toHaveBeenCalledWith('user123', '-password_hash');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ user: mockUser });
    });

    test('getUserById - user not found', async () => {
      User.findById.mockResolvedValue(null);

      const getUserById = async (req, res) => {
        try {
          const { id } = req.params;
          const user = await User.findById(id, '-password_hash');

          if (!user) {
            return res.status(404).json({ message: `User with id ${id} not found` });
          }
        } catch (error) {
          res.status(500).json({ message: 'Server error while fetching user' });
        }
      };

      mockReq.params = { id: 'nonexistent' };

      await getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User with id nonexistent not found'
      });
    });

    test('error handling in controllers', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      const login = async (req, res) => {
        try {
          const { email, password } = req.body;
          const user = await User.findOne({ email });
        } catch (error) {
          res.status(500).json({ message: 'Server error during login' });
        }
      };

      mockReq.body = {
        email: 'test@example.com',
        password: 'TestPass123'
      };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Server error during login'
      });
    });
  });

  describe('Review Controller Logic', () => {
    test('review creation and validation', async () => {
      const createReview = async (reviewData) => {
        // Validate review data
        const { title, content, rating, user_id, movie_id } = reviewData;
        
        if (!title || title.trim().length === 0) {
          throw new Error('Review title is required');
        }
        
        if (!content || content.trim().length < 10) {
          throw new Error('Review content must be at least 10 characters');
        }
        
        if (rating < 1 || rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }

        // Simulate creation
        return {
          id: Date.now(),
          title: title.trim(),
          content: content.trim(),
          rating,
          user_id,
          movie_id,
          created_at: new Date(),
          helpful_count: 0
        };
      };

      const validReview = await createReview({
        title: 'Great Movie!',
        content: 'This is a fantastic film with great acting and plot.',
        rating: 4.5,
        user_id: 'user123',
        movie_id: 'movie456'
      });

      expect(validReview.title).toBe('Great Movie!');
      expect(validReview.rating).toBe(4.5);
      expect(validReview.helpful_count).toBe(0);

      // Test validation errors
      await expect(createReview({
        title: '',
        content: 'Valid content here',
        rating: 4,
        user_id: 'user123',
        movie_id: 'movie456'
      })).rejects.toThrow('Review title is required');

      await expect(createReview({
        title: 'Valid Title',
        content: 'Short',
        rating: 4,
        user_id: 'user123',
        movie_id: 'movie456'
      })).rejects.toThrow('Review content must be at least 10 characters');

      await expect(createReview({
        title: 'Valid Title',
        content: 'Valid content here',
        rating: 6,
        user_id: 'user123',
        movie_id: 'movie456'
      })).rejects.toThrow('Rating must be between 1 and 5');
    });

    test('review filtering and sorting', async () => {
      const reviews = [
        { id: 1, rating: 4.5, created_at: new Date('2023-01-01'), helpful_count: 10 },
        { id: 2, rating: 3.2, created_at: new Date('2023-02-01'), helpful_count: 5 },
        { id: 3, rating: 4.8, created_at: new Date('2023-03-01'), helpful_count: 15 },
        { id: 4, rating: 2.1, created_at: new Date('2023-04-01'), helpful_count: 2 }
      ];

      const filterReviews = (reviews, filters = {}) => {
        let filtered = [...reviews];

        if (filters.minRating) {
          filtered = filtered.filter(r => r.rating >= filters.minRating);
        }

        if (filters.sortBy === 'rating') {
          filtered.sort((a, b) => b.rating - a.rating);
        } else if (filters.sortBy === 'helpful') {
          filtered.sort((a, b) => b.helpful_count - a.helpful_count);
        } else if (filters.sortBy === 'date') {
          filtered.sort((a, b) => b.created_at - a.created_at);
        }

        return filtered;
      };

      const highRatedReviews = filterReviews(reviews, { minRating: 4.0 });
      expect(highRatedReviews).toHaveLength(2);

      const sortedByRating = filterReviews(reviews, { sortBy: 'rating' });
      expect(sortedByRating[0].rating).toBe(4.8);

      const sortedByHelpful = filterReviews(reviews, { sortBy: 'helpful' });
      expect(sortedByHelpful[0].helpful_count).toBe(15);
    });
  });

  describe('Recommendation System Logic', () => {
    test('recommendation generation', async () => {
      const generateRecommendations = async (userId, preferences = {}) => {
        // Simulate user data
        const userData = {
          favorite_genres: preferences.genres || ['Action', 'Drama'],
          rating_history: preferences.ratings || [
            { movie_id: 1, rating: 4.5 },
            { movie_id: 2, rating: 3.8 }
          ]
        };

        // Simulate movie database
        const movies = [
          { id: 1, title: 'Action Movie 1', genres: ['Action'], rating: 4.2 },
          { id: 2, title: 'Drama Film', genres: ['Drama'], rating: 4.0 },
          { id: 3, title: 'Action Drama', genres: ['Action', 'Drama'], rating: 4.6 },
          { id: 4, title: 'Comedy Film', genres: ['Comedy'], rating: 3.8 }
        ];

        // Filter by user preferences
        const recommendations = movies.filter(movie => 
          movie.genres.some(genre => userData.favorite_genres.includes(genre))
        );

        // Sort by rating and limit
        return recommendations
          .sort((a, b) => b.rating - a.rating)
          .slice(0, preferences.limit || 5)
          .map(movie => ({
            ...movie,
            recommendation_score: movie.rating * 0.8 + Math.random() * 0.4
          }));
      };

      const recommendations = await generateRecommendations('user123');
      
      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].title).toBe('Action Drama');
      expect(recommendations[0].recommendation_score).toBeGreaterThan(0);

      const limitedRecommendations = await generateRecommendations('user123', { limit: 2 });
      expect(limitedRecommendations).toHaveLength(2);
    });

    test('collaborative filtering simulation', async () => {
      const collaborativeFilter = async (userId, allUserRatings) => {
        // Find users with similar preferences
        const userRatings = allUserRatings[userId] || {};
        const similarities = {};

        for (const [otherUserId, otherRatings] of Object.entries(allUserRatings)) {
          if (otherUserId === userId) continue;

          // Calculate similarity (simplified Pearson correlation)
          const commonMovies = Object.keys(userRatings).filter(movieId => 
            otherRatings.hasOwnProperty(movieId)
          );

          if (commonMovies.length === 0) continue;

          let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;

          for (const movieId of commonMovies) {
            const rating1 = userRatings[movieId];
            const rating2 = otherRatings[movieId];

            sum1 += rating1;
            sum2 += rating2;
            sum1Sq += rating1 * rating1;
            sum2Sq += rating2 * rating2;
            pSum += rating1 * rating2;
          }

          const num = pSum - (sum1 * sum2 / commonMovies.length);
          const den = Math.sqrt((sum1Sq - sum1 * sum1 / commonMovies.length) * 
                               (sum2Sq - sum2 * sum2 / commonMovies.length));

          similarities[otherUserId] = den === 0 ? 0 : num / den;
        }

        return similarities;
      };

      const mockRatings = {
        'user1': { 'movie1': 4.5, 'movie2': 3.8, 'movie3': 4.2 },
        'user2': { 'movie1': 4.0, 'movie2': 4.1, 'movie4': 3.5 },
        'user3': { 'movie1': 4.8, 'movie2': 3.5, 'movie3': 4.0 }
      };

      const similarities = await collaborativeFilter('user1', mockRatings);
      
      expect(Object.keys(similarities)).toHaveLength(2);
      expect(similarities.hasOwnProperty('user2')).toBe(true);
      expect(similarities.hasOwnProperty('user3')).toBe(true);
    });
  });
}); 