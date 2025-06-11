// routes/userInteraction.routes.js
import { Router } from 'express';
import userInteractionController from '../controllers/userInteraction.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Rating routes
router.post('/ratings', userInteractionController.addRating);
router.get('/ratings/user/:userId', userInteractionController.getUserRatings);
router.get('/ratings/user/:userId/from-reviews', userInteractionController.getUserRatingsFromReviews); // Get ratings from reviews
router.get('/ratings/all', userInteractionController.getAllRatings); // Debug endpoint
router.delete('/ratings/:userId/:tmdbId/:contentType', userInteractionController.removeRating);

// Watchlist routes
router.post('/watchlist', userInteractionController.addToWatchlist);
router.get('/watchlist/user/:userId', userInteractionController.getUserWatchlist);
router.put('/watchlist/:id', userInteractionController.updateWatchlistStatus);
router.delete('/watchlist/:id', userInteractionController.removeFromWatchlist);

// Favorites routes
router.post('/favorites', userInteractionController.addToFavorites);
router.get('/favorites/user/:userId', userInteractionController.getUserFavorites);
router.delete('/favorites/:userId/:tmdbId/:contentType', userInteractionController.removeFromFavorites);

// Follow routes
router.post('/follow', userInteractionController.followUser);
router.delete('/follow/:followerId/:followedId', userInteractionController.unfollowUser);
router.get('/followers/:userId', userInteractionController.getUserFollowers);
router.get('/following/:userId', userInteractionController.getUserFollowing);

// Activity routes
router.get('/activity/:userId', userInteractionController.getUserActivity);

export default router;
