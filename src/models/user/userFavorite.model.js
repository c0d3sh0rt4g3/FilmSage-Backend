import mongoose from 'mongoose';

const userFavoriteSchema = new mongoose.Schema({
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
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

userFavoriteSchema.index({ user_id: 1, tmdb_id: 1, content_type: 1 }, { unique: true });

const UserFavorite = mongoose.model('UserFavorite', userFavoriteSchema);

export default UserFavorite;
