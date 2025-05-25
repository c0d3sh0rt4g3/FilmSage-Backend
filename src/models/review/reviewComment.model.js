import mongoose from 'mongoose';

const reviewCommentSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true,
    trim: true,
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewComment',
    default: null,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ReviewComment = mongoose.model('ReviewComment', reviewCommentSchema);

export default ReviewComment;
