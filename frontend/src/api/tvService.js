// TV Shows API Service
// TODO: Replace with backend API when backend is ready
import axios from 'axios';

// TMDB Configuration (temporary until backend is ready)
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

/**
 * Normalize TMDB TV show data to consistent format
 */
const normalizeTV = (show) => ({
  id: show.id,
  title: show.name || show.title,
  rating: show.vote_average,
  image: show.poster_path ? `${IMG_BASE}${show.poster_path}` : null,
  backdrop: show.backdrop_path ? `${BACKDROP_BASE}${show.backdrop_path}` : null,
  overview: show.overview,
  year: show.first_air_date?.slice(0, 4),
  genre_ids: show.genre_ids || []
});

/**
 * Get trending TV shows
 * @param {string} timeWindow - 'day' or 'week' (default: 'day')
 * @returns {Promise} - Array of trending TV shows
 */
export const getTrendingTV = async (timeWindow = 'day') => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/tv/${timeWindow}?api_key=${TMDB_API_KEY}`
    );
    return response.data.results?.map(normalizeTV) || [];
  } catch (error) {
    console.error('Failed to fetch trending TV shows:', error.message);
    return [];
  }
};

/**
 * Get TV show details by ID
 * @param {string|number} tvId - TV show ID
 * @returns {Promise} - TV show details object
 */
export const getTVDetails = async (tvId) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`
    );
    return normalizeTV(response.data);
  } catch (error) {
    console.error('Failed to fetch TV details:', error.message);
    return null;
  }
};

/**
 * Get all TV shows with optional filters
 * @param {Object} params - Query parameters
 * @returns {Promise} - Paginated TV show results
 */
export const getAllTVShows = async (params = {}) => {
  try {
    const { page = 1, genre, search, sortBy = 'popularity.desc' } = params;
    
    let url;
    if (search) {
      url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(search)}&page=${page}`;
    } else if (genre) {
      url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genre}&page=${page}&sort_by=${sortBy}`;
    } else {
      url = `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    }
    
    const response = await axios.get(url);
    return response.data.results?.map(normalizeTV) || [];
  } catch (error) {
    console.error('Failed to fetch TV shows:', error.message);
    return [];
  }
};

/**
 * Search TV shows by query
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @returns {Promise} - Search results
 */
export const searchTVShows = async (query, page = 1) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );
    return response.data.results?.map(normalizeTV) || [];
  } catch (error) {
    console.error('Failed to search TV shows:', error.message);
    return [];
  }
};

/**
 * Get TV shows by genre
 * @param {string|number} genreId - Genre ID
 * @param {number} page - Page number
 * @returns {Promise} - TV shows in genre
 */
export const getTVShowsByGenre = async (genreId, page = 1) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );
    return response.data.results?.map(normalizeTV) || [];
  } catch (error) {
    console.error('Failed to fetch TV shows by genre:', error.message);
    return [];
  }
};

/**
 * Get TV show genres list
 * @returns {Promise} - Array of TV genres
 */
export const getTVGenres = async () => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`
    );
    return response.data.genres || [];
  } catch (error) {
    console.error('Failed to fetch TV genres:', error.message);
    return [];
  }
};

/**
 * Get TV show season details
 * @param {string|number} tvId - TV show ID
 * @param {number} seasonNumber - Season number
 * @returns {Promise} - Season details with episodes
 */
export const getSeasonDetails = async (tvId, seasonNumber) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch season details:', error.message);
    return null;
  }
};

// Export all functions as default object for convenience
export default {
  getTrendingTV,
  getTVDetails,
  getAllTVShows,
  searchTVShows,
  getTVShowsByGenre,
  getTVGenres,
  getSeasonDetails
};
