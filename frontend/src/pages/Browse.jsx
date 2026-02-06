import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendApi } from '../api';

// ============================================
// BROWSE PAGE
// Uses ONLY backend API - No mock data
// ============================================
const Browse = () => {
  const navigate = useNavigate();
  
  // State
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // ============================================
  // Fetch movies from backend
  // ============================================
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const movies = await backendApi.getBackendMovies();
        console.log('✅ Browse: Fetched movies:', movies.length);
        setAllMovies(movies);
      } catch (err) {
        console.error('❌ Failed to fetch movies:', err);
        setError('Failed to load movies. Please check if backend is running.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovies();
  }, []);

  // ============================================
  // Derive unique countries and genres from movies
  // ============================================
  const countries = useMemo(() => {
    const unique = [...new Set(allMovies.map(m => m.country).filter(Boolean))];
    return unique.sort();
  }, [allMovies]);

  const genres = useMemo(() => {
    const allGenres = allMovies.flatMap(m => m.genres || []);
    const unique = [...new Set(allGenres.filter(Boolean))];
    return unique.sort();
  }, [allMovies]);

  // ============================================
  // Filter movies (client-side)
  // TODO: Move to backend when API supports filtering
  // ============================================
  const filteredMovies = useMemo(() => {
    let result = [...allMovies];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.title?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
      );
    }

    // Country filter
    if (selectedCountry !== 'all') {
      result = result.filter(m => m.country === selectedCountry);
    }

    // Genre filter
    if (selectedGenre !== 'all') {
      result = result.filter(m => 
        m.genres?.some(g => g.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    return result;
  }, [allMovies, searchQuery, selectedCountry, selectedGenre]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountry, selectedGenre]);

  // ============================================
  // Pagination
  // ============================================
  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMovies = filteredMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedGenre('all');
  };

  const hasActiveFilters = searchQuery || selectedCountry !== 'all' || selectedGenre !== 'all';

  // ============================================
  // Loading state
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading movies...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Error state
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-6 rounded-full transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Browse Movies</h1>
          <p className="text-slate-400">
            {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''} found
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ========== LEFT SIDEBAR ========== */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6 bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                  Country
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCountry('all')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                      selectedCountry === 'all'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                    }`}
                  >
                    All Countries
                  </button>
                  {countries.map(country => (
                    <button
                      key={country}
                      onClick={() => setSelectedCountry(country)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                        selectedCountry === country
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                  Genre
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedGenre('all')}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                      selectedGenre === 'all'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-white border border-slate-700'
                    }`}
                  >
                    All
                  </button>
                  {genres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                        selectedGenre === genre
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                          : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-white border border-slate-700'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2.5 text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer border border-red-500/30 rounded-lg hover:bg-red-500/10"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* ========== MAIN CONTENT ========== */}
          <main className="flex-1">
            {paginatedMovies.length > 0 ? (
              <>
                {/* Movie Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {paginatedMovies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => navigate(`/details/movie/${movie.id}`)}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 border-2 border-slate-800 group-hover:border-cyan-500/50 shadow-lg transition-all duration-300">
                        <img
                          src={movie.poster || movie.image}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Image'; }}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Country Badge */}
                        {movie.country && (
                          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold">
                            {movie.country === 'Nepal' ? '🇳🇵 NP' : 
                             movie.country === 'India' ? '🇮🇳 IN' : 
                             movie.country === 'USA' ? '🇺🇸 US' : movie.country}
                          </div>
                        )}
                        
                        {/* Rating */}
                        {movie.rating > 0 && (
                          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            <span className="text-yellow-400">★</span> {movie.rating.toFixed(1)}
                          </div>
                        )}
                        
                        {/* View Details on hover */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-sm text-cyan-400 font-semibold">View Details →</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">
                        {movie.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{movie.year}</p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-12">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      ← Previous
                    </button>
                    
                    <div className="flex gap-1.5">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                              currentPage === pageNum
                                ? 'bg-cyan-500 text-black'
                                : 'bg-slate-800 hover:bg-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                <span className="text-5xl mb-4 block">🔍</span>
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Movies Found</h3>
                <p className="text-slate-500 mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Browse;



