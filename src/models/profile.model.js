// models/profile.model.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Profile model representing user profiles in the database
 * @class Profile
 * @extends {Model}
 */
class Profile extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   * @static
   * @param {Object} models - All models object
   */
  static associate(models) {
    // Define association here
    Profile.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }

  /**
   * Calculate profile completion percentage
   * @returns {number} Completion percentage (0-100)
   */
  getCompletionPercentage() {
    const fields = [
      'full_name', 'display_name', 'bio', 'avatar_url',
      'phone', 'gender', 'birth_date', 'nationality'
    ];

    const completedFields = fields.filter(field =>
      this[field] && this[field].toString().trim() !== ''
    ).length;

    return Math.round((completedFields / fields.length) * 100);
  }

  /**
   * Get parsed favorite genres as array
   * @returns {Array} Array of favorite genres
   */
  getFavoriteGenresArray() {
    if (!this.favorite_genres) return [];

    try {
      return JSON.parse(this.favorite_genres);
    } catch (error) {
      console.error('Error parsing favorite_genres:', error);
      return [];
    }
  }

  /**
   * Set favorite genres from array
   * @param {Array} genres - Array of genre strings
   */
  setFavoriteGenresArray(genres) {
    if (Array.isArray(genres)) {
      this.favorite_genres = JSON.stringify(genres);
    } else {
      this.favorite_genres = null;
    }
  }
}

/**
 * Initialize Profile model with attributes and options
 */
Profile.init({
  /**
   * Primary key for the profile
   * @type {number}
   */
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  /**
   * Foreign key reference to User model
   * @type {number}
   */
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },

  /**
   * User's full name
   * @type {string}
   */
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [2, 100]
    }
  },

  /**
   * User's display name or nickname
   * @type {string}
   */
  display_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [2, 50]
    }
  },

  /**
   * User's biography or description
   * @type {string}
   */
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },

  /**
   * URL to user's avatar/profile picture
   * @type {string}
   */
  avatar_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },

  /**
   * User's phone number
   * @type {string}
   */
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/
    }
  },

  /**
   * User's gender
   * @type {string}
   */
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true
  },

  /**
   * User's date of birth
   * @type {Date}
   */
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
      isBefore: new Date().toISOString().split('T')[0] // Must be before today
    }
  },

  /**
   * User's nationality
   * @type {string}
   */
  nationality: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [2, 50]
    }
  },

  /**
   * User's address
   * @type {string}
   */
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [5, 255]
    }
  },

  /**
   * User's favorite movie/series genres stored as JSON string
   * @type {string}
   */
  favorite_genres: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isValidJSON(value) {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              throw new Error('favorite_genres must be a JSON array');
            }
          } catch (error) {
            throw new Error('favorite_genres must be valid JSON');
          }
        }
      }
    }
  },

  /**
   * Timestamp when the profile was created
   * @type {Date}
   */
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  /**
   * Timestamp when the profile was last updated
   * @type {Date}
   */
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Profile',
  tableName: 'profiles',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  /**
   * Model-level validations
   */
  validate: {
    /**
     * Ensure at least display_name or full_name is provided
     */
    atLeastOneName() {
      if (!this.display_name && !this.full_name) {
        throw new Error('Either display_name or full_name must be provided');
      }
    }
  },

  /**
   * Model hooks
   */
  hooks: {
    /**
     * Before validation hook to clean up data
     * @param {Profile} profile - Profile instance
     */
    beforeValidate: (profile) => {
      // Trim string fields
      if (profile.full_name) profile.full_name = profile.full_name.trim();
      if (profile.display_name) profile.display_name = profile.display_name.trim();
      if (profile.bio) profile.bio = profile.bio.trim();
      if (profile.nationality) profile.nationality = profile.nationality.trim();
      if (profile.address) profile.address = profile.address.trim();
    }
  }
});

export default Profile;