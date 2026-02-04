import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminMovies } from '../data/adminMovies';
import { movieApi } from '../api';

const Home = () => {
  const navigate = useNavigate();
  const exploreRef = useRef(null);
  
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [exploreMovies, setExploreMovies] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch movies using API service
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trending and popular movies in parallel
        const [trendingData, exploreData] = await Promise.all([
          movieApi.getTrendingMovies(),
          movieApi.getAllMovies({ page: Math.floor(Math.random() * 3) + 1 })
        ]);

        // Set trending movies (already normalized by service, with fallback)
        setTrendingMovies(trendingData?.slice(0, 6) || []);

        // Shuffle and set explore movies
        const shuffled = [...(exploreData || [])].sort(() => Math.random() - 0.5).slice(0, 15);
        setExploreMovies(shuffled);
        
      } catch (err) {
        console.error('❌ Failed to fetch movies:', err);
        // Service already provides fallback data, but set empty arrays just in case
        setTrendingMovies([]);
        setExploreMovies([]);
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
      <section className="relative h-[55vh] min-h-[400px] max-h-[520px] overflow-hidden">
        {trendingMovies.map((movie, index) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Background */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
              style={{ backgroundImage: `url(${movie.backdrop || movie.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b1121] via-[#0b1121]/80 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-transparent to-[#0b1121]/50"></div>
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            
            {/* Content - compact */}
            <div className="relative h-full max-w-6xl mx-auto px-6 flex items-center">
              <div className="max-w-md">
                <span className="inline-flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-4 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  Trending Now
                </span>
                <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight line-clamp-2">
                  {movie.title}
                </h1>
                <p className="text-slate-300 text-xs mb-4 line-clamp-2 max-w-sm leading-relaxed">
                  {movie.overview?.slice(0, 100)}...
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => navigate(`/details/movie/${movie.id}`, { state: { isNowShowing: false } })}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-5 rounded-full text-xs transition-all shadow-lg shadow-cyan-500/25"
                  >
                    View Details
                  </button>
                  <span className="text-yellow-400 text-xs font-semibold flex items-center gap-1">
                    <span>★</span> {movie.rating?.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {trendingMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`transition-all rounded-full ${
                i === currentSlide ? 'w-8 h-2 bg-cyan-500' : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Arrows */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + trendingMovies.length) % trendingMovies.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-xl z-10 transition-all hover:scale-110"
        >
          ‹
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % trendingMovies.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-xl z-10 transition-all hover:scale-110"
        >
          ›
        </button>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        
        {/* ========== NOW SHOWING ========== */}
        <section className="py-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-7 bg-red-500 rounded-full"></span>
            <h2 className="text-lg font-bold">Now Showing in Cinema</h2>
            <span className="ml-auto flex items-center gap-1.5 text-red-500 text-[10px] font-bold bg-red-500/10 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              LIVE
            </span>
          </div>
          
          {nowShowingMovies.length > 0 ? (
            <div 
              className="flex gap-4 overflow-x-auto pb-3"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {nowShowingMovies.map((movie) => (
                <div 
                  key={movie.id} 
                  className="flex-shrink-0 w-44 group cursor-pointer"
                  onClick={() => navigate(`/details/movie/${movie.id}`, { state: { isNowShowing: true } })}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 border border-slate-800 group-hover:border-red-500/50 transition-all">
                    <img src={movie.image} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-2 left-2 bg-red-600 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
                      <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                      NOW
                    </div>
                    {(movie.source === 'theatre' || movie.isNowPlaying) && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 rounded-lg transition-all">
                          Book Now →
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">{movie.title}</h3>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-yellow-400 text-[10px]">{'★'.repeat(Math.floor(movie.rating))} {movie.rating}</span>
                    <span className="text-slate-500 text-[10px]">NPR {movie.price}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
              <span className="text-2xl mb-2 block">🎬</span>
              <p className="text-slate-500 text-sm">No movies currently showing</p>
              <p className="text-slate-600 text-xs mt-1">Check back soon for new releases</p>
            </div>
          )}
        </section>

        {/* ========== EXPLORE MORE (Horizontal Scroll) ========== */}
        <section className="py-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-1 h-7 bg-cyan-500 rounded-full"></span>
            <h2 className="text-lg font-bold">Explore More</h2>
            <span className="text-slate-500 text-xs">Popular movies</span>
            <div className="ml-auto flex gap-1.5">
              <button onClick={() => scrollExplore(-1)} className="w-7 h-7 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center text-xs transition-colors">‹</button>
              <button onClick={() => scrollExplore(1)} className="w-7 h-7 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center text-xs transition-colors">›</button>
            </div>
          </div>
          
          <div 
            ref={exploreRef}
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {exploreMovies.map((movie) => (
              <div 
                key={movie.id} 
                className="flex-shrink-0 w-28 cursor-pointer group"
                onClick={() => navigate(`/details/movie/${movie.id}`, { state: { isNowShowing: false } })}
              >
                <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-1.5 border border-slate-800 group-hover:border-cyan-500/50 transition-all">
                  <img 
                    src={movie.image || 'https://via.placeholder.com/200x300?text=No+Image'} 
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-yellow-400">
                    ★ {movie.rating?.toFixed(1)}
                  </div>
                </div>
                <h4 className="text-[11px] font-medium truncate group-hover:text-cyan-400 transition-colors">{movie.title}</h4>
                <p className="text-[9px] text-slate-500">{movie.year}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========== FAVORITES (Placeholder) ========== */}
        <section className="py-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-1 h-7 bg-pink-500 rounded-full"></span>
            <h2 className="text-lg font-bold">Your Favorites</h2>
            <span className="ml-2 text-[10px] font-semibold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">Coming Soon</span>
          </div>
          
          <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/50">
            <span className="text-2xl mb-2 block">❤️</span>
            <p className="text-slate-400 text-sm">No favorites yet</p>
            <p className="text-slate-600 text-[11px] mt-1">Save movies to see them here</p>
          </div>
        </section>

        {/* ========== QUICK LINKS ========== */}
        <section className="pt-4 pb-6">
          <div className="grid grid-cols-3 gap-3">
            <div 
              onClick={() => navigate('/movies')} 
              className="group bg-slate-900/50 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all text-center"
            >
              <span className="text-xl block mb-1.5">🎬</span>
              <h3 className="font-semibold text-xs group-hover:text-cyan-400 transition-colors">All Movies</h3>
            </div>
            <div 
              onClick={() => navigate('/login')} 
              className="group bg-slate-900/50 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-purple-500/40 hover:bg-slate-900/80 transition-all text-center"
            >
              <span className="text-xl block mb-1.5">🎫</span>
              <h3 className="font-semibold text-xs group-hover:text-purple-400 transition-colors">My Bookings</h3>
            </div>
            <div 
              onClick={() => navigate('/admin')} 
              className="group bg-slate-900/50 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-yellow-500/40 hover:bg-slate-900/80 transition-all text-center"
            >
              <span className="text-xl block mb-1.5">⚙️</span>
              <h3 className="font-semibold text-xs group-hover:text-yellow-400 transition-colors">Admin</h3>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
