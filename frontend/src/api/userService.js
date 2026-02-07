// ====================================
// User Service
// API calls for watchlist and favorites
// ====================================
import api from './axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Get user ID from localStorage
 * Returns null if not logged in
 */
export const getUserId = () => {
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    const parsed = JSON.parse(user);
    return parsed._id || parsed.id || null;
  } catch {
    return null;
  }
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = () => {
  return !!getUserId();
};

// ============================================
// WATCHLIST OPERATIONS
// ============================================

/**
 * Get user's watchlist
 */
export const getWatchlist = async () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not logged in');
  
  const response = await api.get(`/users/${userId}/watchlist`);
  return response.data;
};

/**
 * Add item to watchlist
 */
export const addToWatchlist = async (item) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not logged in');
  
  const response = await api.post(`/users/${userId}/watchlist`, {
    mediaType: item.mediaType,
    mediaId: String(item.id || item.mediaId),
    title: item.title,
    poster: item.poster,
    rating: item.rating
  });
  return response.data;
};

/**
 * Remove item from watchlist
 */
export const removeFromWatchlist = async (mediaType, mediaId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not logged in');
  
  const response = await api.delete(`/users/${userId}/watchlist/${mediaType}/${mediaId}`);
  return response.data;
};

// ============================================
// FAVORITES OPERATIONS
// ============================================

/**
 * Get user's favorites
 */
export const getFavorites = async () => {
  const userId = getUserId();
  if (!userId) throw new Error('User not logged in');
  
  const response = await api.get(`/users/${userId}/favorites`);
  return response.data;
};

/**
 * Add item to favorites
 */
export const addToFavorites = async (item) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not logged in');
  
  const response = await api.post(`/users/${userId}/favorites`, {
    mediaType: item.mediaType,
    mediaId: String(item.id || item.mediaId),
    title: item.title,
    poster: item.poster,
    rating: item.rating
  });
  return response.data;
};

/**
 * Remove item from favorites
 */
export const removeFromFavorites = async (mediaType, mediaId) => {
  const userId = getUserId();
  if (!userId) throw new Error('User not logged in');
  
  const response = await api.delete(`/users/${userId}/favorites/${mediaType}/${mediaId}`);
  return response.data;
};

// ============================================
// CHECK STATUS
// ============================================

/**
 * Check if item is in watchlist or favorites
 */
export const checkItemInLists = async (mediaType, mediaId) => {
  const userId = getUserId();
  if (!userId) {
    return { inWatchlist: false, inFavorites: false };
  }
  
  try {
    const response = await api.get(`/users/${userId}/lists/check`, {
      params: { mediaType, mediaId: String(mediaId) }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error checking lists:', error);
    return { inWatchlist: false, inFavorites: false };
  }
};

export default {
  getUserId,
  isLoggedIn,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkItemInLists
};
