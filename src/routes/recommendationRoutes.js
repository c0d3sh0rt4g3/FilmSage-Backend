/**
 * Recommendation routes module
 * Defines API endpoints for movie recommendation functionality
 * @file recommendationRoutes.js
 * @module routes/recommendationRoutes
 */

import express from 'express';
const router = express.Router();
import * as recommendationController from '../controllers/recommendationController.js';

/**
 * POST /api/recommendations
 * Generate movie recommendations based on user reviews and preferences
 * @name GenerateRecommendations
 * @route {POST} /
 * @group Recommendations - Movie recommendation operations
 */
router.post('/', recommendationController.getRecommendations);

export default router; 