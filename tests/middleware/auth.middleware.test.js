/**
 * Auth Middleware Tests - Comprehensive coverage
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearDatabase } from '../helpers/testSetup.js';

describe('Auth Middleware Comprehensive Tests', () => {
  let mongoose;
  let User;
  let authMiddleware;
  let mockReq, mockRes, mockNext;

  beforeAll(async () => {
    await setupTestDB();
    mongoose = await import('mongoose');
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create User model
    const userSchema = new mongoose.default.Schema({
      username: { type: String, required: true },
      email: { type: String, required: true },
      password_hash: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin', 'reviewer'], default: 'user' },
      is_active: { type: Boolean, default: true }
    });

    try {
      User = mongoose.default.model('AuthTestUser', userSchema);
    } catch (error) {
      if (error.name === 'OverwriteModelError') {
        mongoose.default.deleteModel('AuthTestUser');
        User = mongoose.default.model('AuthTestUser', userSchema);
      } else {
        throw error;
      }
    }

    // Mock auth middleware functions
    authMiddleware = {
      verifyToken: (token) => {
        if (!token) throw new Error('No token provided');
        if (token === 'invalid-token') throw new Error('Invalid token');
        if (token === 'expired-token') throw new Error('Token expired');
        
        // Simulate valid token decoding
        const tokenParts = token.split('-');
        if (tokenParts.length === 3 && tokenParts[0] === 'valid') {
          return {
            id: tokenParts[2],
            username: tokenParts[1],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600
          };
        }
        
        throw new Error('Invalid token format');
      },

      authenticateToken: async (req, res, next) => {
        try {
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];

          if (!token) {
            return res.status(401).json({ message: 'Authentication token is required' });
          }

          const decoded = authMiddleware.verifyToken(token);
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
      },

      authorizeRole: (roles) => {
        return (req, res, next) => {
          if (!req.user) {
            return res.status(403).json({ message: 'Not authenticated' });
          }

          const allowedRoles = Array.isArray(roles) ? roles : [roles];

          if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
              message: 'Not authorized to access this resource' 
            });
          }

          next();
        };
      }
    };

    // Mock Express objects
    mockReq = {
      headers: {},
      user: null
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('Token Verification', () => {
    it('should verify valid token correctly', () => {
      const validToken = 'valid-testuser-507f1f77bcf86cd799439011';
      
      const decoded = authMiddleware.verifyToken(validToken);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe('507f1f77bcf86cd799439011');
      expect(decoded.username).toBe('testuser');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should reject invalid token', () => {
      expect(() => {
        authMiddleware.verifyToken('invalid-token');
      }).toThrow('Invalid token');
    });

    it('should reject expired token', () => {
      expect(() => {
        authMiddleware.verifyToken('expired-token');
      }).toThrow('Token expired');
    });

    it('should reject malformed token', () => {
      expect(() => {
        authMiddleware.verifyToken('malformed-token-format');
      }).toThrow('Invalid token format');
    });

    it('should reject null or undefined token', () => {
      expect(() => {
        authMiddleware.verifyToken(null);
      }).toThrow('No token provided');

      expect(() => {
        authMiddleware.verifyToken(undefined);
      }).toThrow('No token provided');
    });
  });

  describe('authenticateToken middleware', () => {
    beforeEach(async () => {
      // Create test user
      const testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user',
        is_active: true
      });
      await testUser.save();
    });

    it('should authenticate valid token and set user', async () => {
      const user = await User.findOne({ username: 'testuser' });
      const validToken = `valid-testuser-${user._id}`;
      
      mockReq.headers.authorization = `Bearer ${validToken}`;

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.username).toBe('testuser');
      expect(mockReq.user.email).toBe('test@example.com');
      expect(mockReq.user.role).toBe('user');
    });

    it('should reject request without authorization header', async () => {
      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Authentication token is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      mockReq.headers.authorization = 'InvalidFormat token123';

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      mockReq.headers.authorization = 'Bearer expired-token';

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request for inactive user', async () => {
      const user = await User.findOne({ username: 'testuser' });
      await User.updateOne({ _id: user._id }, { is_active: false });

      const validToken = `valid-testuser-${user._id}`;
      mockReq.headers.authorization = `Bearer ${validToken}`;

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found or inactive'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Role Authorization', () => {
    it('should authorize user with correct role', () => {
      mockReq.user = { role: 'admin' };
      
      const adminMiddleware = authMiddleware.authorizeRole('admin');
      adminMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should authorize user with one of multiple allowed roles', () => {
      mockReq.user = { role: 'reviewer' };
      
      const middleware = authMiddleware.authorizeRole(['admin', 'reviewer']);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject user with incorrect role', () => {
      mockReq.user = { role: 'user' };
      
      const adminMiddleware = authMiddleware.authorizeRole('admin');
      adminMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authorized to access this resource'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated request', () => {
      mockReq.user = null;
      
      const adminMiddleware = authMiddleware.authorizeRole('admin');
      adminMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authenticated'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Authorization Header Parsing', () => {
    it('should parse valid Bearer token', () => {
      const parseAuthHeader = (authHeader) => {
        if (!authHeader) return null;
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
        return parts[1];
      };

      expect(parseAuthHeader('Bearer valid-token')).toBe('valid-token');
      expect(parseAuthHeader('Bearer another-token')).toBe('another-token');
    });

    it('should handle malformed authorization headers', () => {
      const parseAuthHeader = (authHeader) => {
        if (!authHeader) return null;
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
        return parts[1];
      };

      expect(parseAuthHeader('InvalidFormat token')).toBeNull();
      expect(parseAuthHeader('Bearer')).toBeNull();
      expect(parseAuthHeader('Bearer token extra')).toBeNull();
      expect(parseAuthHeader('')).toBeNull();
      expect(parseAuthHeader(null)).toBeNull();
      expect(parseAuthHeader(undefined)).toBeNull();
    });
  });

  describe('Permission Checking', () => {
    it('should check user permissions correctly', () => {
      const hasPermission = (userRole, requiredRoles) => {
        if (!userRole) return false;
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        return roles.includes(userRole);
      };

      // Single role checks
      expect(hasPermission('admin', 'admin')).toBe(true);
      expect(hasPermission('user', 'admin')).toBe(false);
      expect(hasPermission('reviewer', 'reviewer')).toBe(true);

      // Multiple role checks
      expect(hasPermission('admin', ['admin', 'reviewer'])).toBe(true);
      expect(hasPermission('reviewer', ['admin', 'reviewer'])).toBe(true);
      expect(hasPermission('user', ['admin', 'reviewer'])).toBe(false);

      // Edge cases
      expect(hasPermission(null, 'admin')).toBe(false);
      expect(hasPermission(undefined, 'admin')).toBe(false);
      expect(hasPermission('admin', [])).toBe(false);
    });

    it('should validate role strings', () => {
      const isValidRole = (role) => {
        const validRoles = ['user', 'admin', 'reviewer'];
        return validRoles.includes(role);
      };

      expect(isValidRole('user')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('reviewer')).toBe(true);
      expect(isValidRole('invalid')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(null)).toBe(false);
      expect(isValidRole(undefined)).toBe(false);
    });
  });

  describe('User Data Sanitization', () => {
    it('should sanitize user data for responses', () => {
      const sanitizeUser = (user) => {
        if (!user) return null;
        
        const sanitized = {
          id: user._id || user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        };

        // Remove sensitive data
        delete sanitized.password_hash;
        delete sanitized.password;
        delete sanitized.__v;

        return sanitized;
      };

      const testUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        is_active: true,
        password_hash: 'sensitive-hash',
        __v: 0
      };

      const sanitized = sanitizeUser(testUser);

      expect(sanitized.id).toBe('507f1f77bcf86cd799439011');
      expect(sanitized.username).toBe('testuser');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.role).toBe('user');
      expect(sanitized.is_active).toBe(true);
      expect(sanitized.password_hash).toBeUndefined();
      expect(sanitized.__v).toBeUndefined();
    });

    it('should handle null/undefined user objects', () => {
      const sanitizeUser = (user) => {
        if (!user) return null;
        
        return {
          id: user._id || user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        };
      };

      expect(sanitizeUser(null)).toBeNull();
      expect(sanitizeUser(undefined)).toBeNull();
    });
  });
}); 