import express from 'express';
const router = express.Router();
import * as recommendationController from '../controllers/recommendationController.js';

// Define the route for getting recommendations
// POST /api/recommendations
router.post('/', recommendationController.getRecommendations);

export default router; 