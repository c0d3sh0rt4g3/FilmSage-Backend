import { Router } from 'express';
import reviewController from '../controllers/review.controller.js';

const router = Router();

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

// Admin routes
router.patch('/:id/approve', reviewController.approveReview);
router.patch('/:id/reject', reviewController.rejectReview);

// User-specific routes
router.get('/user/:userId', reviewController.getUserReviews);

export default router;
