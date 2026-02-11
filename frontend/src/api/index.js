// ====================================
// API Services Index
// Re-exports all API services for easy imports
// ====================================

// Movie API Service (TMDB)
export * from './movieService';
export { default as movieApi } from './movieService';

// Backend API Service (MongoDB)
export * from './backendService';
export { default as backendApi } from './backendService';

// TV Shows API Service
export * from './tvService';
export { default as tvService } from './tvService';

// Anime API Service (Jikan)
export * from './animeService';
export { default as animeApi } from './animeService';

// Booking API Service
export * from './bookingService';
export { default as bookingApi } from './bookingService';

// User API Service (Watchlist & Favorites)
export * from './userService';
export { default as userApi } from './userService';

// Auth API Service
export * from './authService';
export { default as authApi } from './authService';

// Discussion API Service
export * from './discussionService';
export { default as discussionApi } from './discussionService';

// Profile API Service
export * from './profileService';
export { default as profileApi } from './profileService';

// Axios instance (for custom requests)
export { default as api } from './axios';
