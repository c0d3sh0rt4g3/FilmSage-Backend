/**
 * Unit tests for User Controller
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import { clearDatabase, generateTestToken } from '../../helpers/testSetup.js';
import User from '../../../src/models/user/user.model.js';
import { generateToken } from '../../../src/config/jwt.config.js';

// Mock bcrypt
jest.mock('bcrypt');
jest.mock('../../../src/config/jwt.config.js');

describe('User Controller', () => {
  let userController;
  let mockReq;
  let mockRes;

  beforeEach(async () => {
    await clearDatabase();
    
    // Dynamic import to avoid hoisting issues
    const module = await import('../../../src/controllers/user.controller.js');
    userController = module.default;

    // Mock request and response objects
    mockReq = {
      body: {},
      params: {},
      user: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      mockReq.body = userData;

      // Mock bcrypt functions
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedpassword123');

      // Mock generateToken
      generateToken.mockReturnValue('fake-jwt-token');

      // Mock validationResult to return empty errors
      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      };

      // Mock the validation result - this would normally be done at the route level
      const originalValidationResult = await import('express-validator');
      jest.spyOn(originalValidationResult, 'validationResult').mockReturnValue(mockValidationResult);

      await userController.register(mockReq, mockRes);

      // Verify user was created
      const createdUser = await User.findOne({ email: userData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.username).toBe(userData.username);
      expect(createdUser.email).toBe(userData.email);

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User registered successfully',
          token: 'fake-jwt-token',
          user: expect.objectContaining({
            username: userData.username,
            email: userData.email
          })
        })
      );
    });

    it('should return error for duplicate email', async () => {
      // Create existing user
      const existingUser = new User({
        username: 'existinguser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      });
      await existingUser.save();

      const userData = {
        username: 'newuser',
        email: 'test@example.com',
        password: 'password123'
      };

      mockReq.body = userData;

      // Mock validation result
      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      };

      const originalValidationResult = await import('express-validator');
      jest.spyOn(originalValidationResult, 'validationResult').mockReturnValue(mockValidationResult);

      await userController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User with this email or username already exists'
      });
    });

    it('should return error for duplicate username', async () => {
      // Create existing user
      const existingUser = new User({
        username: 'testuser',
        email: 'existing@example.com',
        password_hash: 'hashedpassword'
      });
      await existingUser.save();

      const userData = {
        username: 'testuser',
        email: 'new@example.com',
        password: 'password123'
      };

      mockReq.body = userData;

      // Mock validation result
      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      };

      const originalValidationResult = await import('express-validator');
      jest.spyOn(originalValidationResult, 'validationResult').mockReturnValue(mockValidationResult);

      await userController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User with this email or username already exists'
      });
    });

    it('should return error for invalid role', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid_role'
      };

      mockReq.body = userData;

      // Mock validation result
      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      };

      const originalValidationResult = await import('express-validator');
      jest.spyOn(originalValidationResult, 'validationResult').mockReturnValue(mockValidationResult);

      await userController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid role specified'
      });
    });
  });

  describe('login', () => {
    let testUser;

    beforeEach(async () => {
      // Create test user
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        is_active: true
      });
      await testUser.save();
    });

    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockReq.body = loginData;

      // Mock bcrypt compare
      bcrypt.compare.mockResolvedValue(true);

      // Mock generateToken
      generateToken.mockReturnValue('fake-jwt-token');

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: 'fake-jwt-token',
          user: expect.objectContaining({
            email: loginData.email,
            username: 'testuser'
          })
        })
      );
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      mockReq.body = loginData;

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockReq.body = loginData;

      // Mock bcrypt compare to return false
      bcrypt.compare.mockResolvedValue(false);

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    it('should return error for inactive user', async () => {
      // Update user to inactive
      testUser.is_active = false;
      await testUser.save();

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockReq.body = loginData;

      // Mock bcrypt compare
      bcrypt.compare.mockResolvedValue(true);

      await userController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Account is deactivated'
      });
    });
  });

  describe('getAllUsers', () => {
    beforeEach(async () => {
      // Create test users
      const users = [
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hash1'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hash2'
        }
      ];

      await User.insertMany(users);
    });

    it('should return all users', async () => {
      await userController.getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          users: expect.arrayContaining([
            expect.objectContaining({
              username: 'user1',
              email: 'user1@example.com'
            }),
            expect.objectContaining({
              username: 'user2',
              email: 'user2@example.com'
            })
          ])
        })
      );

      // Verify passwords are not included
      const response = mockRes.json.mock.calls[0][0];
      response.users.forEach(user => {
        expect(user.password_hash).toBeUndefined();
      });
    });
  });

  describe('getUserById', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
      });
      await testUser.save();
    });

    it('should return user by ID', async () => {
      mockReq.params = { id: testUser._id.toString() };

      await userController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            username: 'testuser',
            email: 'test@example.com'
          })
        })
      );

      // Verify password is not included
      const response = mockRes.json.mock.calls[0][0];
      expect(response.user.password_hash).toBeUndefined();
    });

    it('should return error for non-existent user', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }; // Valid ObjectId but non-existent

      await userController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User with id 507f1f77bcf86cd799439011 not found'
      });
    });
  });
}); 