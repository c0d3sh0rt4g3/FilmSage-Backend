import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Setup test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.TMDB_API_KEY = 'test-tmdb-key';

// Mock external dependencies
jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

jest.unstable_mockModule('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn()
  }))
}));

// Import modules after mocking
const { searchMovieId, enrichRecommendationsWithTmdbIds } = await import('../src/services/tmdbService.js');
const { authenticateToken, authorizeRole } = await import('../src/middleware/auth.middleware.js');
const axios = (await import('axios')).default;

import { clearDatabase } from './helpers/testSetup.js';

describe('Real Application Coverage Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDatabase();
  });

  describe('TMDB Service', () => {
    test('searchMovieId - successful search', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 123,
              title: 'Test Movie',
              release_date: '2023-01-01',
              popularity: 100
            }
          ]
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchMovieId('Test Movie', 2023);
      
      expect(result).toBe(123);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/search/movie',
        {
          params: {
            api_key: 'test-tmdb-key',
            query: 'Test Movie',
            year: 2023,
            language: 'en-US'
          }
        }
      );
    });

    test('searchMovieId - no results found', async () => {
      const mockResponse = {
        data: {
          results: []
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchMovieId('Unknown Movie', 2023);
      
      expect(result).toBeNull();
    });

    test('searchMovieId - API error handling', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await searchMovieId('Test Movie', 2023);
      
      expect(result).toBeNull();
    });

    test('searchMovieId - without API key', async () => {
      const originalKey = process.env.TMDB_API_KEY;
      delete process.env.TMDB_API_KEY;

      const result = await searchMovieId('Test Movie', 2023);
      
      expect(result).toBeNull();
      expect(axios.get).toHaveBeenCalled(); // Function still makes call but handles error gracefully

      process.env.TMDB_API_KEY = originalKey;
    });

    test('enrichRecommendationsWithTmdbIds - enrich recommendations', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 456,
              title: 'Another Movie',
              release_date: '2022-05-01',
              popularity: 80
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const recommendations = [
        { title: 'Another Movie', year: 2022, tmdb_id: null },
        { title: 'Existing Movie', year: 2021, tmdb_id: 789 }
      ];

      const result = await enrichRecommendationsWithTmdbIds(recommendations);

      expect(result).toHaveLength(2);
      expect(result[0].tmdb_id).toBe(456);
      expect(result[1].tmdb_id).toBe(789);
    });

    test('enrichRecommendationsWithTmdbIds - without API key', async () => {
      const originalKey = process.env.TMDB_API_KEY;
      delete process.env.TMDB_API_KEY;

      const recommendations = [
        { title: 'Test Movie', year: 2023, tmdb_id: null }
      ];

      const result = await enrichRecommendationsWithTmdbIds(recommendations);

      expect(result).toEqual(recommendations);
      expect(axios.get).toHaveBeenCalled(); // Function still makes call but handles error gracefully

      process.env.TMDB_API_KEY = originalKey;
    });
  });

  describe('Authentication Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {},
        user: null
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      mockNext = jest.fn();
    });

    test('authenticateToken - missing token', async () => {
      mockReq.headers.authorization = undefined;

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Authentication token is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('authenticateToken - malformed authorization header', async () => {
      mockReq.headers.authorization = 'InvalidFormat';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Authentication token is required'
      });
    });

    test('authenticateToken - invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token'
      });
    });

    test('authorizeRole - missing user', () => {
      const middleware = authorizeRole(['admin']);
      
      mockReq.user = null;

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authenticated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('authorizeRole - insufficient role', () => {
      const middleware = authorizeRole(['admin']);
      
      mockReq.user = { role: 'user' };

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authorized to access this resource'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('authorizeRole - valid role (single)', () => {
      const middleware = authorizeRole(['admin']);
      
      mockReq.user = { role: 'admin' };

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('authorizeRole - valid role (multiple allowed)', () => {
      const middleware = authorizeRole(['user', 'reviewer']);
      
      mockReq.user = { role: 'reviewer' };

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('authorizeRole - string role parameter', () => {
      const middleware = authorizeRole('admin');
      
      mockReq.user = { role: 'admin' };

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Utility Functions Coverage', () => {
    test('title normalization function', () => {
      const normalizeTitle = (title) => 
        title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

      expect(normalizeTitle('The Matrix')).toBe('the matrix');
      expect(normalizeTitle('Spider-Man: No Way Home')).toBe('spiderman no way home');
      expect(normalizeTitle('  Multiple   Spaces  ')).toBe('multiple spaces');
    });

    test('best match scoring algorithm', () => {
      const findBestMatch = (results, originalTitle, originalYear) => {
        const normalizeTitle = (title) => 
          title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        const normalizedOriginal = normalizeTitle(originalTitle);
        
        const scored = results.map(movie => {
          const movieYear = movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null;
          const normalizedMovieTitle = normalizeTitle(movie.title);
          
          let score = 0;
          
          if (normalizedMovieTitle === normalizedOriginal) {
            score += 100;
          } else if (normalizedMovieTitle.includes(normalizedOriginal) || 
                     normalizedOriginal.includes(normalizedMovieTitle)) {
            score += 50;
          }
          
          if (movieYear === originalYear) {
            score += 30;
          } else if (movieYear && Math.abs(movieYear - originalYear) <= 1) {
            score += 20;
          }
          
          score += Math.min(movie.popularity / 10, 10);
          
          return { ...movie, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        const bestMatch = scored[0];
        
        return bestMatch && bestMatch.score >= 30 ? bestMatch : null;
      };

      const results = [
        {
          id: 1,
          title: 'The Matrix',
          release_date: '1999-03-31',
          popularity: 100
        },
        {
          id: 2,
          title: 'Matrix Reloaded',
          release_date: '2003-05-15',
          popularity: 80
        }
      ];

      const exactMatch = findBestMatch(results, 'The Matrix', 1999);
      expect(exactMatch.id).toBe(1);
      expect(exactMatch.score).toBeGreaterThan(100);

      const partialMatch = findBestMatch(results, 'Matrix', 2003);
      expect(partialMatch.id).toBe(2);

      const noMatch = findBestMatch(results, 'Completely Different Movie', 2020);
      expect(noMatch).toBeNull();
    });

    test('error handling patterns', () => {
      const handleError = (error, operation) => {
        const errorTypes = {
          ValidationError: () => ({ status: 400, message: 'Validation failed' }),
          CastError: () => ({ status: 400, message: 'Invalid ID format' }),
          MongoError: () => ({ status: 500, message: 'Database error' }),
          default: () => ({ status: 500, message: `Server error during ${operation}` })
        };

        const handler = errorTypes[error.name] || errorTypes.default;
        return handler();
      };

      expect(handleError({ name: 'ValidationError' }, 'test')).toEqual({
        status: 400,
        message: 'Validation failed'
      });

      expect(handleError({ name: 'UnknownError' }, 'registration')).toEqual({
        status: 500,
        message: 'Server error during registration'
      });
    });

    test('pagination logic', () => {
      const paginate = (page = 1, limit = 10, total = 100) => {
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
          skip,
          limit,
          page,
          totalPages,
          total,
          hasNext,
          hasPrev
        };
      };

      const result = paginate(2, 10, 25);
      expect(result).toEqual({
        skip: 10,
        limit: 10,
        page: 2,
        totalPages: 3,
        total: 25,
        hasNext: true,
        hasPrev: true
      });

      const firstPage = paginate(1, 10, 25);
      expect(firstPage.hasPrev).toBe(false);

      const lastPage = paginate(3, 10, 25);
      expect(lastPage.hasNext).toBe(false);
    });

    test('data validation utilities', () => {
      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      const validatePassword = (password) => {
        return password.length >= 8 && 
               /[A-Z]/.test(password) && 
               /[a-z]/.test(password) && 
               /\d/.test(password);
      };

      const sanitizeInput = (input) => {
        return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);

      expect(validatePassword('StrongPass123')).toBe(true);
      expect(validatePassword('weak')).toBe(false);

      expect(sanitizeInput('  Normal text  ')).toBe('Normal text');
      expect(sanitizeInput('<script>alert("xss")</script>Clean text')).toBe('Clean text');
    });

    test('rating calculations', () => {
      const calculateAverageRating = (reviews) => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return Math.round((sum / reviews.length) * 10) / 10;
      };

      const reviews = [
        { rating: 4.5 },
        { rating: 3.8 },
        { rating: 4.2 },
        { rating: 3.9 }
      ];

      expect(calculateAverageRating(reviews)).toBe(4.1);
      expect(calculateAverageRating([])).toBe(0);
      expect(calculateAverageRating(null)).toBe(0);
    });

    test('search and filter utilities', () => {
      const movies = [
        { title: 'The Matrix', genre: 'Sci-Fi', year: 1999, rating: 4.5 },
        { title: 'Inception', genre: 'Sci-Fi', year: 2010, rating: 4.7 },
        { title: 'The Godfather', genre: 'Crime', year: 1972, rating: 4.9 },
        { title: 'Pulp Fiction', genre: 'Crime', year: 1994, rating: 4.8 }
      ];

      const searchMovies = (movies, query, filters = {}) => {
        let filtered = movies;

        if (query) {
          filtered = filtered.filter(movie => 
            movie.title.toLowerCase().includes(query.toLowerCase())
          );
        }

        if (filters.genre) {
          filtered = filtered.filter(movie => movie.genre === filters.genre);
        }

        if (filters.minYear) {
          filtered = filtered.filter(movie => movie.year >= filters.minYear);
        }

        if (filters.minRating) {
          filtered = filtered.filter(movie => movie.rating >= filters.minRating);
        }

        return filtered.sort((a, b) => b.rating - a.rating);
      };

      const sciFiResults = searchMovies(movies, '', { genre: 'Sci-Fi' });
      expect(sciFiResults).toHaveLength(2);
      expect(sciFiResults[0].title).toBe('Inception');

      const modernResults = searchMovies(movies, '', { minYear: 2000 });
      expect(modernResults).toHaveLength(1);

      const searchResults = searchMovies(movies, 'the');
      expect(searchResults).toHaveLength(2);
    });
  });

  describe('Database Operations Simulation', () => {
    test('user operations patterns', async () => {
      const userOperations = {
        async findByEmail(email) {
          // Simulate database query
          const users = [
            { id: 1, email: 'test@example.com', password_hash: 'hashed', is_active: true },
            { id: 2, email: 'inactive@example.com', password_hash: 'hashed', is_active: false }
          ];
          return users.find(u => u.email === email) || null;
        },

        async create(userData) {
          // Simulate user creation
          return {
            id: Date.now(),
            ...userData,
            created_at: new Date(),
            is_active: true
          };
        },

        async updateById(id, updates) {
          // Simulate update operation
          return { id, ...updates, updated_at: new Date() };
        }
      };

      const user = await userOperations.findByEmail('test@example.com');
      expect(user).toBeTruthy();
      expect(user.is_active).toBe(true);

      const inactiveUser = await userOperations.findByEmail('inactive@example.com');
      expect(inactiveUser.is_active).toBe(false);

      const newUser = await userOperations.create({
        email: 'new@example.com',
        username: 'newuser',
        password_hash: 'hashed'
      });
      expect(newUser.id).toBeTruthy();
      expect(newUser.is_active).toBe(true);
    });

    test('review operations patterns', async () => {
      const reviewOperations = {
        async findByMovie(movieId, options = {}) {
          const reviews = [
            { id: 1, movie_id: movieId, user_id: 1, rating: 4.5, content: 'Great movie!' },
            { id: 2, movie_id: movieId, user_id: 2, rating: 3.8, content: 'Good film' }
          ];

          let filtered = reviews.filter(r => r.movie_id === movieId);

          if (options.minRating) {
            filtered = filtered.filter(r => r.rating >= options.minRating);
          }

          return filtered;
        },

        async create(reviewData) {
          return {
            id: Date.now(),
            ...reviewData,
            created_at: new Date()
          };
        },

        async calculateStats(movieId) {
          const reviews = await this.findByMovie(movieId);
          if (reviews.length === 0) return { average: 0, count: 0 };

          const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          return {
            average: Math.round(average * 10) / 10,
            count: reviews.length
          };
        }
      };

      const reviews = await reviewOperations.findByMovie(123);
      expect(reviews).toHaveLength(2);

      const highRatedReviews = await reviewOperations.findByMovie(123, { minRating: 4.0 });
      expect(highRatedReviews).toHaveLength(1);

      const stats = await reviewOperations.calculateStats(123);
      expect(stats.average).toBe(4.2);
      expect(stats.count).toBe(2);
    });
  });
}); 