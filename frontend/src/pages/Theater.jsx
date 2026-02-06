import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendApi } from '../api';

// ============================================
// THEATER PAGE
// Shows movies currently playing in our halls
// Admin can manage these movies
// ============================================
const Theater = () => {
  const navigate = useNavigate();
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // Fetch movies from backend (isNowPlaying = true)
  // ============================================
  useEffect(() => {
    const fetchTheaterMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get now playing movies from backend
        const nowPlaying = await backendApi.getBackendNowPlaying();
        console.log('🎬 Theater movies:', nowPlaying);
        setMovies(nowPlaying);
        
      } catch (err) {
        console.error('Failed to fetch theater movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTheaterMovies();
  }, []);

  // ============================================
  // Handle booking click
  // ============================================
  const handleBookNow = (movie) => {
    navigate(`/theater/${movie.id}`, { state: { movie } });
  };

  // ============================================
  // Loading state
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading theater movies...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Main render
  // ============================================
  return (
    <div className="min-h-screen bg-dark-bg text-white">
      
      {/* Hero Banner */}
      <section className="relative py-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-red-900/20 via-dark-bg to-dark-bg"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-400 text-sm font-semibold uppercase tracking-wide">Now Showing</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            🎬 Our Theater
          </h1>
          
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Book your tickets for movies currently playing in our halls. 
            Experience cinema like never before!
          </p>
        </div>
      </section>

      {/* Movies Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        
        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center mb-8">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-300 hover:text-red-200 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Movies */}
        {!error && movies.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold mb-2">No Movies Currently Showing</h2>
            <p className="text-slate-400 mb-6">Check back later for new releases!</p>
            <button 
              onClick={() => navigate('/admin')}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-full transition-all"
            >
              Admin: Add Movies →
            </button>
          </div>
        )}

        {/* Movies Grid */}
        {movies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <div 
                key={movie.id} 
                className="group relative bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800/50 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/10"
              >
                {/* Poster */}
                <div className="aspect-2/3 relative overflow-hidden">
                  {movie.poster ? (
                    <img 
                      src={movie.poster} 
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <button 
                      onClick={() => handleBookNow(movie)}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-full text-sm w-full transition-all"
                    >
                      🎟️ Book Now
                    </button>
                  </div>
                  
                  {/* Now Playing Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                  </div>
                  
                  {/* Rating Badge */}
                  {movie.rating > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded-full">
                        ★ {movie.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Movie Info */}
                <div className="p-3">
                  <h3 className="font-bold text-sm truncate mb-1">{movie.title}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{movie.language?.toUpperCase() || 'NE'}</span>
                    {movie.runtime > 0 && <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
                  </div>
                  {movie.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {movie.genres.slice(0, 2).map((genre, idx) => (
                        <span key={idx} className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="bg-slate-900/30 border-t border-slate-800/50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl mb-3">🍿</div>
              <h3 className="font-bold text-lg mb-2">Premium Experience</h3>
              <p className="text-slate-400 text-sm">Dolby Atmos sound, 4K projection, and luxury seating</p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-3">🎟️</div>
              <h3 className="font-bold text-lg mb-2">Easy Booking</h3>
              <p className="text-slate-400 text-sm">Select your seats, pay online, and get instant confirmation</p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-3">🎁</div>
              <h3 className="font-bold text-lg mb-2">Member Rewards</h3>
              <p className="text-slate-400 text-sm">Earn points on every booking and get exclusive discounts</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Theater;



