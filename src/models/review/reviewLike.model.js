import mongoose from 'mongoose';

const reviewLikeSchema = new mongoose.Schema({
  review_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  is_like: {
    type: Boolean,
    required: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

reviewLikeSchema.index({ review_id: 1, user_id: 1 }, { unique: true });

const ReviewLike = mongoose.model('ReviewLike', reviewLikeSchema);

export default ReviewLike;
