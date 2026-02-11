// ====================================
// User Model
// ====================================
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Media Item Schema (embedded)
 * Used for watchlist and favorites arrays
 */
const mediaItemSchema = new mongoose.Schema({
  mediaType: {
    type: String,
    enum: ['movie', 'tv', 'anime'],
    required: true
  },
  mediaId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  poster: {
    type: String
  },
  rating: {
    type: Number
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

/**
 * User Schema
 * User model for authentication with watchlist and favorites
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [300, 'Bio cannot exceed 300 characters'],
    default: ''
  },
  age: {
    type: Number,
    min: [1, 'Age must be positive'],
    max: [150, 'Invalid age']
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  currentlyWatching: {
    title: { type: String, default: '' },
    mediaType: { type: String, enum: ['movie', 'tv', 'anime', ''], default: '' },
    mediaId: { type: String, default: '' },
    poster: { type: String, default: '' }
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  },
  watchlist: [mediaItemSchema],
  favorites: [mediaItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ====================================
// Hash password before saving
// ====================================
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ====================================
// Compare entered password with hashed password
// ====================================
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ====================================
// Generate password reset token
// ====================================
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};

// Index for faster email lookups (unique: true on email field already creates an index)
// Compound index for faster watchlist/favorites lookups
userSchema.index({ 'watchlist.mediaType': 1, 'watchlist.mediaId': 1 });
userSchema.index({ 'favorites.mediaType': 1, 'favorites.mediaId': 1 });

const User = mongoose.model('User', userSchema);

export default User;
