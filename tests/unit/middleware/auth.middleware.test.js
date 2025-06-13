/**
 * Unit tests for Auth Middleware
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { authenticateToken, authorizeRole } from '../../../src/middleware/auth.middleware.js';
import { verifyToken } from '../../../src/config/jwt.config.js';
import User from '../../../src/models/user/user.model.js';
import { clearDatabase } from '../../helpers/testSetup.js';

// Mock dependencies
jest.mock('../../../src/config/jwt.config.js');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(async () => {
    await clearDatabase();

    mockReq = {
      headers: {},
      user: null
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    let testUser;

    beforeEach(async () => {
      // Create test user
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        role: 'user',
        is_active: true
      });
      await testUser.save();
    });

    it('should authenticate valid token successfully', async () => {
      const token = 'valid-jwt-token';
      mockReq.headers.authorization = `Bearer ${token}`;

      // Mock verifyToken to return decoded user info
      verifyToken.mockReturnValue({
        id: testUser._id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role
      });

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(mockReq.user).toEqual({
        id: testUser._id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', async () => {
      // No authorization header
      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Authentication token is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', async () => {
      mockReq.headers.authorization = 'InvalidHeader';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Authentication token is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when token is invalid', async () => {
      const token = 'invalid-jwt-token';
      mockReq.headers.authorization = `Bearer ${token}`;

      // Mock verifyToken to throw error
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not found', async () => {
      const token = 'valid-jwt-token';
      mockReq.headers.authorization = `Bearer ${token}`;

      // Mock verifyToken to return non-existent user ID
      verifyToken.mockReturnValue({
        id: '507f1f77bcf86cd799439011', // Valid ObjectId but non-existent user
        username: 'nonexistent',
        email: 'nonexistent@example.com',
        role: 'user'
      });

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found or inactive'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is inactive', async () => {
      // Update user to inactive
      testUser.is_active = false;
      await testUser.save();

      const token = 'valid-jwt-token';
      mockReq.headers.authorization = `Bearer ${token}`;

      // Mock verifyToken to return valid user info
      verifyToken.mockReturnValue({
        id: testUser._id,
        username: testUser.username,
        email: testUser.email,
        role: testUser.role
      });

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found or inactive'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRole', () => {
    beforeEach(() => {
      // Set up authenticated user in request
      mockReq.user = {
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
    });

    it('should authorize user with correct role', () => {
      const middleware = authorizeRole(['user', 'admin']);
      
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should authorize user with single role string', () => {
      const middleware = authorizeRole('user');
      
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject user with incorrect role', () => {
      const middleware = authorizeRole(['admin', 'reviewer']);
      
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authorized to access this resource'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request without authenticated user', () => {
      mockReq.user = null;
      const middleware = authorizeRole(['user']);
      
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authenticated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle admin role authorization', () => {
      mockReq.user.role = 'admin';
      const middleware = authorizeRole(['admin']);
      
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle reviewer role authorization', () => {
      mockReq.user.role = 'reviewer';
      const middleware = authorizeRole(['reviewer', 'admin']);
      
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle multiple role authorization', () => {
      const middleware = authorizeRole(['user', 'reviewer', 'admin']);
      
      // Test with user role
      mockReq.user.role = 'user';
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reset mocks
      jest.clearAllMocks();

      // Test with reviewer role
      mockReq.user.role = 'reviewer';
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reset mocks
      jest.clearAllMocks();

      // Test with admin role
      mockReq.user.role = 'admin';
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
}); 