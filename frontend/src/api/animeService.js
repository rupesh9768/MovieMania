// ====================================
// Anime API Service (Jikan API)
// TODO: Replace with backend API when backend is ready
// ====================================
import axios from 'axios';

// Jikan API Base URL (MyAnimeList unofficial API)
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Create dedicated axios instance for Jikan API
const jikanApi = axios.create({
  baseURL: JIKAN_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Rate limiting helper (Jikan has rate limits)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get top anime list
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page (max 25)
 * @param {string} params.filter - Filter type (airing, upcoming, bypopularity, favorite)
 * @param {string} params.type - Anime type (tv, movie, ova, special, ona, music)
 * @returns {Promise} - Top anime list with pagination
 */
export const getTopAnime = async (params = {}) => {
  try {
    const response = await jikanApi.get('/top/anime', {
      params: {
        page: params.page || 1,
        limit: params.limit || 24,
        filter: params.filter,
        type: params.type
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch top anime:', error.message);
    return { data: [], pagination: { last_visible_page: 1 } };
  }
};

/**
 * Get anime details by ID
 * @param {string|number} animeId - MyAnimeList anime ID
 * @returns {Promise} - Anime details object
 */
export const getAnimeDetails = async (animeId) => {
  try {
    const response = await jikanApi.get(`/anime/${animeId}/full`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch anime details:', error.message);
    return null;
  }
};

/**
 * Get anime by genre
 * @param {string|number} genreId - Genre ID
 * @param {number} page - Page number
 * @returns {Promise} - Anime list filtered by genre
 */
export const getAnimeByGenre = async (genreId, page = 1) => {
  try {
    const response = await jikanApi.get('/anime', {
      params: {
        genres: genreId,
        page,
        limit: 24,
        order_by: 'score',
        sort: 'desc'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch anime by genre:', error.message);
    return { data: [], pagination: { last_visible_page: 1 } };
  }
};

/**
 * Get anime characters
 * @param {string|number} animeId - MyAnimeList anime ID
 * @returns {Promise} - List of characters
 */
export const getAnimeCharacters = async (animeId) => {
  try {
    const response = await jikanApi.get(`/anime/${animeId}/characters`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch anime characters:', error.message);
    return { data: [] };
  }
};

/**
 * Search anime by query
 * @param {string} query - Search query
 * @param {Object} params - Additional parameters
 * @param {number} params.page - Page number
 * @param {string} params.type - Anime type filter
 * @param {string} params.status - Status filter (airing, complete, upcoming)
 * @returns {Promise} - Search results
 */
export const searchAnime = async (query, params = {}) => {
  try {
    const response = await jikanApi.get('/anime', {
      params: {
        q: query,
        page: params.page || 1,
        limit: params.limit || 24,
        type: params.type,
        status: params.status,
        order_by: 'score',
        sort: 'desc'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to search anime:', error.message);
    return { data: [], pagination: { last_visible_page: 1 } };
  }
};

/**
 * Get anime genres list
 * @returns {Promise} - List of anime genres
 */
export const getAnimeGenres = async () => {
  try {
    const response = await jikanApi.get('/genres/anime');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch anime genres:', error.message);
    return { data: [] };
  }
};

/**
 * Get seasonal anime
 * @param {number} year - Year
 * @param {string} season - Season (winter, spring, summer, fall)
 * @param {number} page - Page number
 * @returns {Promise} - Seasonal anime list
 */
export const getSeasonalAnime = async (year, season, page = 1) => {
  try {
    const response = await jikanApi.get(`/seasons/${year}/${season}`, {
      params: { page }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch seasonal anime:', error.message);
    return { data: [], pagination: { last_visible_page: 1 } };
  }
};

/**
 * Get current season anime
 * @param {number} page - Page number
 * @returns {Promise} - Current season anime
 */
export const getCurrentSeasonAnime = async (page = 1) => {
  try {
    const response = await jikanApi.get('/seasons/now', {
      params: { page }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch current season anime:', error.message);
    return { data: [], pagination: { last_visible_page: 1 } };
  }
};

/**
 * Get anime recommendations
 * @param {string|number} animeId - MyAnimeList anime ID
 * @returns {Promise} - Recommended anime list
 */
export const getAnimeRecommendations = async (animeId) => {
  try {
    const response = await jikanApi.get(`/anime/${animeId}/recommendations`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch anime recommendations:', error.message);
    return { data: [] };
  }
};

// Export all functions as default object
export default {
  getTopAnime,
  getAnimeDetails,
  getAnimeByGenre,
  getAnimeCharacters,
  searchAnime,
  getAnimeGenres,
  getSeasonalAnime,
  getCurrentSeasonAnime,
  getAnimeRecommendations
};
