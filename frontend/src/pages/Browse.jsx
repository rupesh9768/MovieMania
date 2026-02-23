import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// Genre lists for filtering
const MOVIE_GENRES = [
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

const TV_GENRES = [
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

// Common countries for filtering
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'KR', name: 'South Korea' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'CN', name: 'China' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' }
];

const CONTENT_TYPES = [
  { id: 'all', name: 'All' },
  { id: 'movie', name: 'Movies' },
  { id: 'tv', name: 'TV Shows' }
];

const Browse = () => {
  const navigate = useNavigate();
  
  // State
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get genres based on content type
  const getGenres = () => {
    if (contentType === 'tv') return TV_GENRES;
    if (contentType === 'movie') return MOVIE_GENRES;
    // For 'all', show common genres
    return MOVIE_GENRES;
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let allResults = [];
        
        if (searchQuery.trim()) {
          // Search across both movies and TV
          if (contentType === 'all' || contentType === 'movie') {
            const movieUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
            const movieRes = await axios.get(movieUrl);
            const movies = (movieRes.data.results || []).map(m => ({ ...m, mediaType: 'movie' }));
            allResults = [...allResults, ...movies];
          }
          
          if (contentType === 'all' || contentType === 'tv') {
            const tvUrl = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
            const tvRes = await axios.get(tvUrl);
            const tvShows = (tvRes.data.results || []).map(t => ({ ...t, mediaType: 'tv' }));
            allResults = [...allResults, ...tvShows];
          }
          
          setTotalPages(1);
        } else {
          // Discover with filters
          const buildUrl = (type) => {
            let url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}&sort_by=popularity.desc&page=${currentPage}`;
            if (selectedGenre) url += `&with_genres=${selectedGenre}`;
            if (selectedCountry) url += `&with_origin_country=${selectedCountry}`;
            return url;
          };
          
          if (contentType === 'all') {
            // Fetch both movies and TV
            const [movieRes, tvRes] = await Promise.all([
              axios.get(buildUrl('movie')),
              axios.get(buildUrl('tv'))
            ]);
            
            const movies = (movieRes.data.results || []).map(m => ({ ...m, mediaType: 'movie' }));
            const tvShows = (tvRes.data.results || []).map(t => ({ ...t, mediaType: 'tv' }));
            
            // Interleave results for variety
            const maxLen = Math.max(movies.length, tvShows.length);
            for (let i = 0; i < maxLen; i++) {
              if (movies[i]) allResults.push(movies[i]);
              if (tvShows[i]) allResults.push(tvShows[i]);
            }
            
            setTotalPages(Math.min(Math.max(movieRes.data.total_pages, tvRes.data.total_pages), 20));
          } else if (contentType === 'movie') {
            const res = await axios.get(buildUrl('movie'));
            allResults = (res.data.results || []).map(m => ({ ...m, mediaType: 'movie' }));
            setTotalPages(Math.min(res.data.total_pages || 1, 20));
          } else if (contentType === 'tv') {
            const res = await axios.get(buildUrl('tv'));
            allResults = (res.data.results || []).map(t => ({ ...t, mediaType: 'tv' }));
            setTotalPages(Math.min(res.data.total_pages || 1, 20));
          }
        }
        
        // Normalize data
        const normalized = allResults.map(item => ({
          id: item.id,
          title: item.title || item.name,
          rating: item.vote_average || 0,
          image: item.poster_path ? `${IMG_BASE}${item.poster_path}` : null,
          year: (item.release_date || item.first_air_date || '').slice(0, 4),
          mediaType: item.mediaType,
          overview: item.overview
        }));
        
        setContent(normalized);
        console.log(`Browse: Loaded ${normalized.length} items`);
      } catch (err) {
        console.error('Failed to fetch content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(fetchContent, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, contentType, selectedGenre, selectedCountry, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, contentType, selectedGenre, selectedCountry]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre(null);
    setSelectedCountry(null);
    setCurrentPage(1);
  };

  const hasFilters = searchQuery || selectedGenre || selectedCountry;

  if (loading && content.length === 0) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-cyan-400 font-bold text-xl">M</span>
          </div>
          <p className="text-slate-400">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4 text-red-400 font-bold">!</div>
          <h2 className="text-lg font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-5">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Hero Section */}
      <div className="relative bg-linear-to-b from-cyan-900/20 via-slate-900/10 to-transparent py-8 mb-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-black mb-2">
              Browse <span className="text-cyan-400">All</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Discover movies and TV shows from around the world
            </p>
          </div>
          
          {/* Search Bar - Prominent */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search movies & TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-5 py-3.5 pl-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800 transition-all shadow-lg"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-sm"
                >
                  X
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex gap-6">
          {/* LEFT SIDEBAR: Filters */}
          <div className="w-56 shrink-0">
            <div className="sticky top-20 space-y-5">
              {/* Content Type Tabs */}
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Content Type</label>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-1.5 flex gap-1">
                  {CONTENT_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setContentType(type.id)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                        contentType === type.id
                          ? 'bg-cyan-500 text-black shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span className="hidden sm:inline">{type.name}</span>
                      <span className="sm:hidden">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  Genres {selectedGenre && <span className="text-cyan-400">• 1 selected</span>}
                </label>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2.5 max-h-56 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <div className="flex flex-wrap gap-1.5">
                    {getGenres().map(genre => (
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

              {/* Country Filter */}
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  Country {selectedCountry && <span className="text-cyan-400">• 1 selected</span>}
                </label>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <div className="space-y-1">
                    {COUNTRIES.map(country => (
                      <button
                        key={country.code}
                        onClick={() => setSelectedCountry(selectedCountry === country.code ? null : country.code)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                          selectedCountry === country.code 
                            ? 'bg-cyan-500 text-black' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {country.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {hasFilters && (
                <button 
                  onClick={clearFilters}
                  className="w-full text-xs text-slate-400 hover:text-cyan-400 py-2.5 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-all"
                >
                  Clear all filters
                </button>
              )}

              {/* Quick Links */}
              <div className="pt-4 border-t border-slate-800">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Explore More</label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => navigate('/movies')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
                  >
                    Movie Library
                  </button>
                  <button
                    onClick={() => navigate('/tvshows')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
                  >
                    TV Shows
                  </button>
                  <button
                    onClick={() => navigate('/animations')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
                  >
                    Animations
                  </button>
                  <button
                    onClick={() => navigate('/anime')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
                  >
                    Anime
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Content Grid */}
          <div className="flex-1">
            {/* Active Filters Info */}
            {hasFilters && (
              <div className="mb-4 flex items-center gap-3 text-sm">
                <span className="text-slate-500">Filters:</span>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <span className="bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
                      "{searchQuery}"
                    </span>
                  )}
                  {selectedGenre && (
                    <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs">
                      {getGenres().find(g => g.id === selectedGenre)?.name}
                    </span>
                  )}
                  {selectedCountry && (
                    <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs">
                      {COUNTRIES.find(c => c.code === selectedCountry)?.name}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-slate-500 text-sm">
                {loading ? 'Loading...' : `${content.length} results found`}
              </span>
            </div>

            {/* Loading Overlay */}
            {loading && content.length > 0 && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div className="bg-slate-900 rounded-xl p-6 shadow-xl">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && content.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                <span className="text-sm text-slate-500 block mb-3">No results found</span>
                <p className="text-slate-400 font-medium">No results found</p>
                <p className="text-slate-600 text-sm mt-1">Try adjusting your search or filters</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-4 text-cyan-400 text-sm hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Content Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {content.map((item, index) => (
                    <div
                      key={`${item.mediaType}-${item.id}-${index}`}
                      onClick={() => navigate(`/details/${item.mediaType}/${item.id}`)}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-2 border border-slate-800/50 group-hover:border-cyan-500/50 shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Image'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <span className="text-sm text-slate-600 font-medium">{item.mediaType === 'movie' ? 'Movie' : 'TV'}</span>
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        
                        {/* Media Type Badge */}
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-sm ${
                          item.mediaType === 'movie' 
                            ? 'bg-cyan-500/90 text-black' 
                            : 'bg-cyan-600/90 text-white'
                        }`}>
                          {item.mediaType === 'movie' ? 'Movie' : 'TV'}
                        </div>
                        
                        {/* Rating Badge */}
                        {item.rating > 0 && (
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <span className="text-yellow-400">★</span> 
                            {item.rating.toFixed(1)}
                          </div>
                        )}
                        
                        {/* Bottom Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white font-semibold text-sm truncate">{item.title}</p>
                          {item.year && <p className="text-slate-400 text-xs">{item.year}</p>}
                        </div>
                        
                        {/* Hover Text */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-white">
                            View Details
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
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
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                              currentPage === pageNum
                                ? 'bg-cyan-500 text-black'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
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
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;



