import User from '../models/user/user.model.js';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { generateToken } from '../config/jwt.config.js';

/**
 * User controller containing methods for user management
 * @module controllers/userController
 */
const userController = {
  /**
   * Register a new user
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.username - Username for the new user
   * @param {string} req.body.email - Email for the new user
   * @param {string} req.body.password - Password for the new user
   * @param {string} [req.body.role='user'] - Role for the new user (user, admin, or reviewer)
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with user data or error message
   */
  register: async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, role = 'user' } = req.body;

      // Check if user already exists - SINTAXIS MONGOOSE
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(409).json({
          message: 'User with this email or username already exists'
        });
      }

      // Validate role
      if (!['user', 'admin', 'reviewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user - SINTAXIS MONGOOSE
      const newUser = new User({
        username,
        email,
        password_hash,
        role,
        is_active: true
      });

      const savedUser = await newUser.save();

      // Remove password from response
      const userResponse = savedUser.toObject();
      delete userResponse.password_hash;

      // Generate JWT token
      const token = generateToken(savedUser);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: userResponse
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  },

  /**
   * Authenticate a user and return user data
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.email - User's email
   * @param {string} req.body.password - User's password
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with authentication status
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user - SINTAXIS MONGOOSE
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = generateToken(user);

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  },

  /**
   * Get all users (admin only)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with all users
   */
  getAllUsers: async (req, res) => {
    try {
      // SINTAXIS MONGOOSE - excluir password_hash
      const users = await User.find({}, '-password_hash');

      res.status(200).json({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error while fetching users' });
    }
  },

  /**
   * Get user by ID
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with user data
   */
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      // SINTAXIS MONGOOSE
      const user = await User.findById(id, '-password_hash');

      if (!user) {
        return res.status(404).json({ message: `User with id ${id} not found` });
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error while fetching user' });
    }
  },

  /**
   * Update user information
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - User ID
   * @param {Object} req.body - Request body
   * @param {string} [req.body.username] - New username
   * @param {string} [req.body.email] - New email
   * @param {string} [req.body.role] - New role (admin only)
   * @param {boolean} [req.body.is_active] - New active status (admin only)
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with updated user data
   */
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, role, is_active } = req.body;

      // Find user - SINTAXIS MONGOOSE
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check permissions (user can update own profile, admin can update any)
      if (req.user && req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ message: 'Not authorized to update this user' });
      }

      // Prepare update data
      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;

      // Only admin can change role and active status
      if (req.user && req.user.role === 'admin') {
        if (role && ['user', 'admin', 'reviewer'].includes(role)) {
          updateData.role = role;
        }
        if (is_active !== undefined) {
          updateData.is_active = is_active;
        }
      }

      // Update user - SINTAXIS MONGOOSE
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, select: '-password_hash' }
      );

      res.status(200).json({
        message: 'User updated successfully',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          is_active: updatedUser.is_active
        }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Server error while updating user' });
    }
  },

  /**
   * Change user password
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - User ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.currentPassword - Current password (required for non-admin)
   * @param {string} req.body.newPassword - New password
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  changePassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Find user - SINTAXIS MONGOOSE
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check permissions (user can change own password, admin can change any)
      if (req.user && req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ message: 'Not authorized to change this password' });
      }

      // For non-admin users, verify current password
      if (req.user && req.user.role !== 'admin') {
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      // Update password - SINTAXIS MONGOOSE
      await User.findByIdAndUpdate(id, { password_hash });

      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Server error while changing password' });
    }
  },

  /**
   * Delete a user (admin only)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - User ID
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // SINTAXIS MONGOOSE
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Only admin can delete users
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete users' });
      }

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Server error while deleting user' });
    }
  },

  /**
   * Change user role (admin only)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - User ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.role - New role (user, admin, or reviewer)
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  changeUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['user', 'admin', 'reviewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }

      // SINTAXIS MONGOOSE
      const user = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true, select: '-password_hash' }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Only admin can change roles
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to change user roles' });
      }

      res.status(200).json({
        message: 'User role updated successfully',
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error changing user role:', error);
      res.status(500).json({ message: 'Server error while changing user role' });
    }
  },

  /**
   * Activate a user (admin only)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - User ID
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  activateUser: async (req, res) => {
    try {
      const { id } = req.params;

      // SINTAXIS MONGOOSE
      const user = await User.findByIdAndUpdate(
        id,
        { is_active: true },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Only admin can activate users
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to activate users' });
      }

      res.status(200).json({ message: 'User activated successfully' });
    } catch (error) {
      console.error('Error activating user:', error);
      res.status(500).json({ message: 'Server error while activating user' });
    }
  },

  /**
   * Deactivate a user (admin only)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - User ID
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  deactivateUser: async (req, res) => {
    try {
      const { id } = req.params;

      // SINTAXIS MONGOOSE
      const user = await User.findByIdAndUpdate(
        id,
        { is_active: false },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Only admin can deactivate users
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to deactivate users' });
      }

      res.status(200).json({ message: 'User deactivated successfully' });
    } catch (error) {
      console.error('Error deactivating user:', error);
      res.status(500).json({ message: 'Server error while deactivating user' });
    }
  }
};

export default userController;