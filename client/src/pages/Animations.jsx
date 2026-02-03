import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Animation genre ID
const ANIMATION_GENRE_ID = 16;

// ============================================
// BACKEND-SAFE: Categories and sub-genres
// ============================================
const CATEGORIES = [
  { id: 'all', name: 'All Animations' },
  { id: 'movie', name: 'Animated Movies' },
  { id: 'tv', name: 'Animated Series' },
];

const SUB_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 878, name: 'Sci-Fi' },
  { id: 18, name: 'Drama' },
  { id: 10749, name: 'Romance' },
];

// ============================================
// Random Card Component - NO daily limit
// ============================================
const RandomCard = ({ item, onRandomize, navigate, itemsAvailable }) => {
  const isMovie = item?.title !== undefined;
  const title = isMovie ? item?.title : item?.name;
  const link = isMovie ? `/movie/${item?.id}` : `/tv/${item?.id}`;
  
  return (
    <div className="flex flex-col items-center py-10 border-t border-slate-800 mt-8">
      <h3 className="text-sm font-semibold text-slate-400 mb-4">🎲 Random Animation Pick</h3>
      
      {item ? (
        <div 
          onClick={() => navigate(link)}
          className="w-40 cursor-pointer group"
        >
          <div className="relative rounded-xl overflow-hidden mb-3 shadow-lg">
            <img
              src={item.poster_path ? `${IMG_BASE}${item.poster_path}` : '/placeholder.jpg'}
              alt={title}
              className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-semibold text-sm truncate">{title}</p>
              <p className="text-slate-400 text-xs">★ {(item.vote_average || 0).toFixed(1)}</p>
            </div>
            <div className="absolute top-2 right-2 bg-purple-500/90 px-1.5 py-0.5 rounded text-xs font-bold">
              {isMovie ? '🎬' : '📺'}
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
        className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
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
// Main Animations Component
// ============================================
const Animations = () => {
  const navigate = useNavigate();
  
  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubGenre, setSelectedSubGenre] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [randomItem, setRandomItem] = useState(null);

  // ============================================
  // BACKEND-SAFE: Fetch animations (can be replaced with backend endpoint)
  // ============================================
  useEffect(() => {
    const fetchAnimations = async () => {
      setLoading(true);
      try {
        let results = [];
        let pages = 1;
        
        // Search takes priority
        if (searchQuery.trim()) {
          // Search both movies and TV for animation content
          if (selectedCategory === 'all' || selectedCategory === 'movie') {
            const movieRes = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`);
            const movieData = await movieRes.json();
            const animatedMovies = (movieData.results || [])
              .filter(m => m.genre_ids?.includes(ANIMATION_GENRE_ID))
              .map(m => ({ ...m, media_type: 'movie' }));
            results = [...results, ...animatedMovies];
            pages = Math.max(pages, movieData.total_pages || 1);
          }
          
          if (selectedCategory === 'all' || selectedCategory === 'tv') {
            const tvRes = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`);
            const tvData = await tvRes.json();
            const animatedTV = (tvData.results || [])
              .filter(t => t.genre_ids?.includes(ANIMATION_GENRE_ID))
              .map(t => ({ ...t, media_type: 'tv' }));
            results = [...results, ...animatedTV];
            pages = Math.max(pages, tvData.total_pages || 1);
          }
        } else {
          // Discover animations by genre
          const genreQuery = selectedSubGenre 
            ? `${ANIMATION_GENRE_ID},${selectedSubGenre}` 
            : ANIMATION_GENRE_ID;
          
          if (selectedCategory === 'all' || selectedCategory === 'movie') {
            const movieRes = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreQuery}&page=${currentPage}&sort_by=popularity.desc`);
            const movieData = await movieRes.json();
            const movies = (movieData.results || []).map(m => ({ ...m, media_type: 'movie' }));
            results = [...results, ...movies];
            pages = Math.max(pages, movieData.total_pages || 1);
          }
          
          if (selectedCategory === 'all' || selectedCategory === 'tv') {
            const tvRes = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreQuery}&page=${currentPage}&sort_by=popularity.desc`);
            const tvData = await tvRes.json();
            const tvShows = (tvData.results || []).map(t => ({ ...t, media_type: 'tv' }));
            results = [...results, ...tvShows];
            pages = Math.max(pages, tvData.total_pages || 1);
          }
        }
        
        // Sort by popularity and deduplicate
        results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        
        setItems(results);
        setTotalPages(Math.min(pages, 500));
      } catch (err) {
        console.error('Failed to fetch animations:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchAnimations, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedCategory, selectedSubGenre, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSubGenre]);

  // ============================================
  // Random handler - NO daily limit
  // ============================================
  const handleRandomize = () => {
    if (items.length === 0) return;
    const newItem = items[Math.floor(Math.random() * items.length)];
    setRandomItem(newItem);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubGenre(null);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#0b1121] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-1">✨ Animations</h1>
          <p className="text-slate-400 text-sm">Discover animated movies and series</p>
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
                    placeholder="Search animations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 pl-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                </div>
              </div>

              {/* Category Filter (Movies vs TV) */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Category</label>
                <div className="flex flex-col gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                        selectedCategory === cat.id 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Genre Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Sub-Genre</label>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 max-h-56 overflow-y-auto">
                  <div className="flex flex-col gap-1.5">
                    {SUB_GENRES.map(genre => (
                      <button
                        key={genre.id}
                        onClick={() => setSelectedSubGenre(selectedSubGenre === genre.id ? null : genre.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                          selectedSubGenre === genre.id 
                            ? 'bg-purple-500 text-white' 
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
              {(searchQuery || selectedCategory !== 'all' || selectedSubGenre) && (
                <button 
                  onClick={clearFilters}
                  className="w-full text-sm text-purple-400 hover:text-purple-300 py-2"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Animations Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {(searchQuery || selectedCategory !== 'all' || selectedSubGenre) && (
              <div className="mb-4 text-sm text-slate-400">
                {searchQuery && <span>Results for "{searchQuery}"</span>}
                {selectedCategory !== 'all' && <span> • {CATEGORIES.find(c => c.id === selectedCategory)?.name}</span>}
                {selectedSubGenre && <span> • {SUB_GENRES.find(g => g.id === selectedSubGenre)?.name}</span>}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <p>No animations found</p>
                <button onClick={clearFilters} className="mt-2 text-purple-400 text-sm">Clear filters</button>
              </div>
            ) : (
              <>
                {/* Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {items.map(item => {
                    const isMovie = item.media_type === 'movie' || item.title !== undefined;
                    const title = isMovie ? item.title : item.name;
                    const year = isMovie ? item.release_date?.slice(0, 4) : item.first_air_date?.slice(0, 4);
                    const link = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`;
                    
                    return (
                      <div
                        key={`${item.media_type || 'item'}-${item.id}`}
                        onClick={() => navigate(link)}
                        className="cursor-pointer group"
                      >
                        <div className="relative rounded-lg overflow-hidden mb-2">
                          <img
                            src={item.poster_path ? `${IMG_BASE}${item.poster_path}` : '/placeholder.jpg'}
                            alt={title}
                            className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-xs font-bold">
                            ★ {(item.vote_average || 0).toFixed(1)}
                          </div>
                          <div className="absolute top-2 right-2 bg-purple-500/90 px-1.5 py-0.5 rounded text-xs font-bold">
                            {isMovie ? '🎬' : '📺'}
                          </div>
                        </div>
                        <h3 className="font-medium text-sm truncate">{title}</h3>
                        <p className="text-xs text-slate-500">{year}</p>
                      </div>
                    );
                  })}
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
              itemsAvailable={items.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Animations;
