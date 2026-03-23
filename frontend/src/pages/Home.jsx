import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNepaliMovies, getIndianMovies, getUpcomingBigMovies } from '../api/movieService';
import { getBackendNowPlaying } from '../api/backendService';
import TrendingDiscussions from '../components/TrendingDiscussions';
import HeroSlider from '../components/HeroSlider';

const Home = () => {
  const navigate = useNavigate();
  const nepaliRef = useRef(null);
  const indianRef = useRef(null);
  const trendingRef = useRef(null);
  const mostInterestedRef = useRef(null);
  
  // State for different movie sections
  const [nepaliMovies, setNepaliMovies] = useState([]);
  const [indianMovies, setIndianMovies] = useState([]);
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [mostInterested, setMostInterested] = useState([]);
  const [interestedIds, setInterestedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [backendNowPlaying, nepali, indian, upcoming] = await Promise.all([
          getBackendNowPlaying(),
          getNepaliMovies(1),
          getIndianMovies(1),
          getUpcomingBigMovies(12)
        ]);
        
        console.log('Homepage data results:', {
          backendNowPlaying: backendNowPlaying.length,
          nepali: nepali.length,
          indian: indian.length,
          upcoming: upcoming.length
        });
        
        setNowShowingMovies(backendNowPlaying.slice(0, 15));
        setNepaliMovies(nepali.slice(0, 15));
        setIndianMovies(indian.slice(0, 15));
        
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
        console.error('Failed to load homepage data:', err);
        setError('Failed to load homepage movies.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllMovies();
  }, []);

  const isBackendMovie = (movie) => Boolean(movie?.isBackend || movie?._id || movie?._raw?._id);

  const getBackendMovieId = (movie) => movie?._id || movie?._raw?._id || movie?.id;

  const getMovieDetailsPath = (movie) => {
    if (isBackendMovie(movie)) {
      return `/movie/backend/${getBackendMovieId(movie)}`;
    }
    return `/movie/${movie.id}`;
  };

  const handleViewDetails = (movie) => {
    navigate(getMovieDetailsPath(movie));
  };

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
        onClick={() => handleViewDetails(movie)}
      >
        <div className="relative aspect-2/3 rounded-[14px] overflow-hidden mb-3 border border-[#2a2a2a] bg-card-bg group-hover:border-[#3a3a3a] transition-all duration-150 shadow-sm group-hover:-translate-y-1 group-hover:shadow-lg">
          <img 
            src={movie.image || 'https://via.placeholder.com/300x450?text=No+Poster'} 
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-150"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster'; }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>

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
        <h3 className="font-semibold text-sm truncate text-white transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-[#b3b3b3]">{movie.year}</p>
      </div>
    );
  };

  // Section header component
  const SectionHeader = ({ title, badge, scrollRef }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[1.85rem] font-bold tracking-tight">{title}</h2>
          {badge && (
            <span className="text-xs font-semibold text-[#b3b3b3] bg-[#181818] px-3 py-1 rounded-full border border-[#2a2a2a]">
              {badge}
            </span>
          )}
        </div>
        {scrollRef && (
          <div className="flex gap-2">
            <button 
              onClick={() => scrollSection(scrollRef, -1)} 
              className="w-10 h-10 bg-[#181818] hover:bg-[#242424] rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border border-[#2a2a2a] text-[#b3b3b3] hover:text-white hover:scale-[1.03]"
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              onClick={() => scrollSection(scrollRef, 1)} 
              className="w-10 h-10 bg-[#181818] hover:bg-[#242424] rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border border-[#2a2a2a] text-[#b3b3b3] hover:text-white hover:scale-[1.03]"
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
      <div className="h-px bg-[#2a2a2a]"></div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">API Error</h2>
          <p className="text-[#b3b3b3] mb-6 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#E50914] hover:bg-[#c40812] text-white font-bold py-2.5 px-8 rounded-full transition-all duration-150 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <HeroSlider />

      {/* Main Content */}
      <div className="max-w-310 mx-auto px-5 pt-6 pb-14">

        {/* ========== MOST INTERESTED SECTION ========== */}
        {!loading && mostInterested.length > 0 && (
          <section className="mt-6 mb-16 section-animate">
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
        {!loading && nepaliMovies.length > 0 && (
          <section className="mt-15 mb-14 section-animate">
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
        {!loading && indianMovies.length > 0 && (
          <section className="mt-15 mb-14 section-animate">
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

        {/* ========== NOW SHOWING MOVIES ========== */}
        {!loading && nowShowingMovies.length > 0 && (
          <section className="mt-15 mb-14 section-animate">
            <SectionHeader title="Now Showing" badge="In Theater" scrollRef={trendingRef} />
            
            <div 
              ref={trendingRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {nowShowingMovies.map((movie) => (
                <MovieCardRow key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* ========== EXPLORE MORE BUTTON ========== */}
        <section className="mt-15 py-16 text-center section-animate">
          <div className="glass-card rounded-3xl p-12 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-3">Discover More Movies</h3>
            <p className="text-[#b3b3b3] text-sm mb-8 max-w-md mx-auto">Explore thousands of movies from around the world. From Hollywood blockbusters to regional cinema.</p>
            <button 
              onClick={() => navigate('/movies')}
              className="bg-[#E50914] hover:bg-[#c40812] text-white font-bold py-4 px-12 rounded-full text-lg transition-all duration-150 cursor-pointer"
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



