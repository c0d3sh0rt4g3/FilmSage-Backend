import UserRating from '../models/user/userRating.model.js';
import UserWatchlist from '../models/user/userWatchlist.model.js';
import UserFavorite from '../models/user/userFavorite.model.js';
import UserFollow from '../models/user/userFollow.model.js';
import UserActivity from '../models/user/userActivity.model.js';
import User from '../models/user/user.model.js';

/**
 * User interaction controller containing methods for user interactions management
 * @module controllers/userInteractionController
 */
const userInteractionController = {
  /**
   * Add or update user rating
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.user_id - User ID
   * @param {number} req.body.tmdb_id - TMDB ID
   * @param {string} req.body.content_type - Content type (movie or series)
   * @param {number} req.body.rating - Rating from 1 to 5
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with rating data or error message
   */
  addRating: async (req, res) => {
    try {
      const { user_id, tmdb_id, content_type, rating } = req.body;

      const existingRating = await UserRating.findOne({ user_id, tmdb_id, content_type });

      if (existingRating) {
        const updatedRating = await UserRating.findOneAndUpdate(
          { user_id, tmdb_id, content_type },
          { rating },
          { new: true }
        );

        await UserActivity.create({
          user_id,
          activity_type: 'rating',
          tmdb_id,
          content_type,
          metadata: { rating, action: 'updated' }
        });

        return res.status(200).json({
          message: 'Rating updated successfully',
          rating: updatedRating
        });
      }

      const newRating = await UserRating.create({
        user_id,
        tmdb_id,
        content_type,
        rating
      });

      await UserActivity.create({
        user_id,
        activity_type: 'rating',
        tmdb_id,
        content_type,
        metadata: { rating, action: 'created' }
      });

      res.status(201).json({
        message: 'Rating added successfully',
        rating: newRating
      });
    } catch (error) {
      console.error('Rating creation error:', error);
      res.status(500).json({ message: 'Server error during rating creation' });
    }
  },

  /**
   * Get user ratings
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with ratings data
   */
  getUserRatings: async (req, res) => {
    try {
      const { userId } = req.params;

      const ratings = await UserRating.find({ user_id: userId }).sort({ created_at: -1 });

      res.status(200).json({ ratings });
    } catch (error) {
      console.error('Error fetching ratings:', error);
      res.status(500).json({ message: 'Server error while fetching ratings' });
    }
  },

  /**
   * Add item to watchlist
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.user_id - User ID
   * @param {number} req.body.tmdb_id - TMDB ID
   * @param {string} req.body.content_type - Content type (movie or series)
   * @param {string} [req.body.status] - Watchlist status
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with watchlist data or error message
   */
  addToWatchlist: async (req, res) => {
    try {
      const { user_id, tmdb_id, content_type, status = 'want_to_watch' } = req.body;

      const existingItem = await UserWatchlist.findOne({ user_id, tmdb_id, content_type });

      if (existingItem) {
        return res.status(409).json({
          message: 'Item already in watchlist'
        });
      }

      const newWatchlistItem = await UserWatchlist.create({
        user_id,
        tmdb_id,
        content_type,
        status
      });

      await UserActivity.create({
        user_id,
        activity_type: 'watchlist_add',
        tmdb_id,
        content_type,
        metadata: { status }
      });

      res.status(201).json({
        message: 'Item added to watchlist successfully',
        watchlistItem: newWatchlistItem
      });
    } catch (error) {
      console.error('Watchlist creation error:', error);
      res.status(500).json({ message: 'Server error during watchlist creation' });
    }
  },

  /**
   * Update watchlist status
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Watchlist item ID
   * @param {Object} req.body - Request body
   * @param {string} req.body.status - New status
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with updated watchlist data
   */
  updateWatchlistStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedItem = await UserWatchlist.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true }
      );

      if (!updatedItem) {
        return res.status(404).json({ message: 'Watchlist item not found' });
      }

      res.status(200).json({
        message: 'Watchlist status updated successfully',
        watchlistItem: updatedItem
      });
    } catch (error) {
      console.error('Error updating watchlist:', error);
      res.status(500).json({ message: 'Server error while updating watchlist' });
    }
  },

  /**
   * Get user watchlist
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with watchlist data
   */
  getUserWatchlist: async (req, res) => {
    try {
      const { userId } = req.params;

      const watchlist = await UserWatchlist.find({ user_id: userId }).sort({ added_at: -1 });

      res.status(200).json({ watchlist });
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      res.status(500).json({ message: 'Server error while fetching watchlist' });
    }
  },

  /**
   * Add item to favorites
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.user_id - User ID
   * @param {number} req.body.tmdb_id - TMDB ID
   * @param {string} req.body.content_type - Content type (movie or series)
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with favorite data or error message
   */
  addToFavorites: async (req, res) => {
    try {
      const { user_id, tmdb_id, content_type } = req.body;

      const existingFavorite = await UserFavorite.findOne({ user_id, tmdb_id, content_type });

      if (existingFavorite) {
        return res.status(409).json({
          message: 'Item already in favorites'
        });
      }

      const newFavorite = await UserFavorite.create({
        user_id,
        tmdb_id,
        content_type
      });

      await UserActivity.create({
        user_id,
        activity_type: 'favorite_add',
        tmdb_id,
        content_type
      });

      res.status(201).json({
        message: 'Item added to favorites successfully',
        favorite: newFavorite
      });
    } catch (error) {
      console.error('Favorite creation error:', error);
      res.status(500).json({ message: 'Server error during favorite creation' });
    }
  },

  /**
   * Remove item from favorites
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {string} req.params.tmdbId - TMDB ID
   * @param {string} req.params.contentType - Content type
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  removeFromFavorites: async (req, res) => {
    try {
      const { userId, tmdbId, contentType } = req.params;

      const deletedFavorite = await UserFavorite.findOneAndDelete({
        user_id: userId,
        tmdb_id: tmdbId,
        content_type: contentType
      });

      if (!deletedFavorite) {
        return res.status(404).json({ message: 'Favorite not found' });
      }

      res.status(200).json({ message: 'Item removed from favorites successfully' });
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ message: 'Server error while removing favorite' });
    }
  },
  /**
 * Remove user rating
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.userId - User ID
 * @param {string} req.params.tmdbId - TMDB ID
 * @param {string} req.params.contentType - Content type
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with status message
 */
  removeRating: async (req, res) => {
    try {
      const { userId, tmdbId, contentType } = req.params;

      const deletedRating = await UserRating.findOneAndDelete({
        user_id: userId,
        tmdb_id: tmdbId,
        content_type: contentType
      });

      if (!deletedRating) {
        return res.status(404).json({ message: 'Rating not found' });
      }

      res.status(200).json({ message: 'Rating removed successfully' });
    } catch (error) {
      console.error('Error removing rating:', error);
      res.status(500).json({ message: 'Server error while removing rating' });
    }
  },
  /**
  * Remove item from watchlist
  * @async
  * @param {Object} req - Express request object
  * @param {Object} req.params - Request parameters
  * @param {string} req.params.id - Watchlist item ID
  * @param {Object} res - Express response object
  * @returns {Object} JSON response with status message
  */
  removeFromWatchlist: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedItem = await UserWatchlist.findOneAndDelete({ _id: id });

      if (!deletedItem) {
        return res.status(404).json({ message: 'Watchlist item not found' });
      }

      res.status(200).json({ message: 'Item removed from watchlist successfully' });
    } catch (error) {
      console.error('Error removing watchlist item:', error);
      res.status(500).json({ message: 'Server error while removing watchlist item' });
    }
  },

  /**
   * Get user favorites
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with favorites data
   */
  getUserFavorites: async (req, res) => {
    try {
      const { userId } = req.params;

      const favorites = await UserFavorite.find({ user_id: userId }).sort({ created_at: -1 });

      res.status(200).json({ favorites });
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ message: 'Server error while fetching favorites' });
    }
  },

  /**
   * Follow a user
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.follower_id - Follower user ID
   * @param {string} req.body.followed_id - Followed user ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with follow data or error message
   */
  followUser: async (req, res) => {
    try {
      const { follower_id, followed_id } = req.body;

      if (follower_id === followed_id) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
      }

      const existingFollow = await UserFollow.findOne({ follower_id, followed_id });

      if (existingFollow) {
        return res.status(409).json({
          message: 'Already following this user'
        });
      }

      const newFollow = await UserFollow.create({
        follower_id,
        followed_id
      });

      await UserActivity.create({
        user_id: follower_id,
        activity_type: 'follow',
        metadata: { followed_user_id: followed_id }
      });

      res.status(201).json({
        message: 'User followed successfully',
        follow: newFollow
      });
    } catch (error) {
      console.error('Follow creation error:', error);
      res.status(500).json({ message: 'Server error during follow creation' });
    }
  },

  /**
   * Unfollow a user
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.followerId - Follower user ID
   * @param {string} req.params.followedId - Followed user ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  unfollowUser: async (req, res) => {
    try {
      const { followerId, followedId } = req.params;

      const deletedFollow = await UserFollow.findOneAndDelete({
        follower_id: followerId,
        followed_id: followedId
      });

      if (!deletedFollow) {
        return res.status(404).json({ message: 'Follow relationship not found' });
      }

      res.status(200).json({ message: 'User unfollowed successfully' });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ message: 'Server error while unfollowing user' });
    }
  },

  /**
   * Get user followers
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with followers data
   */
  getUserFollowers: async (req, res) => {
    try {
      const { userId } = req.params;

      const followers = await UserFollow.find({ followed_id: userId })
        .populate('follower_id', 'username email')
        .sort({ created_at: -1 });

      res.status(200).json({ followers });
    } catch (error) {
      console.error('Error fetching followers:', error);
      res.status(500).json({ message: 'Server error while fetching followers' });
    }
  },

  /**
   * Get user following
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with following data
   */
  getUserFollowing: async (req, res) => {
    try {
      const { userId } = req.params;

      const following = await UserFollow.find({ follower_id: userId })
        .populate('followed_id', 'username email')
        .sort({ created_at: -1 });

      res.status(200).json({ following });
    } catch (error) {
      console.error('Error fetching following:', error);
      res.status(500).json({ message: 'Server error while fetching following' });
    }
  },

  /**
   * Get user activity
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with activity data
   */
  getUserActivity: async (req, res) => {
    try {
      const { userId } = req.params;

      const activities = await UserActivity.find({ user_id: userId })
        .populate('user_id', 'username')
        .sort({ created_at: -1 })
        .limit(50);

      res.status(200).json({ activities });
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ message: 'Server error while fetching activity' });
    }
  }
};

export default userInteractionController;
