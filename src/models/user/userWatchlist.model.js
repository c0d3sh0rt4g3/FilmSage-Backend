import mongoose from 'mongoose';

const userWatchlistSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tmdb_id: {
    type: Number,
    required: true,
  },
  content_type: {
    type: String,
    enum: ['movie', 'series'],
    required: true,
  },
  status: {
    type: String,
    enum: ['want_to_watch', 'watching', 'completed'],
    default: 'want_to_watch',
  },
}, {
  timestamps: { createdAt: 'added_at', updatedAt: false }
});

userWatchlistSchema.index({ user_id: 1, tmdb_id: 1, content_type: 1 }, { unique: true });

const UserWatchlist = mongoose.model('UserWatchlist', userWatchlistSchema);

export default UserWatchlist;
