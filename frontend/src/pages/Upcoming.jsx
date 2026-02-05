import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendApi } from '../api';

// ============================================
// UPCOMING PAGE
// Uses ONLY backend API - No mock data
// Shows movies where isNowPlaying === false
// ============================================
const Upcoming = () => {
  const navigate = useNavigate();
  
  // State
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interested movies (localStorage for now)
  // TODO: Move to backend when user auth is ready
  const [interestedMovies, setInterestedMovies] = useState(() => {
    try {
      const saved = localStorage.getItem('interestedMovies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ============================================
  // Fetch upcoming movies from backend
  // ============================================
  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const upcomingMovies = await backendApi.getUpcomingMovies();
        console.log('✅ Upcoming: Fetched movies:', upcomingMovies.length);
        
        // Sort by release date (ascending)
        const sorted = upcomingMovies.sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date('9999-12-31');
          const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date('9999-12-31');
          return dateA - dateB;
        });
        
        setMovies(sorted);
      } catch (err) {
        console.error('❌ Failed to fetch upcoming movies:', err);
        setError('Failed to load upcoming movies. Please check if backend is running.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpcoming();
  }, []);

  // ============================================
  // Toggle interested status
  // TODO: Save to backend when user auth is ready
  // ============================================
  const toggleInterested = (movieId) => {
    setInterestedMovies(prev => {
      const isCurrentlyInterested = prev.includes(movieId);
      const updated = isCurrentlyInterested 
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId];
      
      localStorage.setItem('interestedMovies', JSON.stringify(updated));
      return updated;
    });
  };

  const isInterested = (movieId) => interestedMovies.includes(movieId);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // ============================================
  // Loading state
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading upcoming movies...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Error state
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-6 rounded-full transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1121] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm flex items-center gap-1"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-3xl font-black mb-2">Upcoming Movies</h1>
          <p className="text-slate-400">
            {movies.length} upcoming release{movies.length !== 1 ? 's' : ''} • Sorted by release date
          </p>
        </div>

        {/* Movies Grid */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="group">
                {/* Card */}
                <div 
                  className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border-2 border-slate-800 group-hover:border-purple-500/50 shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/details/movie/${movie.id}`)}
                >
                  <img
                    src={movie.poster || movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=Coming+Soon'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Coming Soon Badge */}
                  <div className="absolute top-3 left-3 bg-purple-600 px-2.5 py-1 rounded-lg text-xs font-bold uppercase">
                    Coming Soon
                  </div>
                  
                  {/* Release Date Badge */}
                  <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <p className="text-xs text-slate-400">Release Date</p>
                    <p className="text-sm font-bold text-white">{formatDate(movie.releaseDate)}</p>
                  </div>
                </div>
                
                {/* Title */}
                <h3 
                  className="font-semibold text-sm truncate group-hover:text-purple-400 transition-colors cursor-pointer mb-2"
                  onClick={() => navigate(`/details/movie/${movie.id}`)}
                >
                  {movie.title}
                </h3>
                
                {/* Interested Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleInterested(movie.id);
                  }}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isInterested(movie.id)
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  {isInterested(movie.id) ? '❤️ Interested' : '🤍 Mark Interested'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
            <span className="text-5xl mb-4 block">📅</span>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No Upcoming Movies</h3>
            <p className="text-slate-500 mb-6">Check back later for new releases</p>
            <button 
              onClick={() => navigate('/browse')}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-full transition-all cursor-pointer"
            >
              Browse Available Movies
            </button>
          </div>
        )}

        {/* Interested Summary */}
        {interestedMovies.length > 0 && (
          <div className="mt-12 p-5 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-sm text-slate-400">
              <span className="text-pink-400 font-bold text-lg">{interestedMovies.length}</span> movie{interestedMovies.length > 1 ? 's' : ''} marked as interested
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upcoming;
