/**
 * JWT (JSON Web Token) configuration module
 * Handles token generation and verification for user authentication
 * @file jwt.config.js
 * @module config/jwt
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * JWT secret key from environment variables with fallback
 * @constant {string}
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Token expiration time
 * @constant {string}
 */
const JWT_EXPIRES_IN = '24h';

/**
 * Generates a JWT token for user authentication
 * @function generateToken
 * @param {Object} user - User object containing authentication information
 * @param {string} user._id - User's unique identifier
 * @param {string} user.role - User's role (user, admin, reviewer)
 * @param {string} user.username - User's username
 * @returns {string} JWT token string
 * @example
 * const token = generateToken({
 *   _id: '507f1f77bcf86cd799439011',
 *   role: 'user',
 *   username: 'john_doe'
 * });
 */
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verifies and decodes a JWT token
 * @function verifyToken
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload containing user information
 * @throws {Error} When token is invalid or expired
 * @example
 * try {
 *   const decoded = verifyToken(token);
 *   console.log(decoded.id); // User ID
 * } catch (error) {
 *   console.error('Invalid token');
 * }
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}; 