/**
 * Unit tests for User model
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import User from '../../../src/models/user/user.model.js';
import { clearDatabase } from '../../helpers/testSetup.js';

describe('User Model', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('User Creation', () => {
    it('should create a user with required fields', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password_hash).toBe(userData.password_hash);
      expect(savedUser.role).toBe('user'); // default role
      expect(savedUser.is_active).toBe(true); // default active
      expect(savedUser.favorite_genres).toEqual([]); // default empty array
      expect(savedUser.created_at).toBeDefined();
      expect(savedUser.updated_at).toBeDefined();
    });

    it('should fail to create user without required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail to create user without username', async () => {
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail to create user without email', async () => {
      const userData = {
        username: 'testuser',
        password_hash: 'hashedpassword123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail to create user without password_hash', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Validation', () => {
    it('should normalize email to lowercase', async () => {
      const userData = {
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM',
        password_hash: 'hashedpassword123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
    });

    it('should trim whitespace from string fields', async () => {
      const userData = {
        username: '  testuser  ',
        email: '  test@example.com  ',
        password_hash: 'hashedpassword123',
        full_name: '  John Doe  ',
        bio: '  This is a bio  '
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe('testuser');
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.full_name).toBe('John Doe');
      expect(savedUser.bio).toBe('This is a bio');
    });

    it('should validate role enum values', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        role: 'invalid_role'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should accept valid role values', async () => {
      const roles = ['user', 'admin', 'reviewer'];
      
      for (const role of roles) {
        const userData = {
          username: `testuser_${role}`,
          email: `test_${role}@example.com`,
          password_hash: 'hashedpassword123',
          role
        };

        const user = new User(userData);
        const savedUser = await user.save();
        
        expect(savedUser.role).toBe(role);
      }
    });

    it('should validate gender enum values', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        gender: 'invalid_gender'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should accept valid gender values', async () => {
      const genders = ['male', 'female', 'other', 'prefer_not_to_say'];
      
      for (const gender of genders) {
        const userData = {
          username: `testuser_${gender}`,
          email: `test_${gender}@example.com`,
          password_hash: 'hashedpassword123',
          gender
        };

        const user = new User(userData);
        const savedUser = await user.save();
        
        expect(savedUser.gender).toBe(gender);
      }
    });
  });

  describe('User Uniqueness', () => {
    it('should enforce unique username', async () => {
      const userData1 = {
        username: 'testuser',
        email: 'test1@example.com',
        password_hash: 'hashedpassword123'
      };

      const userData2 = {
        username: 'testuser',
        email: 'test2@example.com',
        password_hash: 'hashedpassword123'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData1 = {
        username: 'testuser1',
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
      };

      const userData2 = {
        username: 'testuser2',
        email: 'test@example.com',
        password_hash: 'hashedpassword123'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Optional Fields', () => {
    it('should save user with all optional fields', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        full_name: 'John Doe',
        display_name: 'Johnny',
        bio: 'I love movies!',
        avatar_url: 'https://example.com/avatar.jpg',
        phone: '+1234567890',
        gender: 'male',
        birth_date: new Date('1990-01-01'),
        nationality: 'American',
        address: '123 Main St, City, State',
        favorite_genres: ['Action', 'Drama', 'Comedy']
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.full_name).toBe(userData.full_name);
      expect(savedUser.display_name).toBe(userData.display_name);
      expect(savedUser.bio).toBe(userData.bio);
      expect(savedUser.avatar_url).toBe(userData.avatar_url);
      expect(savedUser.phone).toBe(userData.phone);
      expect(savedUser.gender).toBe(userData.gender);
      expect(savedUser.birth_date).toEqual(userData.birth_date);
      expect(savedUser.nationality).toBe(userData.nationality);
      expect(savedUser.address).toBe(userData.address);
      expect(savedUser.favorite_genres).toEqual(userData.favorite_genres);
    });
  });
}); 