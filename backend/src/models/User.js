// ====================================
// User Model
// ====================================
import mongoose from 'mongoose';

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
  watchlist: [mediaItemSchema],
  favorites: [mediaItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster email lookups
userSchema.index({ email: 1 });

// Compound index for faster watchlist/favorites lookups
userSchema.index({ 'watchlist.mediaType': 1, 'watchlist.mediaId': 1 });
userSchema.index({ 'favorites.mediaType': 1, 'favorites.mediaId': 1 });

const User = mongoose.model('User', userSchema);

export default User;
