import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminMovies } from '../data/adminMovies';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

// Helper: Convert TMDB movie to our format
const formatTMDBMovie = (movie) => ({
  id: movie.id,
  title: movie.title,
  rating: movie.vote_average,
  image: movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : null,
  backdrop: movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : null,
  overview: movie.overview,
  year: movie.release_date?.slice(0, 4)
});

const Home = () => {
  const navigate = useNavigate();
  const exploreRef = useRef(null);
  
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [exploreMovies, setExploreMovies] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch TMDB data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendingRes, exploreRes] = await Promise.all([
          fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${Math.floor(Math.random() * 3) + 1}`)
        ]);

        if (trendingRes.ok) {
          const data = await trendingRes.json();
          setTrendingMovies(data.results?.slice(0, 6).map(formatTMDBMovie) || []);
        }

        if (exploreRes.ok) {
          const data = await exploreRes.json();
          const shuffled = data.results?.sort(() => Math.random() - 0.5).slice(0, 15) || [];
          setExploreMovies(shuffled.map(formatTMDBMovie));
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-slide
  useEffect(() => {
    if (trendingMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trendingMovies.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [trendingMovies.length]);

  // Filter now showing movies
  const nowShowingMovies = adminMovies.filter(m => m.isNowShowing);

  // Scroll explore section
  const scrollExplore = (dir) => {
    if (exploreRef.current) {
      exploreRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1121] text-white">
      
      {/* ========== HERO SLIDER ========== */}
      <section className="relative h-[50vh] min-h-[360px] max-h-[480px] overflow-hidden">
        {trendingMovies.map((movie, index) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Background */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${movie.backdrop || movie.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b1121] via-[#0b1121]/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-transparent to-[#0b1121]/40"></div>
            </div>
            
            {/* Content - compact */}
            <div className="relative h-full max-w-6xl mx-auto px-6 flex items-center">
              <div className="max-w-lg">
                <span className="inline-block bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded mb-3 uppercase tracking-wide">
                  🔥 Trending
                </span>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight line-clamp-2">
                  {movie.title}
                </h1>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 max-w-md">
                  {movie.overview?.slice(0, 120)}...
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => navigate(`/movie/${movie.id}`, { state: { isNowShowing: false } })}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 px-6 rounded-full text-sm transition-all"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => navigate(`/movie/${movie.id}`, { state: { isNowShowing: false } })}
                    className="border border-white/30 hover:border-white/60 text-white font-medium py-2.5 px-6 rounded-full text-sm transition-all"
                  >
                    More Info
                  </button>
                  <span className="text-yellow-400 text-sm font-semibold ml-2">★ {movie.rating?.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {trendingMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`transition-all rounded-full ${
                i === currentSlide ? 'w-6 h-2 bg-cyan-500' : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Arrows */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-lg z-10"
        >
          ‹
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % trendingMovies.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-lg z-10"
        >
          ›
        </button>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        
        {/* ========== NOW SHOWING ========== */}
        <section className="py-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-1 h-8 bg-red-500 rounded-full"></span>
            <h2 className="text-xl font-bold">Now Showing in Cinema</h2>
            <span className="ml-auto flex items-center gap-1.5 text-red-500 text-xs font-bold">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              LIVE
            </span>
          </div>
          
          {nowShowingMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {nowShowingMovies.map((movie) => (
                <div 
                  key={movie.id} 
                  className="group cursor-pointer bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800 hover:border-red-500/40 transition-all hover:-translate-y-1"
                  onClick={() => navigate(`/movie/${movie.id}`, { state: { isNowShowing: true } })}
                >
                  <div className="relative aspect-[3/4]">
                    <img src={movie.image} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2 left-2 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                      NOW
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-cyan-400">
                      NPR {movie.price}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">{movie.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-yellow-400 text-xs">{'★'.repeat(Math.floor(movie.rating))} {movie.rating}</span>
                      <span className="text-red-400 text-xs font-semibold">Book →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-sm">No movies currently showing</p>
            </div>
          )}
        </section>

        {/* ========== EXPLORE MORE (Horizontal Scroll) ========== */}
        <section className="py-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-8 bg-cyan-500 rounded-full"></span>
            <h2 className="text-xl font-bold">Explore More</h2>
            <div className="ml-auto flex gap-2">
              <button onClick={() => scrollExplore(-1)} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-sm">‹</button>
              <button onClick={() => scrollExplore(1)} className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-sm">›</button>
            </div>
          </div>
          
          <div 
            ref={exploreRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {exploreMovies.map((movie) => (
              <div 
                key={movie.id} 
                className="flex-shrink-0 w-32 cursor-pointer group"
                onClick={() => navigate(`/movie/${movie.id}`, { state: { isNowShowing: false } })}
              >
                <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-2">
                  <img 
                    src={movie.image || 'https://via.placeholder.com/200x300?text=No+Image'} 
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-400">
                    ★ {movie.rating?.toFixed(1)}
                  </div>
                </div>
                <h4 className="text-xs font-medium truncate group-hover:text-cyan-400 transition-colors">{movie.title}</h4>
                <p className="text-[10px] text-slate-500">{movie.year}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========== FAVORITES (Placeholder) ========== */}
        <section className="py-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-8 bg-pink-500 rounded-full"></span>
            <h2 className="text-xl font-bold">Your Favorites</h2>
          </div>
          
          <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
            <span className="text-3xl mb-3 block">❤️</span>
            <p className="text-slate-400 text-sm">No favorites yet</p>
            <p className="text-slate-600 text-xs mt-1">Save movies to see them here</p>
          </div>
        </section>

        {/* ========== QUICK LINKS ========== */}
        <section className="pt-4 pb-8">
          <div className="grid grid-cols-3 gap-4">
            <div 
              onClick={() => navigate('/movies')} 
              className="group bg-slate-900/50 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-cyan-500/40 transition-all text-center"
            >
              <span className="text-2xl block mb-2">🎬</span>
              <h3 className="font-semibold text-sm group-hover:text-cyan-400 transition-colors">All Movies</h3>
            </div>
            <div 
              onClick={() => navigate('/login')} 
              className="group bg-slate-900/50 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-purple-500/40 transition-all text-center"
            >
              <span className="text-2xl block mb-2">🎫</span>
              <h3 className="font-semibold text-sm group-hover:text-purple-400 transition-colors">My Bookings</h3>
            </div>
            <div 
              onClick={() => navigate('/admin')} 
              className="group bg-slate-900/50 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-yellow-500/40 transition-all text-center"
            >
              <span className="text-2xl block mb-2">⚙️</span>
              <h3 className="font-semibold text-sm group-hover:text-yellow-400 transition-colors">Admin</h3>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
