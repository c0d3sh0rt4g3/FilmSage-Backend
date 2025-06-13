/**
 * Tests for Models - Real coverage tests
 */

import { setupTestDB, teardownTestDB, clearDatabase } from './helpers/testSetup.js';

describe('Models Coverage Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('User Model', () => {
    it('should create and save a user', async () => {
      // Dynamic require to avoid ES module issues
      const User = (await import('../src/models/user/user.model.js')).default;
      
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('user'); // default value
      expect(savedUser.is_active).toBe(true); // default value
    });

    it('should validate required fields', async () => {
      const User = (await import('../src/models/user/user.model.js')).default;
      
      const user = new User({});
      
      try {
        await user.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should enforce unique constraints', async () => {
      const User = (await import('../src/models/user/user.model.js')).default;
      
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      
      try {
        await user2.save();
        fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).toBe(11000); // MongoDB duplicate key error
      }
    });

    it('should handle optional fields', async () => {
      const User = (await import('../src/models/user/user.model.js')).default;
      
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        full_name: 'Test User',
        bio: 'I love movies',
        favorite_genres: ['Action', 'Drama']
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.full_name).toBe(userData.full_name);
      expect(savedUser.bio).toBe(userData.bio);
      expect(savedUser.favorite_genres).toEqual(userData.favorite_genres);
    });
  });

  describe('Review Model', () => {
    let testUserId;

    beforeEach(async () => {
      const User = (await import('../src/models/user/user.model.js')).default;
      
      const user = new User({
        username: 'reviewer',
        email: 'reviewer@example.com',
        password_hash: 'hashedpassword123'
      });
      const savedUser = await user.save();
      testUserId = savedUser._id;
    });

    it('should create and save a review', async () => {
      const Review = (await import('../src/models/review/review.model.js')).default;
      
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'movie',
        title: 'Test Movie',
        content: 'This is a great movie!',
        rating: 4.5
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();

      expect(savedReview._id).toBeDefined();
      expect(savedReview.user_id).toEqual(testUserId);
      expect(savedReview.tmdb_id).toBe(reviewData.tmdb_id);
      expect(savedReview.content_type).toBe(reviewData.content_type);
      expect(savedReview.title).toBe(reviewData.title);
      expect(savedReview.content).toBe(reviewData.content);
      expect(savedReview.rating).toBe(reviewData.rating);
      expect(savedReview.is_approved).toBe(true); // default value
    });

    it('should validate rating range', async () => {
      const Review = (await import('../src/models/review/review.model.js')).default;
      
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'movie',
        title: 'Test Movie',
        content: 'This is a great movie!',
        rating: 10 // Invalid rating
      };

      const review = new Review(reviewData);
      
      try {
        await review.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should validate content_type enum', async () => {
      const Review = (await import('../src/models/review/review.model.js')).default;
      
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'invalid_type',
        title: 'Test Movie',
        content: 'This is a great movie!',
        rating: 4.5
      };

      const review = new Review(reviewData);
      
      try {
        await review.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should populate user information', async () => {
      const Review = (await import('../src/models/review/review.model.js')).default;
      
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'movie',
        title: 'Test Movie',
        content: 'This is a great movie!',
        rating: 4.5
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();
      
      const populatedReview = await Review.findById(savedReview._id).populate('user_id');
      
      expect(populatedReview.user_id).toBeDefined();
      expect(populatedReview.user_id.username).toBe('reviewer');
    });
  });
}); 