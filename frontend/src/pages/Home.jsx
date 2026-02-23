import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrendingMovies, getNowPlayingMovies, getNepaliMovies, getIndianMovies } from '../api/movieService';

const Home = () => {
  const navigate = useNavigate();
  const nepaliRef = useRef(null);
  const indianRef = useRef(null);
  const trendingRef = useRef(null);
  
  // State for different movie sections
  const [heroMovies, setHeroMovies] = useState([]);
  const [nepaliMovies, setNepaliMovies] = useState([]);
  const [indianMovies, setIndianMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all categories in parallel
        const [trending, nowPlaying, nepali, indian] = await Promise.all([
          getTrendingMovies('day', false), // No regional blend for hero
          getNowPlayingMovies(1, false),
          getNepaliMovies(1),
          getIndianMovies(1)
        ]);
        
        console.log('TMDB API Results:', {
          trending: trending.length,
          nowPlaying: nowPlaying.length,
          nepali: nepali.length,
          indian: indian.length
        });
        
        // Use trending movies for hero (top 8 with backdrops)
        const heroList = trending.filter(m => m.backdrop).slice(0, 8);
        setHeroMovies(heroList);
        
        // Set Nepali movies
        setNepaliMovies(nepali.slice(0, 15));
        
        // Set Indian movies
        setIndianMovies(indian.slice(0, 15));
        
        // Set global trending (excluding Nepali/Indian)
        const globalTrending = nowPlaying.filter(m => 
          !nepali.some(n => n.id === m.id) && 
          !indian.some(i => i.id === m.id)
        ).slice(0, 15);
        setTrendingMovies(globalTrending);
        
      } catch (err) {
        console.error('Failed to fetch from TMDB:', err);
        setError('Failed to load movies from TMDB API.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllMovies();
  }, []);

  useEffect(() => {
    if (heroMovies.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroMovies.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [heroMovies.length]);

  // Slide navigation
  const goToSlide = (index) => setCurrentSlide(index);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + heroMovies.length) % heroMovies.length);
  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % heroMovies.length);

  // Scroll horizontal sections
  const scrollSection = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction * 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading movies from TMDB...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4 text-red-400 font-bold">!</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">API Error</h2>
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
      
      {/* ========== HERO SLIDER ========== */}
      {heroMovies.length > 0 && (
        <section className="relative h-[70vh] min-h-125 max-h-175 overflow-hidden">
          {heroMovies.map((movie, index) => (
            <div
              key={movie.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${movie.backdrop})` }}
              >
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-linear-to-r from-dark-bg via-dark-bg/70 to-transparent"></div>
                <div className="absolute inset-0 bg-linear-to-t from-dark-bg via-transparent to-dark-bg/40"></div>
              </div>
              
              {/* Content */}
              <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Now Trending
                  </span>
                  
                  <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">
                    {movie.title}
                  </h1>
                  
                  <p className="text-slate-300 text-lg mb-6 line-clamp-3 leading-relaxed max-w-xl">
                    {movie.overview}
                  </p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <button 
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-cyan-500/30 cursor-pointer"
                    >
                      View Details
                    </button>
                    
                    {movie.rating > 0 && (
                      <span className="flex items-center gap-2 text-yellow-400 font-bold text-lg">
                        <span className="text-2xl">★</span>
                        <span>{movie.rating.toFixed(1)}</span>
                      </span>
                    )}
                    
                    {movie.year && (
                      <span className="text-slate-400 font-medium">{movie.year}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {heroMovies.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`transition-all rounded-full cursor-pointer ${
                  i === currentSlide 
                    ? 'w-10 h-3 bg-cyan-500' 
                    : 'w-3 h-3 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-3xl z-20 transition-all cursor-pointer backdrop-blur-sm"
          >
            ‹
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-3xl z-20 transition-all cursor-pointer backdrop-blur-sm"
          >
            ›
          </button>
        </section>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* ========== NEPALI MOVIES ========== */}
        {nepaliMovies.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-8 bg-cyan-500 rounded-full"></span>
                <h2 className="text-2xl font-bold">Nepali Movies</h2>
                <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/15 px-3 py-1 rounded-full">
                  Nepal
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollSection(nepaliRef, -1)} 
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors cursor-pointer text-lg"
                >
                  ‹
                </button>
                <button 
                  onClick={() => scrollSection(nepaliRef, 1)} 
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors cursor-pointer text-lg"
                >
                  ›
                </button>
              </div>
            </div>
            
            <div 
              ref={nepaliRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {nepaliMovies.map((movie) => (
                <div 
                  key={movie.id} 
                  className="shrink-0 w-48 cursor-pointer group"
                  onClick={() => navigate(`/movie/${movie.id}`)}
                >
                    <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 border-2 border-slate-800 group-hover:border-cyan-500/50 transition-all shadow-lg">
                    <img 
                      src={movie.image || 'https://via.placeholder.com/300x450?text=No+Poster'} 
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Rating */}
                    {movie.rating > 0 && (
                      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-yellow-400 flex items-center gap-1">
                        ★ {movie.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-slate-500">{movie.year}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========== INDIAN (BOLLYWOOD) MOVIES ========== */}
        {indianMovies.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-8 bg-cyan-500 rounded-full"></span>
                <h2 className="text-2xl font-bold">Bollywood Movies</h2>
                <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/15 px-3 py-1 rounded-full">
                  India
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollSection(indianRef, -1)} 
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors cursor-pointer text-lg"
                >
                  ‹
                </button>
                <button 
                  onClick={() => scrollSection(indianRef, 1)} 
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors cursor-pointer text-lg"
                >
                  ›
                </button>
              </div>
            </div>
            
            <div 
              ref={indianRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {indianMovies.map((movie) => (
                <div 
                  key={movie.id} 
                  className="shrink-0 w-48 cursor-pointer group"
                  onClick={() => navigate(`/movie/${movie.id}`)}
                >
                    <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 border-2 border-slate-800 group-hover:border-cyan-500/50 transition-all shadow-lg">
                    <img 
                      src={movie.image || 'https://via.placeholder.com/300x450?text=No+Poster'} 
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Rating */}
                    {movie.rating > 0 && (
                      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-yellow-400 flex items-center gap-1">
                        {movie.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-slate-500">{movie.year}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========== GLOBAL TRENDING MOVIES ========== */}
        {trendingMovies.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-8 bg-cyan-500 rounded-full"></span>
                <h2 className="text-2xl font-bold">Now Playing Worldwide</h2>
                <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/15 px-3 py-1 rounded-full">
                  Global
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollSection(trendingRef, -1)} 
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors cursor-pointer text-lg"
                >
                  ‹
                </button>
                <button 
                  onClick={() => scrollSection(trendingRef, 1)} 
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors cursor-pointer text-lg"
                >
                  ›
                </button>
              </div>
            </div>
            
            <div 
              ref={trendingRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {trendingMovies.map((movie) => (
                <div 
                  key={movie.id} 
                  className="shrink-0 w-48 cursor-pointer group"
                  onClick={() => navigate(`/movie/${movie.id}`)}
                >
                    <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 border-2 border-slate-800 group-hover:border-cyan-500/50 transition-all shadow-lg">
                    <img 
                      src={movie.image || 'https://via.placeholder.com/300x450?text=No+Poster'} 
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Rating */}
                    {movie.rating > 0 && (
                      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-yellow-400 flex items-center gap-1">
                        ★ {movie.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-slate-500">{movie.year}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========== EXPLORE MORE BUTTON ========== */}
        <section className="py-12 text-center">
          <button 
            onClick={() => navigate('/movies')}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 px-12 rounded-full text-lg transition-all shadow-xl shadow-cyan-500/20 cursor-pointer"
          >
            Browse All Movies
          </button>
        </section>

      </div>
    </div>
  );
};

export default Home;



