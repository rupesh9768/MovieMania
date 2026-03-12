import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrendingMovies, getNowPlayingMovies, getNepaliMovies, getIndianMovies, getUpcomingBigMovies } from '../api/movieService';
import TrendingDiscussions from '../components/TrendingDiscussions';

const Home = () => {
  const navigate = useNavigate();
  const nepaliRef = useRef(null);
  const indianRef = useRef(null);
  const trendingRef = useRef(null);
  const mostInterestedRef = useRef(null);
  
  // State for different movie sections
  const [heroMovies, setHeroMovies] = useState([]);
  const [nepaliMovies, setNepaliMovies] = useState([]);
  const [indianMovies, setIndianMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [mostInterested, setMostInterested] = useState([]);
  const [interestedIds, setInterestedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [trending, nowPlaying, nepali, indian, upcoming] = await Promise.all([
          getTrendingMovies('day', false),
          getNowPlayingMovies(1, false),
          getNepaliMovies(1),
          getIndianMovies(1),
          getUpcomingBigMovies(12)
        ]);
        
        console.log('TMDB API Results:', {
          trending: trending.length,
          nowPlaying: nowPlaying.length,
          nepali: nepali.length,
          indian: indian.length,
          upcoming: upcoming.length
        });
        
        const heroList = trending.filter(m => m.backdrop).slice(0, 8);
        setHeroMovies(heroList);
        setNepaliMovies(nepali.slice(0, 15));
        setIndianMovies(indian.slice(0, 15));
        
        const globalTrending = nowPlaying.filter(m => 
          !nepali.some(n => n.id === m.id) && 
          !indian.some(i => i.id === m.id)
        ).slice(0, 15);
        setTrendingMovies(globalTrending);
        
        // Most Interested = Upcoming movies the user marked as interested
        let savedIds = [];
        try {
          savedIds = JSON.parse(localStorage.getItem('interestedUpcoming') || '[]');
        } catch { savedIds = []; }
        
        // Clean: only keep IDs that exist in the upcoming list and haven't released
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingIdSet = new Set(upcoming.map(m => m.id));
        const validIds = savedIds.filter(id => {
          if (!upcomingIdSet.has(id)) return false;
          const movie = upcoming.find(m => m.id === id);
          if (!movie || !movie.releaseDate) return true;
          return new Date(movie.releaseDate) >= today;
        });
        
        if (validIds.length !== savedIds.length) {
          localStorage.setItem('interestedUpcoming', JSON.stringify(validIds));
        }
        setInterestedIds(validIds);
        
        const interestedUpcoming = upcoming.filter(m => validIds.includes(m.id));
        
        // If user has interested movies, show those; otherwise show top upcoming by popularity
        if (interestedUpcoming.length > 0) {
          setMostInterested(interestedUpcoming.slice(0, 15));
        } else {
          // Fallback: show top upcoming by popularity
          const topUpcoming = [...upcoming]
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 10);
          setMostInterested(topUpcoming);
        }
        
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

  const goToSlide = (index) => setCurrentSlide(index);

  const scrollSection = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction * 300, behavior: 'smooth' });
    }
  };

  // Reusable movie card with fire emoji
  const MovieCardRow = ({ movie, rank }) => {
    const movieIsInterested = interestedIds.includes(movie.id);
    
    return (
      <div 
        key={movie.id} 
        className="shrink-0 w-48 cursor-pointer group"
        onClick={() => navigate(`/movie/${movie.id}`)}
      >
        <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 border-2 border-slate-800 group-hover:border-cyan-500/50 transition-all shadow-lg group-hover:shadow-cyan-500/20 duration-300">
          <img 
            src={movie.image || 'https://via.placeholder.com/300x450?text=No+Poster'} 
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Interested badge on hover */}
          {movieIsInterested && (
            <div className="absolute top-2 right-2 bg-orange-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              🔥 Interested
            </div>
          )}

          {/* Rank badge for most interested */}
          {rank && (
            <div className="absolute bottom-2 left-2 text-5xl font-black text-white/10 leading-none select-none pointer-events-none">
              {rank}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-slate-500">{movie.year}</p>
      </div>
    );
  };

  // Section header component
  const SectionHeader = ({ title, badge, scrollRef }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="w-1 h-8 bg-linear-to-b from-cyan-400 to-cyan-600 rounded-full"></span>
        <h2 className="text-2xl font-bold">{title}</h2>
        {badge && (
          <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            {badge}
          </span>
        )}
      </div>
      {scrollRef && (
        <div className="flex gap-2">
          <button 
            onClick={() => scrollSection(scrollRef, -1)} 
            className="w-10 h-10 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center transition-all cursor-pointer text-lg border border-slate-700/50 hover:border-slate-600"
          >
            ‹
          </button>
          <button 
            onClick={() => scrollSection(scrollRef, 1)} 
            className="w-10 h-10 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center transition-all cursor-pointer text-lg border border-slate-700/50 hover:border-slate-600"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-cyan-400 font-black text-xl">M</span>
          </div>
          <p className="text-slate-400 text-sm">Loading movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">API Error</h2>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2.5 px-8 rounded-full transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
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
        <section className="relative h-[75vh] min-h-125 max-h-175 overflow-hidden">
          {heroMovies.map((movie, index) => (
            <div
              key={movie.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
              }`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${movie.backdrop})` }}
              >
                <div className="absolute inset-0 bg-linear-to-r from-dark-bg via-dark-bg/70 to-transparent"></div>
                <div className="absolute inset-0 bg-linear-to-t from-dark-bg via-transparent to-dark-bg/40"></div>
              </div>
              
              <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center">
                <div className="max-w-2xl animate-fade-in">
                  <span className="inline-flex items-center gap-2 bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider backdrop-blur-sm">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Now Trending
                  </span>
                  
                  <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight tracking-tight">
                    {movie.title}
                  </h1>
                  
                  <p className="text-slate-300 text-lg mb-6 line-clamp-3 leading-relaxed max-w-xl">
                    {movie.overview}
                  </p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <button 
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-cyan-500/30 cursor-pointer active:scale-95"
                    >
                      View Details
                    </button>
                    
                    {movie.year && (
                      <span className="text-slate-400 font-medium bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full text-sm">{movie.year}</span>
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
                    ? 'w-10 h-3 bg-linear-to-r from-cyan-400 to-cyan-500 shadow-lg shadow-cyan-500/40' 
                    : 'w-3 h-3 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

        </section>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ========== MOST INTERESTED SECTION ========== */}
        {mostInterested.length > 0 && (
          <section className="mb-16 section-animate">
            <SectionHeader title="Most Interested" badge="🔥 Upcoming" scrollRef={mostInterestedRef} />
            
            <div 
              ref={mostInterestedRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {mostInterested.map((movie, index) => (
                <MovieCardRow key={movie.id} movie={movie} rank={index + 1} />
              ))}
            </div>
          </section>
        )}

        {/* ========== TRENDING DISCUSSIONS ========== */}
        <TrendingDiscussions />
        
        {/* ========== NEPALI MOVIES ========== */}
        {nepaliMovies.length > 0 && (
          <section className="mb-14 section-animate">
            <SectionHeader title="Nepali Movies" badge="Nepal" scrollRef={nepaliRef} />
            
            <div 
              ref={nepaliRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {nepaliMovies.map((movie) => (
                <MovieCardRow key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* ========== INDIAN (BOLLYWOOD) MOVIES ========== */}
        {indianMovies.length > 0 && (
          <section className="mb-14 section-animate">
            <SectionHeader title="Bollywood Movies" badge="India" scrollRef={indianRef} />
            
            <div 
              ref={indianRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {indianMovies.map((movie) => (
                <MovieCardRow key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* ========== GLOBAL TRENDING MOVIES ========== */}
        {trendingMovies.length > 0 && (
          <section className="mb-14 section-animate">
            <SectionHeader title="Now Playing Worldwide" badge="Global" scrollRef={trendingRef} />
            
            <div 
              ref={trendingRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {trendingMovies.map((movie) => (
                <MovieCardRow key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* ========== EXPLORE MORE BUTTON ========== */}
        <section className="py-16 text-center section-animate">
          <div className="glass-card rounded-3xl p-12 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-3">Discover More Movies</h3>
            <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">Explore thousands of movies from around the world. From Hollywood blockbusters to regional cinema.</p>
            <button 
              onClick={() => navigate('/movies')}
              className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-12 rounded-full text-lg transition-all shadow-xl shadow-cyan-500/20 cursor-pointer active:scale-95"
            >
              Browse All Movies
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;



