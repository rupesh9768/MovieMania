// ====================================
// Backend API Service
// THE ONLY DATA SOURCE FOR MOVIES
// NO MOCK DATA. NO FALLBACKS.
// ====================================
import api from './axios';

/**
 * Normalize backend movie data to consistent frontend shape
 */
const normalizeBackendMovie = (movie) => ({
  id: movie._id,
  title: movie.title,
  description: movie.description || '',
  overview: movie.description || '',
  rating: movie.rating || 0,
  poster: movie.poster || null,
  backdrop: movie.backdrop || null,
  image: movie.poster || null, // alias for compatibility
  language: movie.language,
  country: movie.country,
  genres: movie.genre || [],
  runtime: movie.runtime,
  releaseDate: movie.releaseDate,
  year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear().toString() : '',
  isNowPlaying: movie.isNowPlaying || false,
  bookingEnabled: movie.bookingEnabled || false,
  _raw: movie
});

/**
 * Get all movies from backend
 * GET /api/movies
 */
export const getBackendMovies = async () => {
  try {
    const response = await api.get('/movies');
    if (response.data?.success) {
      return response.data.data.map(normalizeBackendMovie);
    }
    console.error('❌ Backend returned unsuccessful response');
    return [];
  } catch (error) {
    console.error('❌ Backend API error (movies):', error.message);
    throw error; // Don't silently fail
  }
};

/**
 * Get now playing movies from backend
 * GET /api/movies/now-playing
 */
export const getBackendNowPlaying = async () => {
  try {
    const response = await api.get('/movies/now-playing');
    if (response.data?.success) {
      return response.data.data.map(normalizeBackendMovie);
    }
    return [];
  } catch (error) {
    console.error('❌ Backend API error (now-playing):', error.message);
    throw error;
  }
};

/**
 * Get upcoming movies from backend
 * GET /api/movies/upcoming
 */
export const getUpcomingMovies = async () => {
  try {
    const response = await api.get('/movies/upcoming');
    if (response.data?.success) {
      return response.data.data.map(normalizeBackendMovie);
    }
    return [];
  } catch (error) {
    console.error('❌ Backend API error (upcoming):', error.message);
    throw error;
  }
};

/**
 * Get single movie from backend
 * GET /api/movies/:id
 */
export const getBackendMovieById = async (id) => {
  try {
    const response = await api.get(`/movies/${id}`);
    if (response.data?.success) {
      return normalizeBackendMovie(response.data.data);
    }
    return null;
  } catch (error) {
    console.error('❌ Backend API error (movie by id):', error.message);
    throw error;
  }
};

/**
 * Check if backend is available
 */
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data?.status === 'OK';
  } catch (error) {
    console.error('❌ Backend not available:', error.message);
    return false;
  }
};

// Export all functions
export default {
  getBackendMovies,
  getBackendNowPlaying,
  getUpcomingMovies,
  getBackendMovieById,
  checkBackendHealth
};
