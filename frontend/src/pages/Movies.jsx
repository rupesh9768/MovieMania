import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// TMDB API Configuration
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

const RandomCard = ({ item, onRandomize, navigate, itemsAvailable }) => {
  // Get image URL
  const getImageUrl = () => {
    if (!item) return 'https://via.placeholder.com/300x450?text=?';
    return item.image || (item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster');
  };

  // Get rating
  const getRating = () => {
    return item?.rating || item?.vote_average || 0;
  };

  return (
    <div className="flex flex-col items-center py-12 border-t border-slate-800 mt-10">
      <h3 className="text-sm font-semibold text-slate-400 mb-5">Random Movie Pick</h3>
      
      {item ? (
        <div 
          onClick={() => navigate(`/movie/${item.id}`)}
          className="w-48 cursor-pointer group"
        >
          <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 shadow-xl border border-slate-800/50 group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/20 transition-all duration-300">
            <img
              src={getImageUrl()}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white font-bold text-sm truncate">{item.title}</p>
              <p className="text-yellow-400 text-xs mt-1">★ {getRating().toFixed(1)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-48 aspect-2/3 bg-slate-800/50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-700">
          <p className="text-slate-500 text-sm text-center px-4">Click to get random!</p>
        </div>
      )}

      <button
        onClick={onRandomize}
        disabled={!itemsAvailable}
        className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/25"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {item ? 'Get Another' : 'Get Random'}
      </button>
    </div>
  );
};

const Movies = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const genreFromState = location.state?.genreId;
  
  // State
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(genreFromState || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [randomItem, setRandomItem] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let url;
        
        if (searchQuery.trim()) {
          // Search movies
          url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
        } else if (selectedGenre) {
          // Discover by genre
          url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}&sort_by=popularity.desc&page=${currentPage}`;
        } else {
          // Popular movies
          url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${currentPage}`;
        }
        
        const response = await axios.get(url);
        const results = response.data.results || [];
        
        // Normalize TMDB data
        const normalizedMovies = results.map(movie => ({
          id: movie.id,
          title: movie.title,
          rating: movie.vote_average || 0,
          image: movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : null,
          poster_path: movie.poster_path,
          overview: movie.overview,
          year: movie.release_date?.slice(0, 4) || '',
          genre_ids: movie.genre_ids || []
        }));
        
        setMovies(normalizedMovies);
        setTotalPages(Math.min(response.data.total_pages || 1, 20)); // Limit to 20 pages
        
        console.log(`TMDB returned ${normalizedMovies.length} movies (page ${currentPage})`);
      } catch (err) {
        console.error('Failed to fetch movies from TMDB:', err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchMovies, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedGenre, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre]);

  // Update genre when coming from another page
  useEffect(() => {
    if (genreFromState) {
      setSelectedGenre(genreFromState);
    }
  }, [genreFromState]);

  const handleRandomize = () => {
    if (movies.length === 0) return;
    const newItem = movies[Math.floor(Math.random() * movies.length)];
    setRandomItem(newItem);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre(null);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-black mb-1">Movies</h1>
          <p className="text-slate-500 text-xs">Discover and explore movies from around the world</p>
        </div>

        <div className="flex gap-6">
          {/* LEFT SIDEBAR: Search + Filters */}
          <div className="w-52 shrink-0">
            <div className="sticky top-20 space-y-4">
              {/* Search */}
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800 transition-all"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              {/* Genre Filter - Pill Style */}
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Genres</label>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRES.map(genre => (
                      <button
                        key={genre.id}
                        onClick={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                          selectedGenre === genre.id 
                            ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25' 
                            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchQuery || selectedGenre) && (
                <button 
                  onClick={clearFilters}
                  className="w-full text-xs text-slate-400 hover:text-cyan-400 py-2 border border-slate-800 rounded-lg hover:border-cyan-500/30 transition-all"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Movie Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {(searchQuery || selectedGenre) && (
              <div className="mb-4 text-sm text-slate-400">
                {searchQuery && <span>Results for "{searchQuery}"</span>}
                {selectedGenre && <span> • {GENRES.find(g => g.id === selectedGenre)?.name}</span>}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : movies.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                <span className="text-sm text-slate-500 block mb-3">No movies available</span>
                <p className="text-slate-400 font-medium">No movies available</p>
                <p className="text-slate-600 text-sm mt-1">Check back soon for new releases</p>
                {(searchQuery || selectedGenre) && (
                  <button onClick={clearFilters} className="mt-4 text-cyan-400 text-sm hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Grid */}
                <div className="grid grid-cols-4 gap-5">
                  {movies.map(movie => {
                    // Handle TMDB format
                    const imageUrl = movie.image || (movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster');
                    const rating = movie.rating || movie.vote_average || 0;
                    const year = movie.year || movie.release_date?.slice?.(0, 4) || '';
                    
                    return (
                      <div
                        key={movie.id}
                        onClick={() => navigate(`/movie/${movie.id}`)}
                        className="cursor-pointer group"
                      >
                        <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-2.5 border border-slate-800/50 group-hover:border-cyan-500/50 shadow-lg shadow-black/20 group-hover:shadow-cyan-500/10 transition-all duration-300">
                          <img
                            src={imageUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            <span className="text-yellow-400">★</span> {rating.toFixed(1)}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs text-cyan-400 font-medium">View Details</span>
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">{movie.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{year}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-3 mt-6 pt-6 border-t border-slate-800/50">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-slate-800/80 rounded-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Prev
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {currentPage > 2 && (
                      <>
                        <button onClick={() => setCurrentPage(1)} className="w-7 h-7 text-[10px] rounded-lg bg-slate-800/50 hover:bg-slate-700">1</button>
                        {currentPage > 3 && <span className="text-slate-600 text-xs px-1">...</span>}
                      </>
                    )}
                    {[currentPage - 1, currentPage, currentPage + 1].filter(p => p > 0 && p <= totalPages).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 text-[10px] rounded-lg transition-all ${
                          page === currentPage 
                            ? 'bg-cyan-500 text-black font-bold' 
                            : 'bg-slate-800/50 hover:bg-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && <span className="text-slate-600 text-xs px-1">...</span>}
                        <button onClick={() => setCurrentPage(totalPages)} className="w-7 h-7 text-[10px] rounded-lg bg-slate-800/50 hover:bg-slate-700">{totalPages}</button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-slate-800/80 rounded-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {/* Random Section at Bottom */}
            <RandomCard 
              item={randomItem}
              onRandomize={handleRandomize}
              navigate={navigate}
              itemsAvailable={movies.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Movies;



