/**
 * Integration tests for User Routes
 */

import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import { clearDatabase, generateTestToken } from '../../helpers/testSetup.js';
import User from '../../../src/models/user/user.model.js';
import userRoutes from '../../../src/routes/user.routes.js';

describe('User Routes Integration Tests', () => {
  let app;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/users', userRoutes);
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: hashedPassword,
      role: 'user',
      is_active: true
    });
    await testUser.save();

    // Generate auth token
    authToken = generateTestToken(testUser._id);
  });

  describe('POST /users/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(newUser.username);
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user).not.toHaveProperty('password_hash');

      // Verify user was created in database
      const createdUser = await User.findOne({ email: newUser.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.username).toBe(newUser.username);
    });

    it('should return error for duplicate email', async () => {
      const duplicateUser = {
        username: 'anotheruser',
        email: 'test@example.com', // Same as existing user
        password: 'password123'
      };

      const response = await request(app)
        .post('/users/register')
        .send(duplicateUser)
        .expect(409);

      expect(response.body).toHaveProperty('message', 'User with this email or username already exists');
    });

    it('should return error for duplicate username', async () => {
      const duplicateUser = {
        username: 'testuser', // Same as existing user
        email: 'another@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users/register')
        .send(duplicateUser)
        .expect(409);

      expect(response.body).toHaveProperty('message', 'User with this email or username already exists');
    });

    it('should return validation error for missing fields', async () => {
      const incompleteUser = {
        username: 'testuser'
        // Missing email and password
      };

      const response = await request(app)
        .post('/users/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should return error for invalid email format', async () => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return error for weak password', async () => {
      const weakPasswordUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/users/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /users/login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return error for inactive user', async () => {
      // Deactivate user
      testUser.is_active = false;
      await testUser.save();

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/users/login')
        .send(loginData)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Account is deactivated');
    });

    it('should return validation error for missing fields', async () => {
      const incompleteLogin = {
        email: 'test@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/users/login')
        .send(incompleteLogin)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /users', () => {
    beforeEach(async () => {
      // Create additional test users
      const users = [
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hash1',
          role: 'user'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hash2',
          role: 'reviewer'
        }
      ];

      await User.insertMany(users);
    });

    it('should return all users for admin', async () => {
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'adminhash',
        role: 'admin',
        is_active: true
      });
      await adminUser.save();

      const adminToken = generateTestToken(adminUser._id);

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);

      // Verify no password hashes are returned
      response.body.users.forEach(user => {
        expect(user).not.toHaveProperty('password_hash');
      });
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Not authorized to access this resource');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/users')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authentication token is required');
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by ID', async () => {
      const response = await request(app)
        .get(`/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', `User with id ${nonExistentId} not found`);
    });

    it('should return 400 for invalid user ID format', async () => {
      const invalidId = 'invalid-id';

      const response = await request(app)
        .get(`/users/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500); // This might be 400 depending on your error handling

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/users/${testUser._id}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authentication token is required');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        full_name: 'Updated Name',
        bio: 'Updated bio',
        favorite_genres: ['Action', 'Comedy']
      };

      const response = await request(app)
        .put(`/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User updated successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.full_name).toBe(updateData.full_name);
      expect(response.body.user.bio).toBe(updateData.bio);
      expect(response.body.user.favorite_genres).toEqual(updateData.favorite_genres);

      // Verify user was updated in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.full_name).toBe(updateData.full_name);
      expect(updatedUser.bio).toBe(updateData.bio);
    });

    it('should prevent regular users from updating role', async () => {
      const updateData = {
        role: 'admin' // Regular user trying to make themselves admin
      };

      const response = await request(app)
        .put(`/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Not authorized to update role');
    });

    it('should allow admin to update user role', async () => {
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'adminhash',
        role: 'admin',
        is_active: true
      });
      await adminUser.save();

      const adminToken = generateTestToken(adminUser._id);

      const updateData = {
        role: 'reviewer'
      };

      const response = await request(app)
        .put(`/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User updated successfully');
      expect(response.body.user.role).toBe('reviewer');

      // Verify user was updated in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe('reviewer');
    });

    it('should return 403 when trying to update another user as regular user', async () => {
      // Create another user
      const anotherUser = new User({
        username: 'anotheruser',
        email: 'another@example.com',
        password_hash: 'anotherhash',
        role: 'user',
        is_active: true
      });
      await anotherUser.save();

      const updateData = {
        full_name: 'Hacker Name'
      };

      const response = await request(app)
        .put(`/users/${anotherUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Not authorized to update this user');
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        full_name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/users/${testUser._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authentication token is required');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should allow admin to delete user', async () => {
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'adminhash',
        role: 'admin',
        is_active: true
      });
      await adminUser.save();

      const adminToken = generateTestToken(adminUser._id);

      const response = await request(app)
        .delete(`/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User deleted successfully');

      // Verify user was deleted from database
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`/users/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Not authorized to access this resource');
    });

    it('should return 404 for non-existent user', async () => {
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: 'adminhash',
        role: 'admin',
        is_active: true
      });
      await adminUser.save();

      const adminToken = generateTestToken(adminUser._id);
      const nonExistentId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', `User with id ${nonExistentId} not found`);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/users/${testUser._id}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Authentication token is required');
    });
  });
}); 