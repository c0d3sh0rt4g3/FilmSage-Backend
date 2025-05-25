import Review from '../models/review/review.model.js';
import ReviewLike from '../models/review/reviewLike.model.js';
import ReviewComment from '../models/review/reviewComment.model.js';
import User from '../models/user/user.model.js';

/**
 * Review controller containing methods for review management
 * @module controllers/reviewController
 */
const reviewController = {
  /**
   * Create a new review
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.user_id - User ID who creates the review
   * @param {number} req.body.tmdb_id - TMDB ID of the movie/series
   * @param {string} req.body.content_type - Type of content (movie or series)
   * @param {string} req.body.title - Review title
   * @param {string} req.body.content - Review content
   * @param {number} req.body.rating - Rating from 1 to 5
   * @param {boolean} [req.body.is_critic] - Whether this is a critic review
   * @param {boolean} [req.body.is_spoiler] - Whether this review contains spoilers
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with review data or error message
   */
  createReview: async (req, res) => {
    try {
      const {
        user_id,
        tmdb_id,
        content_type,
        title,
        content,
        rating,
        is_critic = false,
        is_spoiler = false
      } = req.body;

      const user = await User.findOne({ _id: user_id });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existingReview = await Review.findOne({ user_id, tmdb_id, content_type });
      if (existingReview) {
        return res.status(409).json({
          message: 'User has already reviewed this content'
        });
      }

      const newReview = await Review.create({
        user_id,
        tmdb_id,
        content_type,
        title,
        content,
        rating,
        is_critic,
        is_spoiler
      });

      res.status(201).json({
        message: 'Review created successfully',
        review: newReview
      });
    } catch (error) {
      console.error('Review creation error:', error);
      res.status(500).json({ message: 'Server error during review creation' });
    }
  },

  /**
   * Get all reviews
   * @async
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with all reviews
   */
  getAllReviews: async (req, res) => {
    try {
      const reviews = await Review.find({}).populate('user_id', 'username role');

      res.status(200).json({ reviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Server error while fetching reviews' });
    }
  },

  /**
   * Get review by ID
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Review ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with review data
   */
  getReviewById: async (req, res) => {
    try {
      const { id } = req.params;

      const review = await Review.findOne({ _id: id }).populate('user_id', 'username role created_at');

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      res.status(200).json({ review });
    } catch (error) {
      console.error('Error fetching review:', error);
      res.status(500).json({ message: 'Server error while fetching review' });
    }
  },

  /**
   * Get reviews by TMDB ID
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.tmdbId - TMDB ID
   * @param {string} req.params.contentType - Content type (movie or series)
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with reviews data
   */
  getReviewsByContent: async (req, res) => {
    try {
      const { tmdbId, contentType } = req.params;

      const reviews = await Review.find({
        tmdb_id: tmdbId,
        content_type: contentType,
        is_approved: true
      }).populate('user_id', 'username role');

      res.status(200).json({ reviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Server error while fetching reviews' });
    }
  },

  /**
   * Update review
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Review ID
   * @param {Object} req.body - Request body
   * @param {string} [req.body.title] - New review title
   * @param {string} [req.body.content] - New review content
   * @param {number} [req.body.rating] - New rating
   * @param {boolean} [req.body.is_spoiler] - New spoiler flag
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with updated review data
   */
  updateReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, rating, is_spoiler } = req.body;

      const review = await Review.findOne({ _id: id });
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== review.user_id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this review' });
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (rating !== undefined) updateData.rating = rating;
      if (is_spoiler !== undefined) updateData.is_spoiler = is_spoiler;

      const updatedReview = await Review.findOneAndUpdate(
        { _id: id },
        updateData,
        { new: true }
      );

      res.status(200).json({
        message: 'Review updated successfully',
        review: updatedReview
      });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({ message: 'Server error while updating review' });
    }
  },
  /**
   * Remove like/dislike from review
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Review ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.user_id - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  removeLike: async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      const review = await Review.findOne({ _id: id });
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      const existingLike = await ReviewLike.findOne({ review_id: id, user_id });
      if (!existingLike) {
        return res.status(404).json({ message: 'Like not found' });
      }

      // Remove the like/dislike
      await ReviewLike.findOneAndDelete({ review_id: id, user_id });

      // Update counters
      if (existingLike.is_like) {
        await Review.findOneAndUpdate(
          { _id: id },
          { $inc: { likes_count: -1 } }
        );
      } else {
        await Review.findOneAndUpdate(
          { _id: id },
          { $inc: { dislikes_count: -1 } }
        );
      }

      res.status(200).json({ message: 'Like removed successfully' });
    } catch (error) {
      console.error('Error removing like:', error);
      res.status(500).json({ message: 'Server error while removing like' });
    }
  },

  /**
   * Update comment
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.commentId - Comment ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.content - New comment content
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with updated comment data
   */
  updateComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      const comment = await ReviewComment.findOne({ _id: commentId });
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== comment.user_id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this comment' });
      }

      const updatedComment = await ReviewComment.findOneAndUpdate(
        { _id: commentId },
        { content },
        { new: true }
      );

      res.status(200).json({
        message: 'Comment updated successfully',
        comment: updatedComment
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ message: 'Server error while updating comment' });
    }
  },

  /**
   * Delete comment
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.commentId - Comment ID
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;

      const comment = await ReviewComment.findOne({ _id: commentId });
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== comment.user_id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }

      await ReviewComment.findOneAndDelete({ _id: commentId });
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Server error while deleting comment' });
    }
  },

  /**
   * Approve review (admin only)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Review ID
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  approveReview: async (req, res) => {
    try {
      const { id } = req.params;

      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to approve reviews' });
      }

      const review = await Review.findOne({ _id: id });
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      await Review.findOneAndUpdate(
        { _id: id },
        { is_approved: true }
      );

      res.status(200).json({ message: 'Review approved successfully' });
    } catch (error) {
      console.error('Error approving review:', error);
      res.status(500).json({ message: 'Server error while approving review' });
    }
  },

  /**
   * Reject review (admin only)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Review ID
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  rejectReview: async (req, res) => {
    try {
      const { id } = req.params;

      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to reject reviews' });
      }

      const review = await Review.findOne({ _id: id });
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      await Review.findOneAndUpdate(
        { _id: id },
        { is_approved: false }
      );

      res.status(200).json({ message: 'Review rejected successfully' });
    } catch (error) {
      console.error('Error rejecting review:', error);
      res.status(500).json({ message: 'Server error while rejecting review' });
    }
  },

  /**
   * Get reviews by user ID
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with user reviews data
   */
  getUserReviews: async (req, res) => {
    try {
      const { userId } = req.params;

      const reviews = await Review.find({ user_id: userId })
        .populate('user_id', 'username role')
        .sort({ created_at: -1 });

      res.status(200).json({ reviews });
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ message: 'Server error while fetching user reviews' });
    }
  },
  /**
   * Delete review
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Review ID
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  deleteReview: async (req, res) => {
    try {
      const { id } = req.params;

      const review = await Review.findOne({ _id: id });
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== review.user_id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this review' });
      }

      await Review.findOneAndDelete({ _id: id });
      res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ message: 'Server error while deleting review' });
    }
  },

  /**
   * Like or dislike a review
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Review ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.user_id - User ID
   * @param {boolean} req.body.is_like - True for like, false for dislike
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  likeReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, is_like } = req.body;

      const review = await Review.findOne({ _id: id });
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      const existingLike = await ReviewLike.findOne({ review_id: id, user_id });

      if (existingLike) {
        if (existingLike.is_like !== is_like) {
          await ReviewLike.findOneAndUpdate(
            { review_id: id, user_id },
            { is_like }
          );

          if (is_like) {
            await Review.findOneAndUpdate(
              { _id: id },
              { $inc: { likes_count: 1, dislikes_count: -1 } }
            );
          } else {
            await Review.findOneAndUpdate(
              { _id: id },
              { $inc: { likes_count: -1, dislikes_count: 1 } }
            );
          }
        }
      } else {
        await ReviewLike.create({ review_id: id, user_id, is_like });

        if (is_like) {
          await Review.findOneAndUpdate(
            { _id: id },
            { $inc: { likes_count: 1 } }
          );
        } else {
          await Review.findOneAndUpdate(
            { _id: id },
            { $inc: { dislikes_count: 1 } }
          );
        }
      }

      res.status(200).json({ message: 'Review reaction updated successfully' });
    } catch (error) {
      console.error('Error updating review reaction:', error);
      res.status(500).json({ message: 'Server error while updating review reaction' });
    }
  },

  /**
   * Add comment to review
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Review ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.user_id - User ID
   * @param {string} req.body.content - Comment content
   * @param {string} [req.body.parent_id] - Parent comment ID for nested comments
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with comment data
   */
  addComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, content, parent_id } = req.body;

      const review = await Review.findOne({ _id: id });
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      const newComment = await ReviewComment.create({
        review_id: id,
        user_id,
        content,
        parent_id: parent_id || null
      });

      res.status(201).json({
        message: 'Comment added successfully',
        comment: newComment
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Server error while adding comment' });
    }
  },

  /**
   * Get comments for a review
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Review ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with comments data
   */
  getComments: async (req, res) => {
    try {
      const { id } = req.params;

      const comments = await ReviewComment.find({ review_id: id })
        .populate('user_id', 'username role')
        .sort({ created_at: 1 });

      res.status(200).json({ comments });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Server error while fetching comments' });
    }
  }
};

export default reviewController;
