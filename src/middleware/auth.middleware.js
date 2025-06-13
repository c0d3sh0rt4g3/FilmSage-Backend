/**
 * Authentication middleware module
 * Provides token verification and role-based authorization
 * @file auth.middleware.js
 * @module middleware/auth
 */

import { verifyToken } from '../config/jwt.config.js';
import User from '../models/user/user.model.js';

/**
 * Middleware to authenticate JWT tokens and attach user information to request
 * @async
 * @function authenticateToken
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers.authorization - Authorization header containing Bearer token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 * @throws {Object} 401 status when token is missing
 * @throws {Object} 403 status when token is invalid or user not found/inactive
 * @example
 * // Usage in routes
 * app.get('/protected', authenticateToken, (req, res) => {
 *   console.log(req.user.id); // Authenticated user ID
 * });
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.is_active) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware factory for role-based authorization
 * @function authorizeRole
 * @param {string|string[]} roles - Required role(s) for access
 * @returns {Function} Express middleware function
 * @example
 * // Single role
 * app.delete('/admin/users/:id', authenticateToken, authorizeRole('admin'), deleteUser);
 * 
 * // Multiple roles
 * app.post('/reviews', authenticateToken, authorizeRole(['user', 'reviewer']), createReview);
 */
export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Not authorized to access this resource' 
      });
    }

    next();
  };
}; 