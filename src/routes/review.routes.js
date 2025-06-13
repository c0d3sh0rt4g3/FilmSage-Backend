/**
 * Review routes module
 * Defines API endpoints for review management and interactions
 * @file review.routes.js
 * @module routes/reviewRoutes
 */

import { Router } from 'express';
import reviewController from '../controllers/review.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Authentication middleware applied to all routes
 * All routes require valid JWT token
 */
router.use(authenticateToken);

/**
 * Review CRUD operations
 */

/**
 * POST /reviews/
 * Create a new review
 * @name CreateReview
 * @route {POST} /
 * @group Reviews - Review management operations
 * @security JWT
 */
router.post('/', reviewController.createReview);

/**
 * GET /reviews/
 * Get all reviews with pagination and filtering
 * @name GetAllReviews
 * @route {GET} /
 * @group Reviews - Review management operations
 * @security JWT
 */
router.get('/', reviewController.getAllReviews);

/**
 * GET /reviews/:id
 * Get specific review by ID
 * @name GetReviewById
 * @route {GET} /:id
 * @group Reviews - Review management operations
 * @security JWT
 */
router.get('/:id', reviewController.getReviewById);

/**
 * PUT /reviews/:id
 * Update existing review
 * @name UpdateReview
 * @route {PUT} /:id
 * @group Reviews - Review management operations
 * @security JWT
 */
router.put('/:id', reviewController.updateReview);

/**
 * DELETE /reviews/:id
 * Delete review
 * @name DeleteReview
 * @route {DELETE} /:id
 * @group Reviews - Review management operations
 * @security JWT
 */
router.delete('/:id', reviewController.deleteReview);

/**
 * Content-specific review operations
 */

/**
 * GET /reviews/content/:tmdbId/:contentType
 * Get all reviews for specific content (movie/TV show)
 * @name GetReviewsByContent
 * @route {GET} /content/:tmdbId/:contentType
 * @group Reviews - Review management operations
 * @security JWT
 */
router.get('/content/:tmdbId/:contentType', reviewController.getReviewsByContent);

/**
 * Review interaction operations
 */

/**
 * POST /reviews/:id/like
 * Like a review
 * @name LikeReview
 * @route {POST} /:id/like
 * @group Reviews - Review management operations
 * @security JWT
 */
router.post('/:id/like', reviewController.likeReview);

/**
 * DELETE /reviews/:id/like
 * Remove like from review
 * @name RemoveLike
 * @route {DELETE} /:id/like
 * @group Reviews - Review management operations
 * @security JWT
 */
router.delete('/:id/like', reviewController.removeLike);

/**
 * Comment operations on reviews
 */

/**
 * POST /reviews/:id/comments
 * Add comment to review
 * @name AddComment
 * @route {POST} /:id/comments
 * @group Reviews - Review management operations
 * @security JWT
 */
router.post('/:id/comments', reviewController.addComment);

/**
 * GET /reviews/:id/comments
 * Get all comments for a review
 * @name GetComments
 * @route {GET} /:id/comments
 * @group Reviews - Review management operations
 * @security JWT
 */
router.get('/:id/comments', reviewController.getComments);

/**
 * PUT /reviews/comments/:commentId
 * Update comment
 * @name UpdateComment
 * @route {PUT} /comments/:commentId
 * @group Reviews - Review management operations
 * @security JWT
 */
router.put('/comments/:commentId', reviewController.updateComment);

/**
 * DELETE /reviews/comments/:commentId
 * Delete comment
 * @name DeleteComment
 * @route {DELETE} /comments/:commentId
 * @group Reviews - Review management operations
 * @security JWT
 */
router.delete('/comments/:commentId', reviewController.deleteComment);

/**
 * Admin-only review operations
 */

/**
 * PATCH /reviews/:id/approve
 * Approve review (admin only)
 * @name ApproveReview
 * @route {PATCH} /:id/approve
 * @group Reviews - Review management operations
 * @security JWT
 * @requires admin role
 */
router.patch('/:id/approve', authorizeRole(['admin']), reviewController.approveReview);

/**
 * PATCH /reviews/:id/reject
 * Reject review (admin only)
 * @name RejectReview
 * @route {PATCH} /:id/reject
 * @group Reviews - Review management operations
 * @security JWT
 * @requires admin role
 */
router.patch('/:id/reject', authorizeRole(['admin']), reviewController.rejectReview);

/**
 * User-specific review operations
 */

/**
 * GET /reviews/user/:userId
 * Get all reviews by specific user
 * @name GetUserReviews
 * @route {GET} /user/:userId
 * @group Reviews - Review management operations
 * @security JWT
 */
router.get('/user/:userId', reviewController.getUserReviews);

export default router;
