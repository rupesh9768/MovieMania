import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// TODO: Replace with backend API when backend is ready
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// ============================================
// BACKEND-SAFE: Genres list (can be fetched from backend later)
// ============================================
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

// ============================================
// Random Card Component - NO daily limit
// ============================================
const RandomCard = ({ item, onRandomize, navigate, itemsAvailable }) => {
  return (
    <div className="flex flex-col items-center py-10 border-t border-slate-800 mt-8">
      <h3 className="text-sm font-semibold text-slate-400 mb-4">🎲 Random Movie Pick</h3>
      
      {item ? (
        <div 
          onClick={() => navigate(`/details/movie/${item.id}`)}
          className="w-40 cursor-pointer group"
        >
          <div className="relative rounded-xl overflow-hidden mb-3 shadow-lg">
            <img
              src={item.poster_path ? `${IMG_BASE}${item.poster_path}` : '/placeholder.jpg'}
              alt={item.title}
              className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-semibold text-sm truncate">{item.title}</p>
              <p className="text-slate-400 text-xs">★ {(item.vote_average || 0).toFixed(1)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-40 h-56 bg-slate-800/50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-700">
          <p className="text-slate-500 text-xs text-center px-3">Click to get random!</p>
        </div>
      )}

      <button
        onClick={onRandomize}
        disabled={!itemsAvailable}
        className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {item ? 'Get Another' : 'Get Random'}
      </button>
    </div>
  );
};

// ============================================
// Main Movies Component
// ============================================
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

  // ============================================
  // BACKEND-SAFE: Fetch movies (can be replaced with backend endpoint)
  // ============================================
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${currentPage}`;
        
        // Search takes priority
        if (searchQuery.trim()) {
          url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
        } else if (selectedGenre) {
          url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}&page=${currentPage}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        // Normalize response - UI consumes movies array
        setMovies(data.results || []);
        setTotalPages(Math.min(data.total_pages || 1, 500)); // TMDB limits to 500
      } catch (err) {
        console.error('Failed to fetch movies:', err);
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

  // ============================================
  // Random handler - NO daily limit
  // ============================================
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
    <div className="min-h-screen bg-[#0b1121] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-black mb-1">Movies</h1>
          <p className="text-slate-500 text-xs">Discover and explore movies from around the world</p>
        </div>

        <div className="flex gap-6">
          {/* LEFT SIDEBAR: Search + Filters */}
          <div className="w-52 flex-shrink-0">
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
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
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
                  ✕ Clear filters
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
              <div className="text-center py-20 text-slate-500">
                <p>No movies found</p>
                <button onClick={clearFilters} className="mt-2 text-cyan-400 text-sm">Clear filters</button>
              </div>
            ) : (
              <>
                {/* Grid */}
                <div className="grid grid-cols-4 gap-3">
                  {movies.map(movie => (
                    <div
                      key={movie.id}
                      onClick={() => navigate(`/details/movie/${movie.id}`)}
                      className="cursor-pointer group"
                    >
                      <div className="relative rounded-lg overflow-hidden mb-1.5 border border-slate-800 group-hover:border-cyan-500/40 transition-all">
                        <img
                          src={movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : '/placeholder.jpg'}
                          alt={movie.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          <span className="text-yellow-400">★</span> {(movie.vote_average || 0).toFixed(1)}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-cyan-400 font-medium">View Details →</span>
                        </div>
                      </div>
                      <h3 className="font-medium text-xs truncate group-hover:text-cyan-400 transition-colors">{movie.title}</h3>
                      <p className="text-[10px] text-slate-500">{movie.release_date?.slice(0, 4)}</p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-3 mt-6 pt-6 border-t border-slate-800/50">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-slate-800/80 rounded-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    ← Prev
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
                    Next →
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
