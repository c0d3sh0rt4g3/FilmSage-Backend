import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  full_name: {
    type: String,
    trim: true,
  },
  display_name: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  avatar_url: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  },
  birth_date: {
    type: Date,
  },
  nationality: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  favorite_genres: {
    type: [String],
    default: [],
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
