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

// Axios instance (for custom requests)
export { default as api } from './axios';
