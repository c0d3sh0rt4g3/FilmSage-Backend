import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Authentication fields
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'reviewer'],
    default: 'user',
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  
  // Profile fields (all optional)
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

const User = mongoose.model('User', userSchema);

export default User;
