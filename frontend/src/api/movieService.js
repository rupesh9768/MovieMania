// Movie API Service
import axios from 'axios';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const FALLBACK_MOVIES = [
  {
    id: 1,
    title: 'Sample Movie 1',
    image: '/no-poster.png',
    backdrop: '/no-poster.png',
    overview: 'A captivating story awaits you.',
    year: '2024'
  },
  {
    id: 2,
    title: 'Sample Movie 2',
    image: '/no-poster.png',
    backdrop: '/no-poster.png',
    overview: 'An exciting adventure begins.',
    year: '2024'
  },
  {
    id: 3,
    title: 'Sample Movie 3',
    image: '/no-poster.png',
    backdrop: '/no-poster.png',
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
  image: movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : null,
  backdrop: movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : null,
  overview: movie.overview,
  popularity: movie.popularity || 0,
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

export const getIndianMovies = async (page = 1) => {
  try {

    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&region=IN&sort_by=popularity.desc&page=${page}`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('Failed to fetch Indian movies:', error.message);
    return [];
  }
};

export const getNepaliMovies = async (page = 1) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=ne&sort_by=popularity.desc&page=${page}`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('Failed to fetch Nepali movies:', error.message);
    return [];
  }
};


export const getRegionalMovies = async (page = 1) => {
  try {
    const [nepaliMovies, indianMovies] = await Promise.all([
      getNepaliMovies(page),
      getIndianMovies(page)
    ]);
    return deduplicateMovies([...nepaliMovies, ...indianMovies]);
  } catch (error) {
    console.error('Failed to fetch regional movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

export const getTrendingMovies = async (timeWindow = 'day', blendRegional = true) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}`
    );
    const trendingMovies = response.data.results?.map(normalizeMovie) || [];
    
    if (blendRegional) {
      const regionalMovies = await getRegionalMovies(1);
      const topRegional = regionalMovies.slice(0, 5);
      return deduplicateMovies([...topRegional, ...trendingMovies]);
    }
    
    return trendingMovies;
  } catch (error) {
    console.error('Failed to fetch trending movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

export const getNowPlayingMovies = async (page = 1, prioritizeRegional = true) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&page=${page}`
    );
    const nowPlayingMovies = response.data.results?.map(normalizeMovie) || [];
    
    if (prioritizeRegional) {
      const regionalMovies = await getRegionalMovies(page);
      return deduplicateMovies([...regionalMovies.slice(0, 8), ...nowPlayingMovies]);
    }
    
    return nowPlayingMovies;
  } catch (error) {
    console.error('Failed to fetch now playing movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

export const getAllMovies = async (params = {}) => {
  try {
    const { page = 1, genre, search, sortBy = 'popularity.desc', includeRegional = true } = params;
    
    if (search) {
      const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(search)}&page=${page}`;
      const response = await axios.get(url);
      return response.data.results?.map(normalizeMovie) || [];
    }
    
    if (genre) {
      const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genre}&page=${page}&sort_by=${sortBy}`;
      const response = await axios.get(url);
      return response.data.results?.map(normalizeMovie) || [];
    }
    
    if (includeRegional) {
      const regionalMovies = await getRegionalMovies(page);
      
      if (regionalMovies.length >= 10) {
        return regionalMovies;
      }
      
      const popularResponse = await axios.get(
        `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
      );
      const popularMovies = popularResponse.data.results?.map(normalizeMovie) || [];
      
      return deduplicateMovies([...regionalMovies, ...popularMovies]);
    }
    
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    const response = await axios.get(url);
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('Failed to fetch movies:', error.message);
    return FALLBACK_MOVIES;
  }
};

export const getMovieDetails = async (movieId) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`
    );
    return normalizeMovie(response.data);
  } catch (error) {
    console.error('Failed to fetch movie details:', error.message);
    return null;
  }
};

export const searchMovies = async (query, page = 1) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('Failed to search movies:', error.message);
    return [];
  }
};

export const getMoviesByGenre = async (genreId, page = 1) => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );
    return response.data.results?.map(normalizeMovie) || [];
  } catch (error) {
    console.error('Failed to fetch movies by genre:', error.message);
    return [];
  }
};

export const getGenres = async () => {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`
    );
    return response.data.genres || [];
  } catch (error) {
    console.error('Failed to fetch genres:', error.message);
    return [];
  }
};

export const getUpcomingMovies = async (page = 1, region = 'US') => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch upcoming movies - TMDB returns movies releasing in next 3 weeks by default
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&page=${page}&region=${region}`
    );
    
    const movies = response.data.results || [];
    
    // Filter to only include movies with future release dates and normalize
    const upcomingMovies = movies
      .filter(movie => movie.release_date && movie.release_date >= today)
      .map(movie => ({
        ...normalizeMovie(movie),
        releaseDate: movie.release_date,
        rawReleaseDate: movie.release_date
      }));
    
    return {
      movies: upcomingMovies,
      page: response.data.page,
      totalPages: Math.min(response.data.total_pages || 1, 20),
      totalResults: response.data.total_results
    };
  } catch (error) {
    console.error('Failed to fetch upcoming movies:', error.message);
    return { movies: [], page: 1, totalPages: 1, totalResults: 0 };
  }
};

export const getUpcomingMoviesExtended = async (page = 1, monthsAhead = 6) => {
  try {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + monthsAhead);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Use discover endpoint for more control over date range
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&sort_by=release_date.asc&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDateStr}&with_release_type=2|3`
    );
    
    const movies = (response.data.results || []).map(movie => ({
      ...normalizeMovie(movie),
      releaseDate: movie.release_date,
      rawReleaseDate: movie.release_date
    }));
    
    return {
      movies,
      page: response.data.page,
      totalPages: Math.min(response.data.total_pages || 1, 20),
      totalResults: response.data.total_results
    };
  } catch (error) {
    console.error('Failed to fetch extended upcoming movies:', error.message);
    return { movies: [], page: 1, totalPages: 1, totalResults: 0 };
  }
};

export const getUpcomingBigMovies = async (monthsAhead = 8) => {
  try {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + monthsAhead);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Fetch from multiple sources in parallel
    const [englishMovies, hindiMovies, nepaliMovies] = await Promise.all([
      // Hollywood/English - Big releases (high vote count threshold)
      axios.get(
        `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=1&sort_by=popularity.desc&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDateStr}&with_original_language=en&vote_count.gte=0`
      ).then(res => res.data.results || []).catch(() => []),
      
      // Bollywood/Hindi - Indian movies
      axios.get(
        `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=1&sort_by=popularity.desc&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDateStr}&with_original_language=hi`
      ).then(res => res.data.results || []).catch(() => []),
      
      // Nepali movies
      axios.get(
        `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=1&sort_by=popularity.desc&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDateStr}&with_original_language=ne`
      ).then(res => res.data.results || []).catch(() => [])
    ]);
    
    // Also fetch page 2 for English and Hindi to get more results
    const [englishPage2, hindiPage2] = await Promise.all([
      axios.get(
        `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=2&sort_by=popularity.desc&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDateStr}&with_original_language=en`
      ).then(res => res.data.results || []).catch(() => []),
      
      axios.get(
        `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=2&sort_by=popularity.desc&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDateStr}&with_original_language=hi`
      ).then(res => res.data.results || []).catch(() => [])
    ]);
    
    // Combine all movies
    const allMovies = [
      ...englishMovies,
      ...englishPage2,
      ...hindiMovies,
      ...hindiPage2,
      ...nepaliMovies
    ];
    
    // Normalize and add language tag
    const normalizedMovies = allMovies.map(movie => ({
      ...normalizeMovie(movie),
      releaseDate: movie.release_date,
      rawReleaseDate: movie.release_date,
      language: movie.original_language === 'hi' ? 'Hindi' : 
                movie.original_language === 'ne' ? 'Nepali' : 
                movie.original_language === 'en' ? 'English' : 'Other',
      popularity: movie.popularity || 0
    }));
    
    // Remove duplicates by ID
    const seen = new Set();
    const uniqueMovies = normalizedMovies.filter(movie => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });
    
    // Sort by popularity (big movies first), then by release date
    uniqueMovies.sort((a, b) => {
      // Prioritize by popularity score
      return b.popularity - a.popularity;
    });
    
    return uniqueMovies;
  } catch (error) {
    console.error('Failed to fetch big upcoming movies:', error.message);
    return [];
  }
};

export default {
  getTrendingMovies,
  getNowPlayingMovies,
  getAllMovies,
  getMovieDetails,
  searchMovies,
  getMoviesByGenre,
  getGenres,
  getUpcomingMovies,
  getUpcomingMoviesExtended,
  getUpcomingBigMovies,
  // Regional movie functions
  getIndianMovies,
  getNepaliMovies,
  getRegionalMovies
};
