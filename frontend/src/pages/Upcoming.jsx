import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUpcomingBigMovies, getGenres } from '../api/movieService';

// ============================================
// UPCOMING MOVIES PAGE
// Features: Big Hollywood, Bollywood & Nepali Movies
// Scrollable single page with language filters
// ============================================

const Upcoming = () => {
  const navigate = useNavigate();
  
  // State
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(30); // Show 30 initially
  const [selectedLanguage, setSelectedLanguage] = useState('all'); // all, English, Hindi, Nepali
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, thisMonth, nextMonth, interested
  const [sortBy, setSortBy] = useState('popularity'); // popularity, date, title
  
  // Interested movies (localStorage)
  const [interestedMovies, setInterestedMovies] = useState(() => {
    try {
      const saved = localStorage.getItem('interestedUpcoming');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current time for countdown (update every minute)
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ============================================
  // Fetch movies and genres
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [upcomingMovies, genreData] = await Promise.all([
          getUpcomingBigMovies(12), // Look 12 months ahead
          getGenres()
        ]);
        
        console.log('✅ Upcoming: Fetched', upcomingMovies.length, 'big movies');
        
        setMovies(upcomingMovies);
        setGenres(genreData);
      } catch (err) {
        console.error('❌ Failed to fetch upcoming movies:', err);
        setError('Failed to load upcoming movies. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // ============================================
  // Filter & Sort Movies
  // ============================================
  const filteredMovies = useMemo(() => {
    let filtered = [...movies];
    const today = new Date();
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    // Language filter
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(m => m.language === selectedLanguage);
    }
    
    // Time filter
    if (selectedFilter === 'thisMonth') {
      filtered = filtered.filter(m => {
        const releaseDate = new Date(m.releaseDate);
        return releaseDate <= thisMonthEnd;
      });
    } else if (selectedFilter === 'nextMonth') {
      filtered = filtered.filter(m => {
        const releaseDate = new Date(m.releaseDate);
        return releaseDate > thisMonthEnd && releaseDate <= nextMonthEnd;
      });
    } else if (selectedFilter === 'interested') {
      filtered = filtered.filter(m => interestedMovies.includes(m.id));
    }
    
    // Sort
    if (sortBy === 'popularity') {
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return filtered;
  }, [movies, selectedLanguage, selectedFilter, sortBy, interestedMovies]);

  // Movies to display (for load more)
  const displayedMovies = filteredMovies.slice(0, displayCount);
  const hasMore = displayCount < filteredMovies.length;

  // Language counts
  const languageCounts = useMemo(() => {
    const counts = { all: movies.length, English: 0, Hindi: 0, Nepali: 0 };
    movies.forEach(m => {
      if (m.language && counts[m.language] !== undefined) {
        counts[m.language]++;
      }
    });
    return counts;
  }, [movies]);

  // ============================================
  // Helper Functions
  // ============================================
  const toggleInterested = (movieId) => {
    setInterestedMovies(prev => {
      const isCurrentlyInterested = prev.includes(movieId);
      const updated = isCurrentlyInterested 
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId];
      
      localStorage.setItem('interestedUpcoming', JSON.stringify(updated));
      return updated;
    });
  };

  const isInterested = (movieId) => interestedMovies.includes(movieId);

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCountdown = (dateString) => {
    if (!dateString) return null;
    const releaseDate = new Date(dateString);
    const diffTime = releaseDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Released!', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (diffDays === 0) return { text: 'TODAY!', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (diffDays === 1) return { text: 'Tomorrow!', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    if (diffDays <= 7) return { text: `${diffDays}d left`, color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
    if (diffDays <= 30) return { text: `${diffDays}d`, color: 'text-purple-400', bg: 'bg-purple-500/20' };
    if (diffDays <= 60) return { text: `${Math.ceil(diffDays / 7)}w`, color: 'text-slate-400', bg: 'bg-slate-500/20' };
    return { text: `${Math.ceil(diffDays / 30)}mo`, color: 'text-slate-500', bg: 'bg-slate-600/20' };
  };

  const getLanguageBadge = (language) => {
    switch(language) {
      case 'English': return { color: 'bg-blue-500', icon: '🇺🇸' };
      case 'Hindi': return { color: 'bg-orange-500', icon: '🇮🇳' };
      case 'Nepali': return { color: 'bg-red-500', icon: '🇳🇵' };
      default: return { color: 'bg-slate-500', icon: '🌐' };
    }
  };

  const getGenreName = (genreId) => {
    const genre = genres.find(g => g.id === genreId);
    return genre?.name || '';
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-4xl">🎬</span>
          </div>
          <p className="text-slate-400 text-lg">Loading upcoming blockbusters...</p>
          <p className="text-slate-600 text-sm mt-2">Hollywood • Bollywood • Nepali</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Error State
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Oops!</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-8 rounded-full transition-all cursor-pointer"
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
      <div className="relative bg-linear-to-b from-purple-900/40 via-purple-900/10 to-transparent py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🗓️</span>
                <h1 className="text-4xl md:text-5xl font-black">
                  Upcoming <span className="text-purple-400">Blockbusters</span>
                </h1>
              </div>
              <p className="text-slate-400 text-lg flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">🇺🇸 Hollywood</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">🇮🇳 Bollywood</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">🇳🇵 Nepali</span>
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex gap-5">
              <div className="text-center px-4 py-2 bg-slate-800/50 rounded-xl">
                <p className="text-2xl font-black text-white">{movies.length}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Movies</p>
              </div>
              <div className="text-center px-4 py-2 bg-pink-500/10 rounded-xl border border-pink-500/30">
                <p className="text-2xl font-black text-pink-400">{interestedMovies.length}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Watchlist</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Language Filter Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { key: 'all', label: 'All Movies', icon: '🎬' },
            { key: 'English', label: 'Hollywood', icon: '🇺🇸' },
            { key: 'Hindi', label: 'Bollywood', icon: '🇮🇳' },
            { key: 'Nepali', label: 'Nepali', icon: '🇳🇵' },
          ].map(lang => (
            <button
              key={lang.key}
              onClick={() => { setSelectedLanguage(lang.key); setDisplayCount(30); }}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                selectedLanguage === lang.key
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{lang.icon}</span>
              {lang.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedLanguage === lang.key ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                {languageCounts[lang.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          {/* Time Filters */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'thisMonth', label: 'This Month' },
              { key: 'nextMonth', label: 'Next Month' },
              { key: 'interested', label: '❤️ Watchlist' },
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => { setSelectedFilter(filter.key); setDisplayCount(30); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  selectedFilter === filter.key
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <div className="flex-1"></div>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="popularity">🔥 Most Popular</option>
              <option value="date">📅 Release Date</option>
              <option value="title">🔤 Title A-Z</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-slate-500 text-sm mb-6">
          Showing {displayedMovies.length} of {filteredMovies.length} movies
        </p>

        {/* Movies Grid - Single Scrollable Page */}
        {displayedMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {displayedMovies.map((movie) => {
                const countdown = getCountdown(movie.releaseDate);
                const langBadge = getLanguageBadge(movie.language);
                
                return (
                  <div key={movie.id} className="group">
                    {/* Card */}
                    <div 
                      className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 border-2 border-slate-800 group-hover:border-purple-500/50 shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/details/movie/${movie.id}`)}
                    >
                      {movie.image ? (
                        <img
                          src={movie.image}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => { 
                            e.target.src = 'https://via.placeholder.com/300x450?text=Coming+Soon'; 
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-purple-900/50 to-slate-900 flex items-center justify-center">
                          <span className="text-5xl opacity-50">🎬</span>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent"></div>
                      
                      {/* Top Row: Language + Interest */}
                      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                        {/* Language Badge */}
                        <div className={`${langBadge.color} px-2 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1`}>
                          <span>{langBadge.icon}</span>
                          <span className="hidden sm:inline">{movie.language}</span>
                        </div>
                        
                        {/* Interest Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleInterested(movie.id);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isInterested(movie.id)
                              ? 'bg-pink-500 text-white scale-110'
                              : 'bg-black/60 text-slate-400 hover:bg-pink-500/80 hover:text-white hover:scale-110'
                          }`}
                        >
                          {isInterested(movie.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      
                      {/* Countdown Badge (bottom left) */}
                      {countdown && (
                        <div className={`absolute bottom-12 left-2 ${countdown.bg} backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold ${countdown.color}`}>
                          {countdown.text}
                        </div>
                      )}
                      
                      {/* Bottom Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white font-bold text-sm truncate">{movie.title}</p>
                        <p className="text-purple-300 text-xs">{formatDate(movie.releaseDate)}</p>
                      </div>
                    </div>
                    
                    {/* Title below card */}
                    <h3 
                      className="font-semibold text-sm truncate group-hover:text-purple-400 transition-colors cursor-pointer"
                      onClick={() => navigate(`/details/movie/${movie.id}`)}
                    >
                      {movie.title}
                    </h3>
                    {movie.genre_ids && movie.genre_ids.length > 0 && (
                      <p className="text-slate-600 text-xs truncate mt-1">
                        {movie.genre_ids.slice(0, 2).map(getGenreName).filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={loadMore}
                  className="px-8 py-4 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                >
                  Load More Movies ({filteredMovies.length - displayCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700">
            <span className="text-6xl mb-6 block">🔍</span>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No Movies Found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your filters</p>
            <button 
              onClick={() => {
                setSelectedLanguage('all');
                setSelectedFilter('all');
              }}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-full transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Watchlist Summary */}
        {interestedMovies.length > 0 && selectedFilter !== 'interested' && (
          <div className="mt-12 p-5 bg-linear-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 border border-pink-500/30 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">❤️</span>
                </div>
                <div>
                  <p className="text-white font-bold">
                    {interestedMovies.length} movie{interestedMovies.length > 1 ? 's' : ''} in your watchlist
                  </p>
                  <p className="text-slate-400 text-sm">Don't miss these upcoming releases!</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFilter('interested')}
                className="px-5 py-2.5 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                View Watchlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upcoming;



