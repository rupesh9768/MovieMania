// ====================================
// Movie API Service
// TODO: Replace with backend API when backend is ready
// TODO: Move TMDB API calls to backend for security (hide API key)
// TODO: Implement caching on backend to reduce API calls
// ====================================
import axios from 'axios';

// TMDB Configuration (temporary until backend is ready)
// TODO: Remove TMDB_API_KEY from frontend once backend API is ready
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
 * TODO: Move normalization logic to backend
 */
const normalizeMovie = (movie) => ({
  id: movie.id,
  title: movie.title || movie.name,
  rating: movie.vote_average,
  image: movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : null,
  backdrop: movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : null,
  overview: movie.overview,
  year: (movie.release_date || movie.first_air_date)?.slice(0, 4),
  genre_ids: movie.genre_ids || [],
  original_language: movie.original_language || null
});

/**
 * Remove duplicate movies by ID
 */
const deduplicateMovies = (movies) => {
  const seen = new Set();
  return movies.filter(movie => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
};

// ====================================
// Regional Movies API (Nepali & Indian)
// TODO: Replace with backend endpoints for regional content
// ====================================

/**
 * Get Indian (Hindi) movies using TMDB Discover API
 * @param {number} page - Page number for pagination
 * @returns {Promise} - Array of Indian movies
 */
export const getIndianMovies = async (page = 1) => {
  try {
    // TODO: Replace with backend API: GET /api/movies/regional/indian
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&region=IN&sort_by=popularity.desc&page=${page}`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('❌ Failed to fetch Indian movies:', error.message);
    return [];
  }
};

/**
 * Get Nepali movies using TMDB Discover API
 * @param {number} page - Page number for pagination
 * @returns {Promise} - Array of Nepali movies
 */
export const getNepaliMovies = async (page = 1) => {
  try {
    // TODO: Replace with backend API: GET /api/movies/regional/nepali
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=ne&sort_by=popularity.desc&page=${page}`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('❌ Failed to fetch Nepali movies:', error.message);
    return [];
  }
};

/**
 * Get combined Nepali and Indian movies (prioritized for Homepage/Browse)
 * Merges both result sets, removes duplicates, and sorts by popularity
 * @param {number} page - Page number for pagination
 * @returns {Promise} - Array of merged regional movies
 */
export const getRegionalMovies = async (page = 1) => {
  try {
    // TODO: Replace with backend API: GET /api/movies/regional
    // Fetch both Nepali and Indian movies in parallel
    const [nepaliMovies, indianMovies] = await Promise.all([
      getNepaliMovies(page),
      getIndianMovies(page)
    ]);

    // Merge and prioritize: Nepali first, then Indian
    const mergedMovies = [...nepaliMovies, ...indianMovies];
    
    // Remove duplicates and return
    return deduplicateMovies(mergedMovies);
  } catch (error) {
    console.error('❌ Failed to fetch regional movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

/**
 * Get trending movies (with regional movie blend for homepage)
 * @param {string} timeWindow - 'day' or 'week' (default: 'day')
 * @param {boolean} blendRegional - Whether to blend regional movies (default: true)
 * @returns {Promise} - Array of trending movies
 */
export const getTrendingMovies = async (timeWindow = 'day', blendRegional = true) => {
  try {
    // TODO: Replace with backend API: GET /api/movies/trending
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}`
    );
    const trendingMovies = response.data.results?.map(normalizeMovie) || [];
    
    // Blend regional movies with trending for better homepage experience
    if (blendRegional) {
      const regionalMovies = await getRegionalMovies(1);
      // Take top 5 regional and mix with trending
      const topRegional = regionalMovies.slice(0, 5);
      // Merge: some regional first, then trending (deduplicated)
      return deduplicateMovies([...topRegional, ...trendingMovies]);
    }
    
    return trendingMovies;
  } catch (error) {
    console.error('❌ Failed to fetch trending movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

/**
 * Get now playing movies (currently in theaters)
 * Prioritizes regional (Nepali/Indian) movies
 * @param {number} page - Page number for pagination
 * @param {boolean} prioritizeRegional - Whether to prioritize regional movies (default: true)
 * @returns {Promise} - Array of now playing movies
 */
export const getNowPlayingMovies = async (page = 1, prioritizeRegional = true) => {
  try {
    // TODO: Replace with backend API: GET /api/movies/now-playing
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&page=${page}`
    );
    const nowPlayingMovies = response.data.results?.map(normalizeMovie) || [];
    
    // Prioritize regional movies in the now playing list
    if (prioritizeRegional) {
      const regionalMovies = await getRegionalMovies(page);
      // Blend regional movies with now playing
      return deduplicateMovies([...regionalMovies.slice(0, 8), ...nowPlayingMovies]);
    }
    
    return nowPlayingMovies;
  } catch (error) {
    console.error('❌ Failed to fetch now playing movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

/**
 * Get all/popular movies with optional filters
 * Prioritizes Nepali and Indian movies when no search/genre filter is applied
 * @param {Object} params - Query parameters
 * @returns {Promise} - Paginated movie results
 */
export const getAllMovies = async (params = {}) => {
  try {
    // TODO: Replace with backend API: GET /api/movies
    const { page = 1, genre, search, sortBy = 'popularity.desc', includeRegional = true } = params;
    
    // If searching, use search endpoint
    if (search) {
      const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(search)}&page=${page}`;
      const response = await axios.get(url);
      return response.data.results?.map(normalizeMovie) || [];
    }
    
    // If filtering by genre, use discover with genre
    if (genre) {
      const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genre}&page=${page}&sort_by=${sortBy}`;
      const response = await axios.get(url);
      return response.data.results?.map(normalizeMovie) || [];
    }
    
    // Default: Prioritize regional (Nepali + Indian) movies
    // TODO: Backend should handle this merging and prioritization
    if (includeRegional) {
      const regionalMovies = await getRegionalMovies(page);
      
      // If we have enough regional movies, return them
      if (regionalMovies.length >= 10) {
        return regionalMovies;
      }
      
      // Otherwise, supplement with popular movies (but prioritize regional)
      const popularResponse = await axios.get(
        `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
      );
      const popularMovies = popularResponse.data.results?.map(normalizeMovie) || [];
      
      // Merge: regional first, then popular (deduplicated)
      return deduplicateMovies([...regionalMovies, ...popularMovies]);
    }
    
    // Fallback to popular movies
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
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
// TODO: Update exports when backend API is integrated
export default {
  getTrendingMovies,
  getNowPlayingMovies,
  getAllMovies,
  getMovieDetails,
  searchMovies,
  getMoviesByGenre,
  getGenres,
  // Regional movie functions
  getIndianMovies,
  getNepaliMovies,
  getRegionalMovies
};
