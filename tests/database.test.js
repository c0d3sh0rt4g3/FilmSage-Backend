/**
 * Database connection test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearDatabase } from './helpers/testSetup.js';

describe('Database Connection Test', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should connect to test database successfully', async () => {
    const mongoose = await import('mongoose');
    expect(mongoose.default.connection.readyState).toBe(1); // 1 = connected
  });

  it('should be able to clear database', async () => {
    // This test passes if clearDatabase doesn't throw an error
    await clearDatabase();
    expect(true).toBe(true);
  });
}); 