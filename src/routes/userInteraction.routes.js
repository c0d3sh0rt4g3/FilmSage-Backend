/**
 * User interaction routes module
 * Defines API endpoints for user interactions like ratings, watchlist, favorites, and follows
 * @file userInteraction.routes.js
 * @module routes/userInteractionRoutes
 */

import { Router } from 'express';
import userInteractionController from '../controllers/userInteraction.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Authentication middleware applied to all routes
 * All routes require valid JWT token
 */
router.use(authenticateToken);

/**
 * Rating operations
 */

/**
 * POST /userInteractions/ratings
 * Add or update user rating for content
 * @name AddRating
 * @route {POST} /ratings
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.post('/ratings', userInteractionController.addRating);

/**
 * GET /userInteractions/ratings/user/:userId
 * Get all ratings by specific user
 * @name GetUserRatings
 * @route {GET} /ratings/user/:userId
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.get('/ratings/user/:userId', userInteractionController.getUserRatings);

/**
 * GET /userInteractions/ratings/user/:userId/from-reviews
 * Get user ratings derived from their reviews
 * @name GetUserRatingsFromReviews
 * @route {GET} /ratings/user/:userId/from-reviews
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.get('/ratings/user/:userId/from-reviews', userInteractionController.getUserRatingsFromReviews);

/**
 * GET /userInteractions/ratings/all
 * Get all ratings (debug endpoint)
 * @name GetAllRatings
 * @route {GET} /ratings/all
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.get('/ratings/all', userInteractionController.getAllRatings);

/**
 * DELETE /userInteractions/ratings/:userId/:tmdbId/:contentType
 * Remove user rating for specific content
 * @name RemoveRating
 * @route {DELETE} /ratings/:userId/:tmdbId/:contentType
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.delete('/ratings/:userId/:tmdbId/:contentType', userInteractionController.removeRating);

/**
 * Watchlist operations
 */

/**
 * POST /userInteractions/watchlist
 * Add content to user's watchlist
 * @name AddToWatchlist
 * @route {POST} /watchlist
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.post('/watchlist', userInteractionController.addToWatchlist);

/**
 * GET /userInteractions/watchlist/user/:userId
 * Get user's watchlist
 * @name GetUserWatchlist
 * @route {GET} /watchlist/user/:userId
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.get('/watchlist/user/:userId', userInteractionController.getUserWatchlist);

/**
 * PUT /userInteractions/watchlist/:id
 * Update watchlist item status
 * @name UpdateWatchlistStatus
 * @route {PUT} /watchlist/:id
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.put('/watchlist/:id', userInteractionController.updateWatchlistStatus);

/**
 * DELETE /userInteractions/watchlist/:id
 * Remove content from watchlist
 * @name RemoveFromWatchlist
 * @route {DELETE} /watchlist/:id
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.delete('/watchlist/:id', userInteractionController.removeFromWatchlist);

/**
 * Favorites operations
 */

/**
 * POST /userInteractions/favorites
 * Add content to user's favorites
 * @name AddToFavorites
 * @route {POST} /favorites
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.post('/favorites', userInteractionController.addToFavorites);

/**
 * GET /userInteractions/favorites/user/:userId
 * Get user's favorite content
 * @name GetUserFavorites
 * @route {GET} /favorites/user/:userId
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.get('/favorites/user/:userId', userInteractionController.getUserFavorites);

/**
 * DELETE /userInteractions/favorites/:userId/:tmdbId/:contentType
 * Remove content from favorites
 * @name RemoveFromFavorites
 * @route {DELETE} /favorites/:userId/:tmdbId/:contentType
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.delete('/favorites/:userId/:tmdbId/:contentType', userInteractionController.removeFromFavorites);

/**
 * Follow/Unfollow operations
 */

/**
 * POST /userInteractions/follow
 * Follow another user
 * @name FollowUser
 * @route {POST} /follow
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.post('/follow', userInteractionController.followUser);

/**
 * DELETE /userInteractions/follow/:followerId/:followedId
 * Unfollow a user
 * @name UnfollowUser
 * @route {DELETE} /follow/:followerId/:followedId
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.delete('/follow/:followerId/:followedId', userInteractionController.unfollowUser);

/**
 * GET /userInteractions/followers/:userId
 * Get user's followers
 * @name GetUserFollowers
 * @route {GET} /followers/:userId
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.get('/followers/:userId', userInteractionController.getUserFollowers);

/**
 * GET /userInteractions/following/:userId
 * Get users that the user is following
 * @name GetUserFollowing
 * @route {GET} /following/:userId
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.get('/following/:userId', userInteractionController.getUserFollowing);

/**
 * Activity operations
 */

/**
 * GET /userInteractions/activity/:userId
 * Get user's activity history
 * @name GetUserActivity
 * @route {GET} /activity/:userId
 * @group UserInteractions - User interaction operations
 * @security JWT
 */
router.get('/activity/:userId', userInteractionController.getUserActivity);

export default router;
