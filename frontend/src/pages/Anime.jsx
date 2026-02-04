import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================
// JIKAN API Configuration (MyAnimeList)
// DO NOT use TMDB for Japanese Anime
// TODO: Replace with backend API when backend is ready
// ============================================
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// ============================================
// BACKEND-SAFE: Anime Genres from Jikan
// ============================================
const ANIME_GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 7, name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Thriller' },
];

// ============================================
// Anime type filters
// ============================================
const ANIME_TYPES = [
  { id: 'all', name: 'All Anime' },
  { id: 'tv', name: 'TV Series' },
  { id: 'movie', name: 'Movies' },
  { id: 'ova', name: 'OVA' },
  { id: 'ona', name: 'ONA' },
];

// ============================================
// Random Card Component
// ============================================
const RandomCard = ({ item, onRandomize, navigate, itemsAvailable }) => {
  return (
    <div className="flex flex-col items-center py-10 border-t border-slate-800 mt-8">
      <h3 className="text-sm font-semibold text-slate-400 mb-4">🎲 Random Anime Pick</h3>
      
      {item ? (
        <div 
          onClick={() => navigate(`/details/anime/${item.mal_id}`)}
          className="w-40 cursor-pointer group"
        >
          <div className="relative rounded-xl overflow-hidden mb-3 shadow-lg">
            <img
              src={item.images?.jpg?.image_url || '/placeholder.jpg'}
              alt={item.title}
              className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-semibold text-sm truncate">{item.title}</p>
              <p className="text-slate-400 text-xs">★ {(item.score || 0).toFixed(1)}</p>
            </div>
            <div className="absolute top-2 right-2 bg-pink-500/90 px-1.5 py-0.5 rounded text-xs font-bold">
              🎌 {item.type || 'Anime'}
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
        className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-white disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
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
// Main Anime Component
// ============================================
const Anime = () => {
  const navigate = useNavigate();
  
  // State
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [randomItem, setRandomItem] = useState(null);
  const [error, setError] = useState(null);

  // ============================================
  // BACKEND-SAFE: Fetch anime from Jikan API
  // This logic can be replaced with backend endpoint later
  // ============================================
  useEffect(() => {
    const fetchAnime = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let url = `${JIKAN_BASE_URL}/anime?page=${currentPage}&limit=20&sfw=true`;
        
        // Search takes priority
        if (searchQuery.trim()) {
          url = `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=20&sfw=true`;
        } else {
          // Default to top anime if no search
          url = `${JIKAN_BASE_URL}/top/anime?page=${currentPage}&limit=20`;
        }
        
        // Add type filter
        if (selectedType !== 'all') {
          url += `&type=${selectedType}`;
        }
        
        // Add genre filter
        if (selectedGenre) {
          url += `&genres=${selectedGenre}`;
        }

        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error('Failed to fetch anime');
        }
        
        const data = await res.json();
        
        setAnimeList(data.data || []);
        setTotalPages(data.pagination?.last_visible_page || 1);
      } catch (err) {
        console.error('Failed to fetch anime:', err);
        setError('Failed to load anime. Please try again.');
        setAnimeList([]);
      } finally {
        setLoading(false);
      }
    };

    // Jikan API has rate limiting - add small delay
    const debounce = setTimeout(fetchAnime, 400);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedType, selectedGenre, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedGenre]);

  // ============================================
  // Random handler
  // ============================================
  const handleRandomize = () => {
    if (animeList.length === 0) return;
    const newItem = animeList[Math.floor(Math.random() * animeList.length)];
    setRandomItem(newItem);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedGenre(null);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#0b1121] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-1">🎌 Anime</h1>
          <p className="text-slate-400 text-sm">Discover Japanese anime series and movies</p>
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
                    placeholder="Search anime..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 pl-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Type</label>
                <div className="flex flex-col gap-1.5">
                  {ANIME_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                        selectedType === type.id 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Genre</label>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 max-h-56 overflow-y-auto">
                  <div className="flex flex-col gap-1.5">
                    {ANIME_GENRES.map(genre => (
                      <button
                        key={genre.id}
                        onClick={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                          selectedGenre === genre.id 
                            ? 'bg-pink-500 text-white' 
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
              {(searchQuery || selectedType !== 'all' || selectedGenre) && (
                <button 
                  onClick={clearFilters}
                  className="w-full text-sm text-pink-400 hover:text-pink-300 py-2"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Anime Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {(searchQuery || selectedType !== 'all' || selectedGenre) && (
              <div className="mb-4 text-sm text-slate-400">
                {searchQuery && <span>Results for "{searchQuery}"</span>}
                {selectedType !== 'all' && <span> • {ANIME_TYPES.find(t => t.id === selectedType)?.name}</span>}
                {selectedGenre && <span> • {ANIME_GENRES.find(g => g.id === selectedGenre)?.name}</span>}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-10 text-red-400">
                <p>{error}</p>
                <button onClick={clearFilters} className="mt-2 text-pink-400 text-sm">Try again</button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : animeList.length === 0 && !error ? (
              <div className="text-center py-20 text-slate-500">
                <p>No anime found</p>
                <button onClick={clearFilters} className="mt-2 text-pink-400 text-sm">Clear filters</button>
              </div>
            ) : !error && (
              <>
                {/* Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {animeList.map(anime => (
                    <div
                      key={anime.mal_id}
                      onClick={() => navigate(`/details/anime/${anime.mal_id}`)}
                      className="cursor-pointer group"
                    >
                      <div className="relative rounded-lg overflow-hidden mb-2">
                        <img
                          src={anime.images?.jpg?.image_url || '/placeholder.jpg'}
                          alt={anime.title}
                          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-xs font-bold">
                          ★ {(anime.score || 0).toFixed(1)}
                        </div>
                        <div className="absolute top-2 right-2 bg-pink-500/90 px-1.5 py-0.5 rounded text-xs font-bold">
                          {anime.type || 'Anime'}
                        </div>
                      </div>
                      <h3 className="font-medium text-sm truncate">{anime.title}</h3>
                      <p className="text-xs text-slate-500">{anime.aired?.prop?.from?.year || 'TBA'}</p>
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
              itemsAvailable={animeList.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Anime;
