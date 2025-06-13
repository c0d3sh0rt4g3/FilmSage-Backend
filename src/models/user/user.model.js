/**
 * User model schema
 * Defines the structure for user accounts in the FilmSage application
 * @file user.model.js
 * @module models/User
 */

import mongoose from 'mongoose';

/**
 * User schema definition
 * @typedef {Object} UserSchema
 * @property {string} username - Unique username for the user
 * @property {string} email - Unique email address (lowercase, trimmed)
 * @property {string} password_hash - Hashed password for authentication
 * @property {string} role - User role (user, admin, reviewer)
 * @property {boolean} is_active - Account activation status
 * @property {string} [full_name] - User's full name (optional)
 * @property {string} [display_name] - Display name for UI (optional)
 * @property {string} [bio] - User biography/description (optional)
 * @property {string} [avatar_url] - URL to user's avatar image (optional)
 * @property {string} [phone] - Phone number (optional)
 * @property {string} [gender] - Gender identification (optional)
 * @property {Date} [birth_date] - Date of birth (optional)
 * @property {string} [nationality] - User's nationality (optional)
 * @property {string} [address] - User's address (optional)
 * @property {string[]} favorite_genres - Array of favorite movie/TV genres
 * @property {Date} created_at - Account creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */
const userSchema = new mongoose.Schema({
  // Authentication fields
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'reviewer'],
    default: 'user',
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  
  // Profile fields (all optional)
  full_name: {
    type: String,
    trim: true,
  },
  display_name: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  avatar_url: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  },
  birth_date: {
    type: Date,
  },
  nationality: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  favorite_genres: {
    type: [String],
    default: [],
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

/**
 * User model
 * @type {mongoose.Model<UserSchema>}
 */
const User = mongoose.model('User', userSchema);

export default User;
