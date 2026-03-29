// Backend API Service
// THE ONLY DATA SOURCE FOR MOVIES
// NO MOCK DATA. NO FALLBACKS.
import api from './axios';

/**
 * Normalize backend movie data to consistent frontend shape
 */
const normalizeBackendMovie = (movie) => ({
  id: movie._id,
  _id: movie._id,
  isBackend: true,
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
  interestedCount: movie.interestedCount || 0,
  interestedUsers: movie.interestedUsers || [],
  _raw: movie
});

const normalizeGlobalMovie = (movie) => ({
  id: movie.id,
  title: movie.title,
  description: movie.overview || '',
  overview: movie.overview || '',
  rating: movie.rating || 0,
  poster: movie.poster || null,
  backdrop: movie.backdrop || null,
  image: movie.poster || null,
  language: movie.original_language || 'en',
  releaseDate: movie.releaseDate || null,
  year: movie.year || (movie.releaseDate ? new Date(movie.releaseDate).getFullYear().toString() : ''),
  popularity: movie.popularity || 0,
  isBackend: false,
  bookingEnabled: false,
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
    console.error('Backend returned unsuccessful response');
    return [];
  } catch (error) {
    console.error('Backend API error (movies):', error.message);
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
    console.error('Backend API error (now-playing):', error.message);
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
    console.error('Backend API error (upcoming):', error.message);
    throw error;
  }
};

/**
 * Get globally showing movies from backend TMDB proxy
 * GET /api/movies/global-showing
 */
export const getGlobalShowingMovies = async () => {
  try {
    const response = await api.get('/movies/global-showing');
    if (response.data?.success) {
      return response.data.data.map(normalizeGlobalMovie);
    }
    return [];
  } catch (error) {
    console.error('Backend API error (global-showing):', error.message);
    return [];
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
    console.error('Backend API error (movie by id):', error.message);
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
    console.error('Backend not available:', error.message);
    return false;
  }
};

// Admin: Create movie
export const createMovie = async (movieData) => {
  const response = await api.post('/movies', movieData);
  if (response.data?.success) return normalizeBackendMovie(response.data.data);
  throw new Error('Failed to create movie');
};

// Admin: Update movie
export const updateMovie = async (id, movieData) => {
  const response = await api.put(`/movies/${id}`, movieData);
  if (response.data?.success) return normalizeBackendMovie(response.data.data);
  throw new Error('Failed to update movie');
};

// Admin: Delete movie
export const deleteMovie = async (id) => {
  const response = await api.delete(`/movies/${id}`);
  if (response.data?.success) return true;
  throw new Error('Failed to delete movie');
};

// Get showtimes for a movie
export const getMovieShowtimes = async (id) => {
  const response = await api.get(`/movies/${id}/showtimes`);
  if (response.data?.success) return response.data.data;
  return [];
};

// Admin: Add showtime to a movie
export const addShowtime = async (movieId, showtimeData) => {
  const response = await api.post(`/movies/${movieId}/showtimes`, showtimeData);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to add showtime');
};

// Admin: Remove showtime
export const removeShowtime = async (movieId, showtimeId) => {
  const response = await api.delete(`/movies/${movieId}/showtimes/${showtimeId}`);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to remove showtime');
};

// Admin: Dashboard analytics
export const getAdminDashboardAnalytics = async (days = 30) => {
  const response = await api.get('/admin/dashboard', {
    params: { days }
  });

  if (response.data?.success) {
    return response.data.data;
  }

  throw new Error('Failed to fetch admin dashboard analytics');
};

// Admin: Get all bookings
export const getAdminBookings = async () => {
  const response = await api.get('/bookings');
  if (response.data?.success) {
    return response.data.data || [];
  }
  throw new Error('Failed to fetch admin bookings');
};

// ====================================
// Theater API
// ====================================

// Get all theaters
export const getTheaters = async (activeOnly = false) => {
  const params = activeOnly ? { active: 'true' } : {};
  const response = await api.get('/theaters', { params });
  if (response.data?.success) return response.data.data;
  return [];
};

// Get single theater
export const getTheaterById = async (id) => {
  const response = await api.get(`/theaters/${id}`);
  if (response.data?.success) return response.data.data;
  return null;
};

// Admin: Create theater
export const createTheater = async (data) => {
  const response = await api.post('/theaters', data);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to create theater');
};

// Admin: Update theater
export const updateTheater = async (id, data) => {
  const response = await api.put(`/theaters/${id}`, data);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to update theater');
};

// Admin: Delete theater
export const deleteTheater = async (id) => {
  const response = await api.delete(`/theaters/${id}`);
  if (response.data?.success) return true;
  throw new Error('Failed to delete theater');
};

// Admin: Add hall to theater
export const addHallToTheater = async (theaterId, hallData) => {
  const response = await api.post(`/theaters/${theaterId}/halls`, hallData);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to add hall');
};

// Admin: Remove hall from theater
export const removeHallFromTheater = async (theaterId, hallId) => {
  const response = await api.delete(`/theaters/${theaterId}/halls/${hallId}`);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to remove hall');
};

// Toggle interest on an upcoming movie
export const toggleMovieInterest = async (movieId) => {
  const response = await api.post(`/movies/${movieId}/interest`);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to toggle interest');
};

// Get most interested upcoming movies
export const getMostInterestedMovies = async () => {
  try {
    const response = await api.get('/movies/most-interested');
    if (response.data?.success) {
      return response.data.data.map(normalizeBackendMovie);
    }
    return [];
  } catch (error) {
    console.error('Backend API error (most-interested):', error.message);
    return [];
  }
};

// Export all functions
export default {
  getBackendMovies,
  getBackendNowPlaying,
  getUpcomingMovies,
  getGlobalShowingMovies,
  getBackendMovieById,
  checkBackendHealth,
  toggleMovieInterest,
  getMostInterestedMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieShowtimes,
  addShowtime,
  removeShowtime,
  getAdminDashboardAnalytics,
  getAdminBookings,
  getTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater,
  addHallToTheater,
  removeHallFromTheater
};
