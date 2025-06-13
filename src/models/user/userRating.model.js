/**
 * User Rating model schema
 * Defines user ratings for movies and TV shows separate from reviews
 * @file userRating.model.js
 * @module models/UserRating
 */

import mongoose from 'mongoose';

/**
 * User Rating schema definition
 * @typedef {Object} UserRatingSchema
 * @property {ObjectId} user_id - Reference to the user who gave the rating
 * @property {number} tmdb_id - TMDB ID of the rated content
 * @property {string} content_type - Type of content (movie or series)
 * @property {number} rating - User rating from 1 to 5 stars
 * @property {Date} created_at - Rating creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */
const userRatingSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

/**
 * Compound index to ensure one rating per user per content item
 */
userRatingSchema.index({ user_id: 1, tmdb_id: 1, content_type: 1 }, { unique: true });

/**
 * UserRating model
 * @type {mongoose.Model<UserRatingSchema>}
 */
const UserRating = mongoose.model('UserRating', userRatingSchema);

export default UserRating;
