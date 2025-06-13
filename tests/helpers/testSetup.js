/**
 * Test Setup and Configuration
 * Configures in-memory MongoDB for testing and provides utility functions
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let mongoServer;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.TMDB_API_KEY = 'test-tmdb-api-key-12345';

/**
 * Setup test database before all tests
 */
const setupTestDB = async () => {
  try {
    // Close any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database with increased timeout
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000
    });
    
    // Wait for connection to be ready
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });
    
    console.log('✅ Test database connected successfully');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
};

/**
 * Clean up after all tests
 */
const teardownTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Clear all collections between tests
 */
const clearDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ Database not connected, skipping clear');
      return;
    }
    
    const collections = mongoose.connection.collections;
    
    // Clear collections in parallel for better performance
    const clearPromises = Object.keys(collections).map(async (key) => {
      try {
        await collections[key].deleteMany({});
      } catch (error) {
        console.warn(`⚠️ Failed to clear collection ${key}:`, error.message);
      }
    });
    
    await Promise.all(clearPromises);
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    throw error;
  }
};

/**
 * Generate test JWT token
 */
const generateTestToken = (userId = '507f1f77bcf86cd799439011') => {
  return jwt.sign(
    { userId, email: 'test@example.com' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

/**
 * Mock external services
 */
const mockExternalServices = () => {
  // Mock TMDB API - will be setup individually in each test
  // Mock Gemini AI - will be setup individually in each test
  // This function is kept for compatibility but does nothing
};

/**
 * Create test user data
 */
const createTestUser = () => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword123',
  preferences: {
    favoriteGenres: ['Action', 'Drama'],
    preferredLanguage: 'en'
  },
  watchHistory: [],
  favorites: []
});

/**
 * Create test movie data
 */
const createTestMovie = () => ({
  tmdbId: 12345,
  title: 'Test Movie',
  overview: 'A test movie for testing purposes',
  genres: ['Action', 'Adventure'],
  releaseDate: '2023-01-01',
  runtime: 120,
  voteAverage: 8.5,
  posterPath: '/test-poster.jpg',
  backdropPath: '/test-backdrop.jpg'
});

/**
 * Create test review data
 */
const createTestReview = (userId, movieId) => ({
  userId,
  movieId,
  rating: 4.5,
  comment: 'Great movie! Really enjoyed it.',
  spoilers: false,
  timestamp: new Date()
});

// Export all functions
export {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  generateTestToken,
  mockExternalServices,
  createTestUser,
  createTestMovie,
  createTestReview
}; 