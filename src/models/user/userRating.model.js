import mongoose from 'mongoose';

const userRatingSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

userRatingSchema.index({ user_id: 1, tmdb_id: 1, content_type: 1 }, { unique: true });

const UserRating = mongoose.model('UserRating', userRatingSchema);

export default UserRating;
