import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// TODO: Replace with backend API when backend is ready
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// ============================================
// JIKAN API for Japanese Anime
// TODO: Replace with backend API when backend is ready
// ============================================
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// ============================================
// Horizontal scroll section component
// ============================================
const HorizontalSection = ({ title, items, type, navigate, color, viewAllPath }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Get correct detail route based on media type
  const getDetailPath = (item) => {
    if (type === 'tv') {
      return `/details/tv/${item.id}`;
    }
    if (type === 'animation') {
      return `/details/animation/${item.id}`;
    }
    if (type === 'anime') {
      return `/details/anime/${item.mal_id}`;
    }
    return `/details/movie/${item.id}`;
  };

  // Get image URL based on type
  const getImageUrl = (item) => {
    if (type === 'anime') {
      return item.images?.jpg?.image_url || '/placeholder.jpg';
    }
    return item.poster_path ? `${IMG_BASE}${item.poster_path}` : '/placeholder.jpg';
  };

  // Get title based on type
  const getTitle = (item) => {
    if (type === 'anime') return item.title;
    return item.title || item.name;
  };

  // Get rating based on type
  const getRating = (item) => {
    if (type === 'anime') return item.score || 0;
    return item.vote_average || 0;
  };

  // Get year based on type
  const getYear = (item) => {
    if (type === 'anime') return item.aired?.prop?.from?.year || '';
    return (item.release_date || item.first_air_date || '').slice(0, 4);
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`w-1.5 h-5 ${color} rounded-full`}></span>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(viewAllPath)}
            className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
          >
            View All →
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <div
            key={type === 'anime' ? item.mal_id : item.id}
            onClick={() => navigate(getDetailPath(item))}
            className="flex-shrink-0 w-36 cursor-pointer group"
          >
            <div className="relative rounded-lg overflow-hidden mb-2">
              <img
                src={getImageUrl(item)}
                alt={getTitle(item)}
                className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-xs font-bold">
                ★ {getRating(item).toFixed(1)}
              </div>
            </div>
            <h3 className="font-medium text-sm truncate">{getTitle(item)}</h3>
            <p className="text-xs text-slate-500">{getYear(item)}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// ============================================
// Random Card Component (at bottom) - NO daily limit
// ============================================
const RandomCard = ({ item, onRandomize, navigate, allItems }) => {
  // Get correct detail route
  const getDetailPath = () => {
    if (!item) return '/browse';
    // Check if it's a TV show (has 'name' but no 'title', or has first_air_date)
    const isTV = item.first_air_date && !item.release_date;
    return isTV ? `/details/tv/${item.id}` : `/details/movie/${item.id}`;
  };

  return (
    <div className="flex flex-col items-center py-10 border-t border-slate-800">
      <h3 className="text-sm font-semibold text-slate-400 mb-4">🎲 Random Pick</h3>
      
      {item ? (
        <div 
          onClick={() => navigate(getDetailPath())}
          className="w-44 cursor-pointer group"
        >
          <div className="relative rounded-xl overflow-hidden mb-3 shadow-lg">
            <img
              src={item.poster_path ? `${IMG_BASE}${item.poster_path}` : '/placeholder.jpg'}
              alt={item.title || item.name}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-semibold text-sm truncate">{item.title || item.name}</p>
              <p className="text-slate-400 text-xs">★ {(item.vote_average || 0).toFixed(1)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-44 h-64 bg-slate-800/50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-700">
          <p className="text-slate-500 text-sm text-center px-4">Click below to get your random pick!</p>
        </div>
      )}

      <button
        onClick={onRandomize}
        disabled={allItems.length === 0}
        className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
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
// Main Browse Component
// ============================================
const Browse = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [anime, setAnime] = useState([]);
  const [animations, setAnimations] = useState([]);
  const [randomItem, setRandomItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================
  // BACKEND-SAFE: Fetch browse data
  // Uses TMDB for movies, TV, animations
  // Uses Jikan for Japanese anime
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch from TMDB
        const [moviesRes, tvRes, animRes] = await Promise.all([
          fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16`)
        ]);

        const moviesData = await moviesRes.json();
        const tvData = await tvRes.json();
        const animData = await animRes.json();

        setMovies(moviesData.results || []);
        setTvShows(tvData.results || []);
        setAnimations(animData.results || []);
        
        // Fetch from Jikan (with slight delay to avoid rate limiting)
        setTimeout(async () => {
          try {
            const animeRes = await fetch(`${JIKAN_BASE_URL}/top/anime?limit=20`);
            if (animeRes.ok) {
              const animeData = await animeRes.json();
              setAnime(animeData.data || []);
            }
          } catch (err) {
            console.error('Failed to fetch anime:', err);
          }
        }, 300);
        
      } catch (err) {
        console.error('Failed to fetch browse data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============================================
  // Random handler - NO daily limit, can click anytime
  // ============================================
  const handleRandomize = () => {
    const allItems = [...movies, ...tvShows];
    if (allItems.length === 0) return;
    
    const newItem = allItems[Math.floor(Math.random() * allItems.length)];
    setRandomItem(newItem);
  };

  const allItems = [...movies, ...tvShows];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1121] text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6">
        <h1 className="text-3xl font-black mb-2">Browse</h1>
        <p className="text-slate-400">Discover movies, TV shows, anime, and animations</p>
      </div>

      {/* Horizontal Sections */}
      <div className="max-w-6xl mx-auto px-4">
        <HorizontalSection 
          title="Movies" 
          items={movies} 
          type="movie"
          navigate={navigate} 
          color="bg-cyan-500"
          viewAllPath="/movies"
        />
        
        <HorizontalSection 
          title="TV Shows" 
          items={tvShows} 
          type="tv"
          navigate={navigate} 
          color="bg-purple-500"
          viewAllPath="/tvshows"
        />
        
        <HorizontalSection 
          title="🎌 Anime" 
          items={anime} 
          type="anime"
          navigate={navigate} 
          color="bg-pink-500"
          viewAllPath="/anime"
        />
        
        <HorizontalSection 
          title="Animations" 
          items={animations} 
          type="animation"
          navigate={navigate} 
          color="bg-amber-500"
          viewAllPath="/animations"
        />
      </div>

      {/* Random Section at Bottom */}
      <div className="max-w-6xl mx-auto px-4">
        <RandomCard 
          item={randomItem}
          onRandomize={handleRandomize}
          navigate={navigate}
          allItems={allItems}
        />
      </div>

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Browse;
