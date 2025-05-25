import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  is_critic: {
    type: Boolean,
    default: false,
  },
  is_spoiler: {
    type: Boolean,
    default: false,
  },
  is_approved: {
    type: Boolean,
    default: true,
  },
  likes_count: {
    type: Number,
    default: 0,
  },
  dislikes_count: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
