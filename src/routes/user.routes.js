/**
 * User routes module
 * Defines API endpoints for user management and authentication
 * @file user.routes.js
 * @module routes/userRoutes
 */

import { Router } from 'express';
import userController from "../controllers/user.controller.js";
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Public authentication routes (no authentication required)
 */

/**
 * POST /users/register
 * Register a new user account
 * @name RegisterUser
 * @route {POST} /register
 * @group Users - User management operations
 */
router.post('/register', userController.register);

/**
 * POST /users/login
 * Authenticate user and generate JWT token
 * @name LoginUser
 * @route {POST} /login
 * @group Users - User management operations
 */
router.post('/login', userController.login);

/**
 * Authentication middleware applied to all routes below this point
 * All subsequent routes require valid JWT token
 */
router.use(authenticateToken);

/**
 * Protected routes that require authentication
 */

/**
 * GET /users/search
 * Search for users by username or email
 * @name SearchUsers
 * @route {GET} /search
 * @group Users - User management operations
 * @security JWT
 */
router.get('/search', userController.searchUsers);

/**
 * GET /users/:id
 * Get user details by ID
 * @name GetUserById
 * @route {GET} /:id
 * @group Users - User management operations
 * @security JWT
 */
router.get('/:id', userController.getUserById);

/**
 * GET /users/:id/stats
 * Get user statistics and activity data
 * @name GetUserStats
 * @route {GET} /:id/stats
 * @group Users - User management operations
 * @security JWT
 */
router.get('/:id/stats', userController.getUserStats);

/**
 * PUT /users/:id
 * Update user profile information
 * @name UpdateUser
 * @route {PUT} /:id
 * @group Users - User management operations
 * @security JWT
 */
router.put('/:id', userController.updateUser);

/**
 * PATCH /users/:id/password
 * Change user password
 * @name ChangePassword
 * @route {PATCH} /:id/password
 * @group Users - User management operations
 * @security JWT
 */
router.patch('/:id/password', userController.changePassword);

/**
 * Admin-only routes (require admin role)
 */

/**
 * GET /users/
 * Get all users (admin only)
 * @name GetAllUsers
 * @route {GET} /
 * @group Users - User management operations
 * @security JWT
 * @requires admin role
 */
router.get('/', authorizeRole(['admin']), userController.getAllUsers);

/**
 * DELETE /users/:id
 * Delete user account (admin only)
 * @name DeleteUser
 * @route {DELETE} /:id
 * @group Users - User management operations
 * @security JWT
 * @requires admin role
 */
router.delete('/:id', authorizeRole(['admin']), userController.deleteUser);

/**
 * PATCH /users/:id/role
 * Change user role (admin only)
 * @name ChangeUserRole
 * @route {PATCH} /:id/role
 * @group Users - User management operations
 * @security JWT
 * @requires admin role
 */
router.patch('/:id/role', authorizeRole(['admin']), userController.changeUserRole);

/**
 * PATCH /users/:id/activate
 * Activate user account (admin only)
 * @name ActivateUser
 * @route {PATCH} /:id/activate
 * @group Users - User management operations
 * @security JWT
 * @requires admin role
 */
router.patch('/:id/activate', authorizeRole(['admin']), userController.activateUser);

/**
 * PATCH /users/:id/deactivate
 * Deactivate user account (admin only)
 * @name DeactivateUser
 * @route {PATCH} /:id/deactivate
 * @group Users - User management operations
 * @security JWT
 * @requires admin role
 */
router.patch('/:id/deactivate', authorizeRole(['admin']), userController.deactivateUser);

export default router;
