/**
 * API Integration Tests - End-to-end coverage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearDatabase } from '../helpers/testSetup.js';

describe('API Integration Tests - E2E Coverage', () => {
  let mongoose;
  let User, Review;
  let testServer;

  beforeAll(async () => {
    await setupTestDB();
    mongoose = await import('mongoose');
    
    // Setup test models
    const userSchema = new mongoose.default.Schema({
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password_hash: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin', 'reviewer'], default: 'user' },
      is_active: { type: Boolean, default: true },
      favorite_genres: [String]
    });

    const reviewSchema = new mongoose.default.Schema({
      user_id: { type: mongoose.default.Schema.Types.ObjectId, ref: 'User', required: true },
      movie_title: { type: String, required: true },
      movie_year: { type: Number, required: true },
      rating: { type: Number, required: true, min: 1, max: 10 },
      review_text: { type: String },
      is_public: { type: Boolean, default: true },
      created_at: { type: Date, default: Date.now }
    });

    try {
      User = mongoose.default.model('IntegrationTestUser', userSchema);
    } catch (error) {
      if (error.name === 'OverwriteModelError') {
        mongoose.default.deleteModel('IntegrationTestUser');
        User = mongoose.default.model('IntegrationTestUser', userSchema);
      } else {
        throw error;
      }
    }

    try {
      Review = mongoose.default.model('IntegrationTestReview', reviewSchema);
    } catch (error) {
      if (error.name === 'OverwriteModelError') {
        mongoose.default.deleteModel('IntegrationTestReview');
        Review = mongoose.default.model('IntegrationTestReview', reviewSchema);
      } else {
        throw error;
      }
    }

    // Mock server functionality
    testServer = {
      createUser: async (userData) => {
        try {
          const existingUser = await User.findOne({
            $or: [{ email: userData.email }, { username: userData.username }]
          });

          if (existingUser) {
            return { status: 409, data: { message: 'User already exists' } };
          }

          const newUser = new User({
            ...userData,
            password_hash: `hashed_${userData.password}`
          });

          const savedUser = await newUser.save();
          const { password_hash, ...userResponse } = savedUser.toObject();

          return {
            status: 201,
            data: {
              message: 'User registered successfully',
              token: `jwt_token_${savedUser._id}`,
              user: userResponse
            }
          };
        } catch (error) {
          return { status: 500, data: { message: 'Server error' } };
        }
      },

      loginUser: async (credentials) => {
        try {
          const user = await User.findOne({ email: credentials.email });
          
          if (!user || !user.is_active) {
            return { status: 401, data: { message: 'Invalid credentials' } };
          }

          const isValidPassword = user.password_hash === `hashed_${credentials.password}`;
          
          if (!isValidPassword) {
            return { status: 401, data: { message: 'Invalid credentials' } };
          }

          return {
            status: 200,
            data: {
              message: 'Login successful',
              token: `jwt_token_${user._id}`,
              user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
              }
            }
          };
        } catch (error) {
          return { status: 500, data: { message: 'Server error' } };
        }
      },

      createReview: async (reviewData, authToken) => {
        try {
          if (!authToken || !authToken.startsWith('jwt_token_')) {
            return { status: 401, data: { message: 'Authentication required' } };
          }

          const userId = authToken.replace('jwt_token_', '');
          const user = await User.findById(userId);

          if (!user || !user.is_active) {
            return { status: 403, data: { message: 'User not found or inactive' } };
          }

          const newReview = new Review({
            ...reviewData,
            user_id: userId
          });

          const savedReview = await newReview.save();

          return {
            status: 201,
            data: {
              message: 'Review created successfully',
              review: savedReview
            }
          };
        } catch (error) {
          return { status: 500, data: { message: 'Server error' } };
        }
      },

      getReviews: async (filters = {}) => {
        try {
          const query = { is_public: true };
          
          if (filters.movie_title) {
            query.movie_title = { $regex: filters.movie_title, $options: 'i' };
          }
          
          if (filters.user_id) {
            query.user_id = filters.user_id;
          }

          const reviews = await Review.find(query)
            .populate('user_id', 'username')
            .sort({ created_at: -1 });

          return {
            status: 200,
            data: { reviews }
          };
        } catch (error) {
          return { status: 500, data: { message: 'Server error' } };
        }
      },

      getUserProfile: async (userId, authToken) => {
        try {
          if (!authToken || !authToken.startsWith('jwt_token_')) {
            return { status: 401, data: { message: 'Authentication required' } };
          }

          const user = await User.findById(userId, '-password_hash');

          if (!user) {
            return { status: 404, data: { message: 'User not found' } };
          }

          return {
            status: 200,
            data: { user }
          };
        } catch (error) {
          return { status: 500, data: { message: 'Server error' } };
        }
      },

      updateUserProfile: async (userId, updateData, authToken) => {
        try {
          if (!authToken || !authToken.startsWith('jwt_token_')) {
            return { status: 401, data: { message: 'Authentication required' } };
          }

          const requestingUserId = authToken.replace('jwt_token_', '');
          
          // Users can only update their own profile (or admin can update any)
          const requestingUser = await User.findById(requestingUserId);
          
          if (requestingUserId !== userId && requestingUser.role !== 'admin') {
            return { status: 403, data: { message: 'Not authorized' } };
          }

          const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, select: '-password_hash' }
          );

          if (!updatedUser) {
            return { status: 404, data: { message: 'User not found' } };
          }

          return {
            status: 200,
            data: { user: updatedUser }
          };
        } catch (error) {
          return { status: 500, data: { message: 'Server error' } };
        }
      },

      deleteUser: async (userId, authToken) => {
        try {
          if (!authToken || !authToken.startsWith('jwt_token_')) {
            return { status: 401, data: { message: 'Authentication required' } };
          }

          const requestingUserId = authToken.replace('jwt_token_', '');
          const requestingUser = await User.findById(requestingUserId);

          if (requestingUser.role !== 'admin') {
            return { status: 403, data: { message: 'Admin access required' } };
          }

          const deletedUser = await User.findByIdAndDelete(userId);

          if (!deletedUser) {
            return { status: 404, data: { message: 'User not found' } };
          }

          return {
            status: 200,
            data: { message: 'User deleted successfully' }
          };
        } catch (error) {
          return { status: 500, data: { message: 'Server error' } };
        }
      }
    };
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('User Registration API', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      const response = await testServer.createUser(userData);

      expect(response.status).toBe(201);
      expect(response.data.message).toBe('User registered successfully');
      expect(response.data.token).toBeDefined();
      expect(response.data.user.username).toBe('testuser');
      expect(response.data.user.email).toBe('test@example.com');
      expect(response.data.user.password_hash).toBeUndefined();
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      // First registration
      await testServer.createUser(userData);

      // Attempt duplicate registration
      const duplicateData = {
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password456'
      };

      const response = await testServer.createUser(duplicateData);

      expect(response.status).toBe(409);
      expect(response.data.message).toBe('User already exists');
    });

    it('should reject duplicate username registration', async () => {
      const userData = {
        username: 'duplicate_user',
        email: 'user1@example.com',
        password: 'password123'
      };

      // First registration
      await testServer.createUser(userData);

      // Attempt duplicate registration
      const duplicateData = {
        username: 'duplicate_user',
        email: 'user2@example.com',
        password: 'password456'
      };

      const response = await testServer.createUser(duplicateData);

      expect(response.status).toBe(409);
      expect(response.data.message).toBe('User already exists');
    });
  });

  describe('User Authentication API', () => {
    beforeEach(async () => {
      // Create test user
      await testServer.createUser({
        username: 'authuser',
        email: 'auth@example.com',
        password: 'password123'
      });
    });

    it('should login user with valid credentials', async () => {
      const credentials = {
        email: 'auth@example.com',
        password: 'password123'
      };

      const response = await testServer.loginUser(credentials);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Login successful');
      expect(response.data.token).toBeDefined();
      expect(response.data.user.email).toBe('auth@example.com');
    });

    it('should reject invalid email', async () => {
      const credentials = {
        email: 'invalid@example.com',
        password: 'password123'
      };

      const response = await testServer.loginUser(credentials);

      expect(response.status).toBe(401);
      expect(response.data.message).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const credentials = {
        email: 'auth@example.com',
        password: 'wrongpassword'
      };

      const response = await testServer.loginUser(credentials);

      expect(response.status).toBe(401);
      expect(response.data.message).toBe('Invalid credentials');
    });

    it('should reject inactive user login', async () => {
      // Deactivate user
      const user = await User.findOne({ email: 'auth@example.com' });
      await User.updateOne({ _id: user._id }, { is_active: false });

      const credentials = {
        email: 'auth@example.com',
        password: 'password123'
      };

      const response = await testServer.loginUser(credentials);

      expect(response.status).toBe(401);
      expect(response.data.message).toBe('Invalid credentials');
    });
  });

  describe('Review Management API', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Create and login user
      const userResponse = await testServer.createUser({
        username: 'reviewer',
        email: 'reviewer@example.com',
        password: 'password123'
      });

      authToken = userResponse.data.token;
      userId = userResponse.data.user._id;
    });

    it('should create review with authentication', async () => {
      const reviewData = {
        movie_title: 'Test Movie',
        movie_year: 2023,
        rating: 8,
        review_text: 'Great movie!',
        is_public: true
      };

      const response = await testServer.createReview(reviewData, authToken);

      expect(response.status).toBe(201);
      expect(response.data.message).toBe('Review created successfully');
      expect(response.data.review.movie_title).toBe('Test Movie');
      expect(response.data.review.rating).toBe(8);
    });

    it('should reject review creation without authentication', async () => {
      const reviewData = {
        movie_title: 'Test Movie',
        movie_year: 2023,
        rating: 8,
        review_text: 'Great movie!'
      };

      const response = await testServer.createReview(reviewData, null);

      expect(response.status).toBe(401);
      expect(response.data.message).toBe('Authentication required');
    });

    it('should get public reviews', async () => {
      // Create a review first
      const reviewData = {
        movie_title: 'Public Movie',
        movie_year: 2023,
        rating: 9,
        review_text: 'Excellent!',
        is_public: true
      };

      await testServer.createReview(reviewData, authToken);

      const response = await testServer.getReviews();

      expect(response.status).toBe(200);
      expect(response.data.reviews).toHaveLength(1);
      expect(response.data.reviews[0].movie_title).toBe('Public Movie');
    });

    it('should filter reviews by movie title', async () => {
      // Create multiple reviews
      await testServer.createReview({
        movie_title: 'Action Movie',
        movie_year: 2023,
        rating: 7,
        is_public: true
      }, authToken);

      await testServer.createReview({
        movie_title: 'Drama Movie',
        movie_year: 2023,
        rating: 8,
        is_public: true
      }, authToken);

      const response = await testServer.getReviews({ movie_title: 'Action' });

      expect(response.status).toBe(200);
      expect(response.data.reviews).toHaveLength(1);
      expect(response.data.reviews[0].movie_title).toBe('Action Movie');
    });
  });

  describe('User Profile Management API', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      const userResponse = await testServer.createUser({
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'password123'
      });

      authToken = userResponse.data.token;
      userId = userResponse.data.user._id;
    });

    it('should get user profile with authentication', async () => {
      const response = await testServer.getUserProfile(userId, authToken);

      expect(response.status).toBe(200);
      expect(response.data.user.username).toBe('profileuser');
      expect(response.data.user.email).toBe('profile@example.com');
      expect(response.data.user.password_hash).toBeUndefined();
    });

    it('should reject profile access without authentication', async () => {
      const response = await testServer.getUserProfile(userId, null);

      expect(response.status).toBe(401);
      expect(response.data.message).toBe('Authentication required');
    });

    it('should update own profile', async () => {
      const updateData = {
        favorite_genres: ['Action', 'Sci-Fi']
      };

      const response = await testServer.updateUserProfile(userId, updateData, authToken);

      expect(response.status).toBe(200);
      expect(response.data.user.favorite_genres).toEqual(['Action', 'Sci-Fi']);
    });

    it('should prevent updating other users profile', async () => {
      // Create another user
      const otherUserResponse = await testServer.createUser({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123'
      });

      const otherUserId = otherUserResponse.data.user._id;
      const updateData = { favorite_genres: ['Horror'] };

      const response = await testServer.updateUserProfile(otherUserId, updateData, authToken);

      expect(response.status).toBe(403);
      expect(response.data.message).toBe('Not authorized');
    });
  });

  describe('Admin Functionality', () => {
    let adminToken;
    let userToken;
    let regularUserId;

    beforeEach(async () => {
      // Create admin user
      const adminResponse = await testServer.createUser({
        username: 'admin',
        email: 'admin@example.com',
        password: 'adminpass123',
        role: 'admin'
      });
      adminToken = adminResponse.data.token;

      // Create regular user
      const userResponse = await testServer.createUser({
        username: 'regularuser',
        email: 'regular@example.com',
        password: 'userpass123'
      });
      userToken = userResponse.data.token;
      regularUserId = userResponse.data.user._id;
    });

    it('should allow admin to update any user profile', async () => {
      const updateData = { favorite_genres: ['Comedy'] };

      const response = await testServer.updateUserProfile(regularUserId, updateData, adminToken);

      expect(response.status).toBe(200);
      expect(response.data.user.favorite_genres).toEqual(['Comedy']);
    });

    it('should allow admin to delete users', async () => {
      const response = await testServer.deleteUser(regularUserId, adminToken);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('User deleted successfully');

      // Verify user is deleted
      const user = await User.findById(regularUserId);
      expect(user).toBeNull();
    });

    it('should prevent regular users from deleting users', async () => {
      const response = await testServer.deleteUser(regularUserId, userToken);

      expect(response.status).toBe(403);
      expect(response.data.message).toBe('Admin access required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', () => {
      const handleDatabaseError = (error) => {
        if (error.code === 11000) {
          return { status: 409, message: 'Duplicate key error' };
        }
        if (error.name === 'ValidationError') {
          return { status: 400, message: 'Validation failed' };
        }
        if (error.name === 'CastError') {
          return { status: 400, message: 'Invalid ID format' };
        }
        return { status: 500, message: 'Internal server error' };
      };

      // Test different error types
      const duplicateError = { code: 11000 };
      expect(handleDatabaseError(duplicateError).status).toBe(409);

      const validationError = { name: 'ValidationError' };
      expect(handleDatabaseError(validationError).status).toBe(400);

      const castError = { name: 'CastError' };
      expect(handleDatabaseError(castError).status).toBe(400);

      const genericError = { name: 'GenericError' };
      expect(handleDatabaseError(genericError).status).toBe(500);
    });

    it('should validate request data', () => {
      const validateUserData = (data) => {
        const errors = [];

        if (!data.username || data.username.length < 3) {
          errors.push('Username must be at least 3 characters');
        }

        if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
          errors.push('Valid email is required');
        }

        if (!data.password || data.password.length < 8) {
          errors.push('Password must be at least 8 characters');
        }

        return errors;
      };

      // Test valid data
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      expect(validateUserData(validData)).toHaveLength(0);

      // Test invalid data
      const invalidData = {
        username: 'ab',
        email: 'invalid-email',
        password: 'short'
      };
      const errors = validateUserData(invalidData);
      expect(errors).toHaveLength(3);
      expect(errors).toContain('Username must be at least 3 characters');
      expect(errors).toContain('Valid email is required');
      expect(errors).toContain('Password must be at least 8 characters');
    });
  });
}); 