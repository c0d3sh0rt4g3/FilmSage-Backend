/**
 * Global Jest Setup
 * This file runs before all tests
 */

import { setupTestDB, teardownTestDB, mockExternalServices } from './helpers/testSetup.js';

// Setup before all tests
beforeAll(async () => {
  await setupTestDB();
  mockExternalServices();
}, 60000);

// Cleanup after all tests
afterAll(async () => {
  await teardownTestDB();
}, 60000); 