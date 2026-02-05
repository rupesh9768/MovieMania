import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// TODO: Replace with backend API when backend is ready
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// ============================================
// BACKEND-SAFE: TV Genres list
// ============================================
const GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' }
];

// ============================================
// Random Card Component - NO daily limit
// ============================================
const RandomCard = ({ item, onRandomize, navigate, itemsAvailable }) => {
  return (
    <div className="flex flex-col items-center py-12 border-t border-slate-800 mt-10">
      <h3 className="text-sm font-semibold text-slate-400 mb-5">🎲 Random TV Show Pick</h3>
      
      {item ? (
        <div 
          onClick={() => navigate(`/details/tv/${item.id}`)}
          className="w-48 cursor-pointer group"
        >
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 shadow-xl border border-slate-800/50 group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/20 transition-all duration-300">
            <img
              src={item.poster_path ? `${IMG_BASE}${item.poster_path}` : '/placeholder.jpg'}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white font-bold text-sm truncate">{item.name}</p>
              <p className="text-yellow-400 text-xs mt-1">★ {(item.vote_average || 0).toFixed(1)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-48 aspect-[2/3] bg-slate-800/50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-700">
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

// ============================================
// Main TV Shows Component
// ============================================
const TVShows = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const genreFromState = location.state?.genreId;
  
  // State
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(genreFromState || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [randomItem, setRandomItem] = useState(null);

  // ============================================
  // BACKEND-SAFE: Fetch TV shows (can be replaced with backend endpoint)
  // ============================================
  useEffect(() => {
    const fetchShows = async () => {
      setLoading(true);
      try {
        let url = `${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${currentPage}`;
        
        // Search takes priority
        if (searchQuery.trim()) {
          url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
        } else if (selectedGenre) {
          url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${selectedGenre}&page=${currentPage}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        // Normalize response - UI consumes shows array
        setShows(data.results || []);
        setTotalPages(Math.min(data.total_pages || 1, 500)); // TMDB limits to 500
      } catch (err) {
        console.error('Failed to fetch TV shows:', err);
        setShows([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchShows, 300);
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
    if (shows.length === 0) return;
    const newItem = shows[Math.floor(Math.random() * shows.length)];
    setRandomItem(newItem);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre(null);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#0b1121] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-1">TV Shows</h1>
          <p className="text-slate-400 text-sm">Discover and explore TV series</p>
        </div>

        <div className="flex gap-6">
          {/* LEFT SIDEBAR: Search + Filters */}
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-20 space-y-5">
              {/* Search */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search TV shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 pl-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                </div>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Genres</label>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 max-h-72 overflow-y-auto">
                  <div className="flex flex-col gap-1.5">
                    {GENRES.map(genre => (
                      <button
                        key={genre.id}
                        onClick={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                          selectedGenre === genre.id 
                            ? 'bg-cyan-500 text-black' 
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
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
                  className="w-full text-sm text-cyan-400 hover:text-cyan-300 py-2"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: TV Shows Grid */}
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
            ) : shows.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <p>No TV shows found</p>
                <button onClick={clearFilters} className="mt-2 text-cyan-400 text-sm">Clear filters</button>
              </div>
            ) : (
              <>
                {/* Grid */}
                <div className="grid grid-cols-4 gap-5">
                  {shows.map(show => (
                    <div
                      key={show.id}
                      onClick={() => navigate(`/details/tv/${show.id}`)}
                      className="cursor-pointer group"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2.5 border border-slate-800/50 group-hover:border-cyan-500/50 shadow-lg shadow-black/20 group-hover:shadow-cyan-500/10 transition-all duration-300">
                        <img
                          src={show.poster_path ? `${IMG_BASE}${show.poster_path}` : '/placeholder.jpg'}
                          alt={show.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          <span className="text-yellow-400">★</span> {(show.vote_average || 0).toFixed(1)}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-xs text-cyan-400 font-medium">View Details →</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">{show.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{show.first_air_date?.slice(0, 4)}</p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-800 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    ← Previous
                  </button>
                  
                  <span className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-slate-800 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
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
              itemsAvailable={shows.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVShows;
