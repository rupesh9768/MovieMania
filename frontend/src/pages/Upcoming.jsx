import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUpcomingBigMovies, getGenres } from '../api/movieService';
import { getUpcomingMovies as getBackendUpcoming, toggleMovieInterest, toggleTmdbMovieInterest } from '../api/backendService';
import { useAuth } from '../context/AuthContext';

const Upcoming = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // State
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(30); // Show 30 initially
  const [selectedLanguage, setSelectedLanguage] = useState('all'); // all, English, Hindi, Nepali
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, thisMonth, nextMonth, interested
  const [sortBy, setSortBy] = useState('interest'); // interest, popularity, date, title
  
  // Interested movies - backend movie IDs user is interested in
  const [interestedMovies, setInterestedMovies] = useState([]);

  // Current time for countdown (update every minute)
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [upcomingMovies, genreData, backendUpcoming] = await Promise.all([
          getUpcomingBigMovies(12),
          getGenres(),
          getBackendUpcoming()
        ]);
        
        // Merge backend upcoming movies on top (they have interest data)
        // Deduplicate by title to avoid showing same movie from both sources
        const backendTitles = new Set(backendUpcoming.map(m => m.title?.toLowerCase()));
        const filteredTmdb = upcomingMovies.filter(m => !backendTitles.has(m.title?.toLowerCase()));
        const merged = [...backendUpcoming, ...filteredTmdb];
        
        setMovies(merged);
        setGenres(genreData);
        
        // Build interested list from backend movies the current user has marked
        if (user) {
          const userId = user._id || user.id;
          const interested = backendUpcoming
            .filter(m => m.interestedUsers?.some(uid => uid.toString() === userId?.toString()))
            .map(m => m.id);
          setInterestedMovies(interested);
        }
      } catch (err) {
        console.error('Failed to fetch upcoming movies:', err);
        setError('Failed to load upcoming movies. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

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
    if (sortBy === 'interest') {
      filtered.sort((a, b) => (b.interestedCount || 0) - (a.interestedCount || 0) || (b.popularity || 0) - (a.popularity || 0));
    } else if (sortBy === 'popularity') {
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

  const toggleInterested = async (movie) => {
    if (!isAuthenticated) {
      alert('Please login to mark interest');
      navigate('/login');
      return;
    }
    
    try {
      let result;
      if (movie.isBackend) {
        result = await toggleMovieInterest(movie.id);
      } else {
        // TMDB movie — auto-create in DB via tmdb-interest endpoint
        result = await toggleTmdbMovieInterest({
          tmdbId: movie.id,
          title: movie.title,
          poster: movie.poster || movie.image,
          backdrop: movie.backdrop,
          releaseDate: movie.releaseDate,
          language: movie.language || movie.original_language
        });
      }

      const movieKey = movie.isBackend ? movie.id : (result.movieId || movie.id);
      
      setInterestedMovies(prev => {
        if (result.interested) {
          return [...prev, movieKey];
        }
        return prev.filter(mid => mid !== movieKey);
      });
      
      // Update the movie's interestedCount and mark as backend in local state
      setMovies(prev => prev.map(m => 
        m.id === movie.id 
          ? { ...m, interestedCount: result.interestedCount, isBackend: true, id: result.movieId || m.id }
          : m
      ));
    } catch (error) {
      console.error('Interest toggle error:', error);
    }
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
    if (diffDays === 1) return { text: 'Tomorrow!', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (diffDays <= 7) return { text: `${diffDays}d left`, color: 'text-red-400', bg: 'bg-red-500/20' };
    if (diffDays <= 30) return { text: `${diffDays}d`, color: 'text-red-400', bg: 'bg-red-500/20' };
    if (diffDays <= 60) return { text: `${Math.ceil(diffDays / 7)}w`, color: 'text-slate-400', bg: 'bg-slate-500/20' };
    return { text: `${Math.ceil(diffDays / 30)}mo`, color: 'text-slate-500', bg: 'bg-slate-600/20' };
  };

  const getLanguageBadge = (language) => {
    switch(language) {
      case 'English': return { color: 'bg-blue-500' };
      case 'Hindi': return { color: 'bg-amber-500' };
      case 'Nepali': return { color: 'bg-red-500' };
      default: return { color: 'bg-slate-500' };
    }
  };

  const getGenreName = (genreId) => {
    const genre = genres.find(g => g.id === genreId);
    return genre?.name || '';
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-red-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm">Loading upcoming movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4 text-red-400 font-bold">!</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Oops!</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero Section */}
      <div className="relative bg-linear-to-b from-red-900/30 via-red-900/10 to-transparent py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-black">
                  Upcoming <span className="text-red-500">Movies</span>
                </h1>
              </div>
              <p className="text-slate-400 text-lg flex items-center gap-3 flex-wrap">
                <span>Hollywood</span>
                <span className="text-slate-600">|</span>
                <span>Bollywood</span>
                <span className="text-slate-600">|</span>
                <span>Nepali</span>
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex gap-5">
              <div className="text-center px-4 py-2 bg-slate-800/50 rounded-xl">
                <p className="text-2xl font-black text-white">{filteredMovies.length}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Movies</p>
              </div>
              <div className="text-center px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/30">
                <p className="text-2xl font-black text-red-400">{interestedMovies.length}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Interested</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Language Filter Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { key: 'all', label: 'All Movies' },
            { key: 'English', label: 'Hollywood' },
            { key: 'Hindi', label: 'Bollywood' },
            { key: 'Nepali', label: 'Nepali' },
          ].map(lang => (
            <button
              key={lang.key}
              onClick={() => { setSelectedLanguage(lang.key); setDisplayCount(30); }}
              className={`option-chip px-5 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-2 ${
                selectedLanguage === lang.key
                  ? 'option-chip-active'
                  : ''
              }`}
            >
              {lang.label}
              <span className="option-chip-count">
                {languageCounts[lang.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          {/* Time Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'thisMonth', label: 'This Month' },
              { key: 'nextMonth', label: 'Next Month' },
              { key: 'interested', label: '🔥 Interested' },
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => { setSelectedFilter(filter.key); setDisplayCount(30); }}
                className={`option-chip px-4 py-2 text-sm font-medium cursor-pointer ${
                  selectedFilter === filter.key
                    ? filter.key === 'interested' ? 'option-chip-accent' : 'option-chip-active'
                    : ''
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <div className="sm:flex-1"></div>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#181818] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4a4a4a] cursor-pointer"
            >
              <option value="interest">Most Interested</option>
              <option value="popularity">Most Popular</option>
              <option value="date">Release Date</option>
              <option value="title">Title A-Z</option>
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
                      className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 border-2 border-slate-800 group-hover:border-red-500/40 shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(movie.isBackend ? `/movie/backend/${movie.id}` : `/details/movie/${movie.id}`)}
                    >
                      {movie.image ? (
                        <img
                          src={movie.image}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => { 
                            e.target.onerror = null;
                            e.target.src = '/no-poster.png'; 
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-red-900/50 to-slate-900 flex items-center justify-center">
                          <span className="text-sm text-slate-500">Coming Soon</span>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent"></div>
                      
                      {/* Top Row: Language + Interest */}
                      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                        {/* Language Badge */}
                        <div className={`${langBadge.color} px-2 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1`}>
                          <span className="sm:inline">{movie.language}</span>
                        </div>
                        
                        {/* Interest Button */}
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleInterested(movie);
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              isInterested(movie.id)
                                ? 'bg-red-500 scale-110'
                                : 'bg-black/60 hover:bg-red-500/80 hover:scale-110'
                            }`}
                            title={isInterested(movie.id) ? 'Remove interest' : 'Mark as interested'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
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
                        <div className="flex items-center justify-between">
                          <p className="text-red-300 text-xs">{formatDate(movie.releaseDate)}</p>
                          {movie.interestedCount > 0 && (
                            <span className="text-red-400 text-xs font-bold flex items-center gap-0.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                              {movie.interestedCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Title below card */}
                    <h3 
                      className="font-semibold text-sm truncate group-hover:text-red-400 transition-colors cursor-pointer"
                      onClick={() => navigate(movie.isBackend ? `/movie/backend/${movie.id}` : `/details/movie/${movie.id}`)}
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
                  className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
                >
                  Load More Movies ({filteredMovies.length - displayCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700">
            <span className="text-sm text-slate-500 block mb-6">No Movies Found</span>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No Movies Found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your filters</p>
            <button 
              onClick={() => {
                setSelectedLanguage('all');
                setSelectedFilter('all');
              }}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Watchlist Summary */}
        {interestedMovies.length > 0 && selectedFilter !== 'interested' && (
          <div className="mt-12 p-5 bg-linear-to-r from-red-500/10 via-red-500/10 to-red-500/10 border border-red-500/30 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                </div>
                <div>
                  <p className="text-white font-bold">
                    {interestedMovies.length} movie{interestedMovies.length > 1 ? 's' : ''} you're interested in
                  </p>
                  <p className="text-slate-400 text-sm">Don't miss these upcoming releases!</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFilter('interested')}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                View Interested
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upcoming;



