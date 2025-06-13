/**
 * Review model schema
 * Defines the structure for movie and TV show reviews in the FilmSage application
 * @file review.model.js
 * @module models/Review
 */

import mongoose from 'mongoose';

/**
 * Review schema definition
 * @typedef {Object} ReviewSchema
 * @property {ObjectId} user_id - Reference to the user who created the review
 * @property {number} tmdb_id - TMDB (The Movie Database) ID of the content
 * @property {string} content_type - Type of content (movie or series)
 * @property {string} title - Title of the reviewed content
 * @property {string} content - The review text content
 * @property {number} rating - User rating from 1 to 5 stars
 * @property {boolean} is_critic - Whether this is a professional critic review
 * @property {boolean} is_spoiler - Whether the review contains spoilers
 * @property {boolean} is_approved - Moderation approval status
 * @property {number} likes_count - Number of likes received
 * @property {number} dislikes_count - Number of dislikes received
 * @property {Date} created_at - Review creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */
const reviewSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tmdb_id: {
    type: Number,
    required: true,
  },
  content_type: {
    type: String,
    enum: ['movie', 'series'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  is_critic: {
    type: Boolean,
    default: false,
  },
  is_spoiler: {
    type: Boolean,
    default: false,
  },
  is_approved: {
    type: Boolean,
    default: true,
  },
  likes_count: {
    type: Number,
    default: 0,
  },
  dislikes_count: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

/**
 * Review model
 * @type {mongoose.Model<ReviewSchema>}
 */
const Review = mongoose.model('Review', reviewSchema);

export default Review;
