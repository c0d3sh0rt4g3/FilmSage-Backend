import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  activity_type: {
    type: String,
    enum: ['review', 'rating', 'watchlist_add', 'favorite_add', 'follow'],
    required: true,
  },
  tmdb_id: {
    type: Number,
  },
  content_type: {
    type: String,
    enum: ['movie', 'series'],
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

export default UserActivity;
