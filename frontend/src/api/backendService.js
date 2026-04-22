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
  image: movie.poster || null,
  language: movie.language,
  country: movie.country,
  genres: movie.genre || [],
  runtime: movie.runtime,
  releaseDate: movie.releaseDate,
  year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear().toString() : '',
  status: movie.status || (movie.isNowPlaying ? 'now_playing' : 'coming_soon'),
  isNowPlaying: movie.status === 'now_playing' || movie.isNowPlaying || false,
  bookingEnabled: movie.status === 'now_playing' || movie.bookingEnabled || false,
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
 * GET /api/movies?city=cityId
 */
export const getBackendMovies = async (cityId = null) => {
  try {
    const params = {};
    if (cityId) params.city = cityId;
    const response = await api.get('/movies', { params });
    if (response.data?.success) {
      return response.data.data.map(normalizeBackendMovie);
    }
    console.error('Backend returned unsuccessful response');
    return [];
  } catch (error) {
    console.error('Backend API error (movies):', error.message);
    throw error;
  }
};

/**
 * Get now playing movies from backend
 * GET /api/movies/now-playing?city=cityId
 */
export const getBackendNowPlaying = async (cityId = null) => {
  try {
    const params = {};
    if (cityId) params.city = cityId;
    const response = await api.get('/movies/now-playing', { params });
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
 * Find a backend movie by its TMDB ID (scans upcoming list)
 */
export const getBackendMovieByTmdbId = async (tmdbId) => {
  try {
    const response = await api.get('/movies/upcoming');
    if (response.data?.success) {
      const match = response.data.data.find(m => m.tmdbId === Number(tmdbId));
      return match ? normalizeBackendMovie(match) : null;
    }
    return null;
  } catch {
    return null;
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

// City API

// Get all cities
export const getCities = async () => {
  const response = await api.get('/cities');
  if (response.data?.success) return response.data.data;
  return [];
};

// Admin: Create city
export const createCity = async (name) => {
  const response = await api.post('/cities', { name });
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to create city');
};

// Admin: Update city
export const updateCity = async (id, name) => {
  const response = await api.put(`/cities/${id}`, { name });
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to update city');
};

// Admin: Delete city
export const deleteCity = async (id) => {
  const response = await api.delete(`/cities/${id}`);
  if (response.data?.success) return true;
  throw new Error('Failed to delete city');
};

// Theater API

// Get all theaters
export const getTheaters = async (activeOnly = false, cityId = null) => {
  const params = {};
  if (activeOnly) params.active = 'true';
  if (cityId) params.city = cityId;
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

// Admin: Save seat layout for a hall
export const saveHallLayout = async (theaterId, hallId, layoutData) => {
  const response = await api.put(`/theaters/${theaterId}/halls/${hallId}/layout`, layoutData);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to save seat layout');
};

// Get seat layout for a hall
export const getHallLayout = async (theaterId, hallId) => {
  const response = await api.get(`/theaters/${theaterId}/halls/${hallId}/layout`);
  if (response.data?.success) return response.data.data;
  return null;
};

// Toggle interest on an upcoming movie (backend movie with MongoDB _id)
export const toggleMovieInterest = async (movieId) => {
  const response = await api.post(`/movies/${movieId}/interest`);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to toggle interest');
};

// Toggle interest on a TMDB upcoming movie (find-or-create by tmdbId)
export const toggleTmdbMovieInterest = async ({ tmdbId, title, poster, backdrop, releaseDate, language }) => {
  const response = await api.post('/movies/tmdb-interest', {
    tmdbId, title, poster, backdrop, releaseDate, language
  });
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

// Admin: Get all users with booking stats
export const getAdminUsers = async () => {
  const response = await api.get('/admin/users');
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to fetch users');
};

// Admin: Get per-hall analytics
export const getHallAnalytics = async (params = {}) => {
  const response = await api.get('/admin/hall-analytics', { params });
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to fetch hall analytics');
};

// Admin: Get showtime seat map
export const getShowtimeSeatMap = async (movieId, showtimeId) => {
  const response = await api.get('/admin/showtime-seats', {
    params: { movieId, showtimeId }
  });
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to fetch seat map');
};

// Theater Admin Management

export const getTheaterAdmins = async () => {
  const response = await api.get('/admin/theater-admins');
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to fetch theater admins');
};

export const createTheaterAdmin = async (data) => {
  const response = await api.post('/admin/create-theater-admin', data);
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to create theater admin');
};

export const updateTheaterAdmin = async (id, data) => {
  const response = await api.put(`/admin/theater-admins/${id}`, data);
  if (response.data?.success) return response.data.data;
  throw new Error('Failed to update theater admin');
};

export const deleteTheaterAdmin = async (id) => {
  const response = await api.delete(`/admin/theater-admins/${id}`);
  if (response.data?.success) return true;
  throw new Error('Failed to delete theater admin');
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
  toggleTmdbMovieInterest,
  getMostInterestedMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieShowtimes,
  addShowtime,
  removeShowtime,
  getAdminDashboardAnalytics,
  getAdminBookings,
  getAdminUsers,
  getHallAnalytics,
  getShowtimeSeatMap,
  getCities,
  createCity,
  updateCity,
  deleteCity,
  getTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater,
  addHallToTheater,
  removeHallFromTheater,
  saveHallLayout,
  getHallLayout,
  getTheaterAdmins,
  createTheaterAdmin,
  updateTheaterAdmin,
  deleteTheaterAdmin
};
