/**
 * Unit tests for Review model
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import Review from '../../../src/models/review/review.model.js';
import User from '../../../src/models/user/user.model.js';
import { clearDatabase } from '../../helpers/testSetup.js';
import mongoose from 'mongoose';

describe('Review Model', () => {
  let testUserId;

  beforeEach(async () => {
    await clearDatabase();
    
    // Create a test user for review references
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword123'
    });
    const savedUser = await testUser.save();
    testUserId = savedUser._id;
  });

  describe('Review Creation', () => {
    it('should create a review with required fields', async () => {
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

      expect(savedReview.user_id).toEqual(testUserId);
      expect(savedReview.tmdb_id).toBe(reviewData.tmdb_id);
      expect(savedReview.content_type).toBe(reviewData.content_type);
      expect(savedReview.title).toBe(reviewData.title);
      expect(savedReview.content).toBe(reviewData.content);
      expect(savedReview.rating).toBe(reviewData.rating);
      expect(savedReview.is_critic).toBe(false); // default value
      expect(savedReview.is_spoiler).toBe(false); // default value
      expect(savedReview.is_approved).toBe(true); // default value
      expect(savedReview.likes_count).toBe(0); // default value
      expect(savedReview.dislikes_count).toBe(0); // default value
      expect(savedReview.created_at).toBeDefined();
      expect(savedReview.updated_at).toBeDefined();
    });

    it('should fail to create review without required fields', async () => {
      const review = new Review({});
      await expect(review.save()).rejects.toThrow();
    });

    it('should fail to create review without user_id', async () => {
      const reviewData = {
        tmdb_id: 12345,
        content_type: 'movie',
        title: 'Test Movie',
        content: 'This is a great movie!',
        rating: 4.5
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    it('should fail to create review without tmdb_id', async () => {
      const reviewData = {
        user_id: testUserId,
        content_type: 'movie',
        title: 'Test Movie',
        content: 'This is a great movie!',
        rating: 4.5
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    it('should fail to create review without content_type', async () => {
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        title: 'Test Movie',
        content: 'This is a great movie!',
        rating: 4.5
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    it('should fail to create review without title', async () => {
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'movie',
        content: 'This is a great movie!',
        rating: 4.5
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    it('should fail to create review without content', async () => {
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'movie',
        title: 'Test Movie',
        rating: 4.5
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    it('should fail to create review without rating', async () => {
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'movie',
        title: 'Test Movie',
        content: 'This is a great movie!'
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });
  });

  describe('Review Validation', () => {
    it('should validate content_type enum values', async () => {
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'invalid_type',
        title: 'Test Movie',
        content: 'This is a great movie!',
        rating: 4.5
      };

      const review = new Review(reviewData);
      await expect(review.save()).rejects.toThrow();
    });

    it('should accept valid content_type values', async () => {
      const contentTypes = ['movie', 'series'];
      
      for (const contentType of contentTypes) {
        const reviewData = {
          user_id: testUserId,
          tmdb_id: 12345 + contentTypes.indexOf(contentType),
          content_type: contentType,
          title: `Test ${contentType}`,
          content: `This is a great ${contentType}!`,
          rating: 4.5
        };

        const review = new Review(reviewData);
        const savedReview = await review.save();
        
        expect(savedReview.content_type).toBe(contentType);
      }
    });

    it('should validate rating range (1-5)', async () => {
      const invalidRatings = [0, 6, -1, 10];
      
      for (const invalidRating of invalidRatings) {
        const reviewData = {
          user_id: testUserId,
          tmdb_id: 12345,
          content_type: 'movie',
          title: 'Test Movie',
          content: 'This is a great movie!',
          rating: invalidRating
        };

        const review = new Review(reviewData);
        await expect(review.save()).rejects.toThrow();
      }
    });

    it('should accept valid rating values', async () => {
      const validRatings = [1, 2, 3, 4, 5, 1.5, 2.5, 3.5, 4.5];
      
      for (const validRating of validRatings) {
        const reviewData = {
          user_id: testUserId,
          tmdb_id: 12345 + validRatings.indexOf(validRating),
          content_type: 'movie',
          title: 'Test Movie',
          content: 'This is a great movie!',
          rating: validRating
        };

        const review = new Review(reviewData);
        const savedReview = await review.save();
        
        expect(savedReview.rating).toBe(validRating);
      }
    });

    it('should trim whitespace from string fields', async () => {
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'movie',
        title: '  Test Movie  ',
        content: '  This is a great movie!  ',
        rating: 4.5
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();

      expect(savedReview.title).toBe('Test Movie');
      expect(savedReview.content).toBe('This is a great movie!');
    });
  });

  describe('Review Optional Fields', () => {
    it('should save review with all optional fields', async () => {
      const reviewData = {
        user_id: testUserId,
        tmdb_id: 12345,
        content_type: 'movie',
        title: 'Test Movie',
        content: 'This is a great movie!',
        rating: 4.5,
        is_critic: true,
        is_spoiler: true,
        is_approved: false,
        likes_count: 10,
        dislikes_count: 2
      };

      const review = new Review(reviewData);
      const savedReview = await review.save();

      expect(savedReview.is_critic).toBe(true);
      expect(savedReview.is_spoiler).toBe(true);
      expect(savedReview.is_approved).toBe(false);
      expect(savedReview.likes_count).toBe(10);
      expect(savedReview.dislikes_count).toBe(2);
    });
  });

  describe('Review Population', () => {
    it('should populate user information', async () => {
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
      expect(populatedReview.user_id.username).toBe('testuser');
      expect(populatedReview.user_id.email).toBe('test@example.com');
    });
  });

  describe('Review Queries', () => {
    beforeEach(async () => {
      // Create multiple reviews for testing queries
      const reviews = [
        {
          user_id: testUserId,
          tmdb_id: 12345,
          content_type: 'movie',
          title: 'Test Movie 1',
          content: 'Great movie!',
          rating: 4.5,
          is_approved: true
        },
        {
          user_id: testUserId,
          tmdb_id: 12346,
          content_type: 'series',
          title: 'Test Series 1',
          content: 'Great series!',
          rating: 4.0,
          is_approved: false
        },
        {
          user_id: testUserId,
          tmdb_id: 12347,
          content_type: 'movie',
          title: 'Test Movie 2',
          content: 'Another great movie!',
          rating: 5.0,
          is_approved: true
        }
      ];

      await Review.insertMany(reviews);
    });

    it('should find reviews by user_id', async () => {
      const userReviews = await Review.find({ user_id: testUserId });
      expect(userReviews).toHaveLength(3);
    });

    it('should find reviews by content_type', async () => {
      const movieReviews = await Review.find({ content_type: 'movie' });
      const seriesReviews = await Review.find({ content_type: 'series' });
      
      expect(movieReviews).toHaveLength(2);
      expect(seriesReviews).toHaveLength(1);
    });

    it('should find approved reviews only', async () => {
      const approvedReviews = await Review.find({ is_approved: true });
      expect(approvedReviews).toHaveLength(2);
    });

    it('should find reviews by rating range', async () => {
      const highRatedReviews = await Review.find({ rating: { $gte: 4.5 } });
      expect(highRatedReviews).toHaveLength(2);
    });
  });
}); 