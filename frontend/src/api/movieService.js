// ====================================
// Movie API Service
// TODO: Replace with backend API when backend is ready
// ====================================
import axios from 'axios';

// TMDB Configuration (temporary until backend is ready)
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

// Fallback mock data if API fails
const FALLBACK_MOVIES = [
  {
    id: 1,
    title: 'Sample Movie 1',
    rating: 8.5,
    image: 'https://via.placeholder.com/500x750?text=Movie+1',
    backdrop: 'https://via.placeholder.com/1280x720?text=Backdrop+1',
    overview: 'A captivating story awaits you.',
    year: '2024'
  },
  {
    id: 2,
    title: 'Sample Movie 2',
    rating: 7.8,
    image: 'https://via.placeholder.com/500x750?text=Movie+2',
    backdrop: 'https://via.placeholder.com/1280x720?text=Backdrop+2',
    overview: 'An exciting adventure begins.',
    year: '2024'
  },
  {
    id: 3,
    title: 'Sample Movie 3',
    rating: 9.0,
    image: 'https://via.placeholder.com/500x750?text=Movie+3',
    backdrop: 'https://via.placeholder.com/1280x720?text=Backdrop+3',
    overview: 'Experience the thrill.',
    year: '2024'
  }
];

/**
 * Normalize TMDB movie data to consistent format
 */
const normalizeMovie = (movie) => ({
  id: movie.id,
  title: movie.title || movie.name,
  rating: movie.vote_average,
  image: movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : null,
  backdrop: movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : null,
  overview: movie.overview,
  year: (movie.release_date || movie.first_air_date)?.slice(0, 4),
  genre_ids: movie.genre_ids || []
});

/**
 * Get trending movies
 * @param {string} timeWindow - 'day' or 'week' (default: 'day')
 * @returns {Promise} - Array of trending movies
 */
export const getTrendingMovies = async (timeWindow = 'day') => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('❌ Failed to fetch trending movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

/**
 * Get now playing movies (currently in theaters)
 * @param {number} page - Page number for pagination
 * @returns {Promise} - Array of now playing movies
 */
export const getNowPlayingMovies = async (page = 1) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&page=${page}`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('❌ Failed to fetch now playing movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

/**
 * Get all/popular movies with optional filters
 * @param {Object} params - Query parameters
 * @returns {Promise} - Paginated movie results
 */
export const getAllMovies = async (params = {}) => {
  try {
    const { page = 1, genre, search, sortBy = 'popularity.desc' } = params;
    
    let url;
    if (search) {
      url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(search)}&page=${page}`;
    } else if (genre) {
      url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genre}&page=${page}&sort_by=${sortBy}`;
    } else {
      url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    }
    
    const response = await axios.get(url);
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('❌ Failed to fetch movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

/**
 * Get movie details by ID
 * @param {string|number} movieId - Movie ID
 * @returns {Promise} - Movie details object
 */
export const getMovieDetails = async (movieId) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`
    );
    return normalizeMovie(response.data);
  } catch (error) {
    console.error('❌ Failed to fetch movie details:', error.message);
    return null;
  }
};

/**
 * Search movies by query
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @returns {Promise} - Search results
 */
export const searchMovies = async (query, page = 1) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('❌ Failed to search movies:', error.message);
    return [];
  }
};

/**
 * Get movies by genre
 * @param {string|number} genreId - Genre ID
 * @param {number} page - Page number
 * @returns {Promise} - Movies in genre
 */
export const getMoviesByGenre = async (genreId, page = 1) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('❌ Failed to fetch movies by genre:', error.message);
    return [];
  }
};

/**
 * Get movie genres list
 * @returns {Promise} - Array of genres
 */
export const getGenres = async () => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`
    );
    return response.data.genres || [];
  } catch (error) {
    console.error('❌ Failed to fetch genres:', error.message);
    return [];
  }
};

// Export all functions as default object for convenience
export default {
  getTrendingMovies,
  getNowPlayingMovies,
  getAllMovies,
  getMovieDetails,
  searchMovies,
  getMoviesByGenre,
  getGenres
};
