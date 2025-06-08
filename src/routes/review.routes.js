import { Router } from 'express';
import reviewController from '../controllers/review.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Review CRUD routes
router.post('/', reviewController.createReview);
router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReviewById);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

// Content-specific routes
router.get('/content/:tmdbId/:contentType', reviewController.getReviewsByContent);

// Review interaction routes
router.post('/:id/like', reviewController.likeReview);
router.delete('/:id/like', reviewController.removeLike);

// Comment routes
router.post('/:id/comments', reviewController.addComment);
router.get('/:id/comments', reviewController.getComments);
router.put('/comments/:commentId', reviewController.updateComment);
router.delete('/comments/:commentId', reviewController.deleteComment);

// Admin routes - require admin role
router.patch('/:id/approve', authorizeRole(['admin']), reviewController.approveReview);
router.patch('/:id/reject', authorizeRole(['admin']), reviewController.rejectReview);

// User-specific routes
router.get('/user/:userId', reviewController.getUserReviews);

export default router;
