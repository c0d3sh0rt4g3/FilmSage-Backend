import mongoose from 'mongoose';

const userFollowSchema = new mongoose.Schema({
  follower_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  followed_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

userFollowSchema.index({ follower_id: 1, followed_id: 1 }, { unique: true });

const UserFollow = mongoose.model('UserFollow', userFollowSchema);

export default UserFollow;
