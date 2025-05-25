import Profile from '../models/profile.model.js';
import User from '../models/user/user.model.js';

/**
 * Profile controller containing methods for profile management
 * @module controllers/profileController
 */
const profileController = {
  /**
   * Create a new profile for a user
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.user_id - User ID for the profile
   * @param {string} [req.body.full_name] - Full name of the user
   * @param {string} [req.body.display_name] - Display name or nickname
   * @param {string} [req.body.bio] - User biography
   * @param {string} [req.body.avatar_url] - Profile picture URL
   * @param {string} [req.body.phone] - Phone number
   * @param {string} [req.body.gender] - Gender
   * @param {string} [req.body.birth_date] - Date of birth
   * @param {string} [req.body.nationality] - Nationality
   * @param {string} [req.body.address] - Address
   * @param {Array} [req.body.favorite_genres] - Array of favorite genres
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with profile data or error message
   */
  createProfile: async (req, res) => {
    try {
      const {
        user_id,
        full_name,
        display_name,
        bio,
        avatar_url,
        phone,
        gender,
        birth_date,
        nationality,
        address,
        favorite_genres
      } = req.body;

      const user = await User.findOne({ _id: user_id });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existingProfile = await Profile.findOne({ user_id });
      if (existingProfile) {
        return res.status(409).json({
          message: 'Profile already exists for this user'
        });
      }

      const newProfile = await Profile.create({
        user_id,
        full_name,
        display_name,
        bio,
        avatar_url,
        phone,
        gender,
        birth_date,
        nationality,
        address,
        favorite_genres
      });

      res.status(201).json({
        message: 'Profile created successfully',
        profile: newProfile
      });
    } catch (error) {
      console.error('Profile creation error:', error);
      res.status(500).json({ message: 'Server error during profile creation' });
    }
  },

  /**
   * Get all profiles (admin only)
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with all profiles
   */
  getAllProfiles: async (req, res) => {
    try {
      const profiles = await Profile.find({}).populate('user_id', 'username email role');

      res.status(200).json({ profiles });
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ message: 'Server error while fetching profiles' });
    }
  },

  /**
   * Get profile by user ID
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with profile data
   */
  getProfileByUserId: async (req, res) => {
    try {
      const { userId } = req.params;

      const profile = await Profile.findOne({ user_id: userId }).populate('user_id', 'username email role created_at');

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      res.status(200).json({ profile });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server error while fetching profile' });
    }
  },

  /**
   * Get profile by profile ID
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.id - Profile ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with profile data
   */
  getProfileById: async (req, res) => {
    try {
      const { id } = req.params;

      const profile = await Profile.findOne({ _id: id }).populate('user_id', 'username email role created_at');

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      res.status(200).json({ profile });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server error while fetching profile' });
    }
  },

  /**
   * Update profile information
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} req.body - Request body
   * @param {string} [req.body.full_name] - New full name
   * @param {string} [req.body.display_name] - New display name
   * @param {string} [req.body.bio] - New biography
   * @param {string} [req.body.avatar_url] - New avatar URL
   * @param {string} [req.body.phone] - New phone number
   * @param {string} [req.body.gender] - New gender
   * @param {string} [req.body.birth_date] - New birth date
   * @param {string} [req.body.nationality] - New nationality
   * @param {string} [req.body.address] - New address
   * @param {Array} [req.body.favorite_genres] - New favorite genres array
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with updated profile data
   */
  updateProfile: async (req, res) => {
    try {
      const { userId } = req.params;
      const {
        full_name,
        display_name,
        bio,
        avatar_url,
        phone,
        gender,
        birth_date,
        nationality,
        address,
        favorite_genres
      } = req.body;

      const profile = await Profile.findOne({ user_id: userId });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }

      const updateData = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (display_name !== undefined) updateData.display_name = display_name;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
      if (phone !== undefined) updateData.phone = phone;
      if (gender !== undefined) updateData.gender = gender;
      if (birth_date !== undefined) updateData.birth_date = birth_date;
      if (nationality !== undefined) updateData.nationality = nationality;
      if (address !== undefined) updateData.address = address;
      if (favorite_genres !== undefined) updateData.favorite_genres = favorite_genres;

      const updatedProfile = await Profile.findOneAndUpdate(
        { user_id: userId },
        updateData,
        { new: true }
      );

      res.status(200).json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Server error while updating profile' });
    }
  },

  /**
   * Delete a profile
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} req.user - Authenticated user info
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with status message
   */
  deleteProfile: async (req, res) => {
    try {
      const { userId } = req.params;

      const profile = await Profile.findOne({ user_id: userId });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this profile' });
      }

      await Profile.findOneAndDelete({ user_id: userId });
      res.status(200).json({ message: 'Profile deleted successfully' });
    } catch (error) {
      console.error('Error deleting profile:', error);
      res.status(500).json({ message: 'Server error while deleting profile' });
    }
  },

  /**
   * Search profiles by display name or full name
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters
   * @param {string} req.query.search - Search term
   * @param {number} [req.query.limit=10] - Number of results to return
   * @param {number} [req.query.offset=0] - Number of results to skip
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with search results
   */
  searchProfiles: async (req, res) => {
    try {
      const { search, limit = 10, offset = 0 } = req.query;

      if (!search) {
        return res.status(400).json({ message: 'Search term is required' });
      }

      const profiles = await Profile.find({
        $or: [
          { full_name: { $regex: search, $options: 'i' } },
          { display_name: { $regex: search, $options: 'i' } }
        ]
      })
      .populate('user_id', 'username role')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ created_at: -1 });

      const total = await Profile.countDocuments({
        $or: [
          { full_name: { $regex: search, $options: 'i' } },
          { display_name: { $regex: search, $options: 'i' } }
        ]
      });

      res.status(200).json({
        profiles,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error searching profiles:', error);
      res.status(500).json({ message: 'Server error while searching profiles' });
    }
  },

  /**
   * Get profile statistics
   * @async
   * @param {Object} req - Express request object
   * @param {Object} req.params - Request parameters
   * @param {string} req.params.userId - User ID
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with profile statistics
   */
  getProfileStats: async (req, res) => {
    try {
      const { userId } = req.params;

      const profile = await Profile.findOne({ user_id: userId });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const stats = {
        profile_created: profile.created_at,
        last_updated: profile.updated_at,
        has_avatar: !!profile.avatar_url,
        has_bio: !!profile.bio,
        favorite_genres_count: profile.favorite_genres ? profile.favorite_genres.length : 0
      };

      res.status(200).json({ stats });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      res.status(500).json({ message: 'Server error while fetching profile stats' });
    }
  }
};

export default profileController;
