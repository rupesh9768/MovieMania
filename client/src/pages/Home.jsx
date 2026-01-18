import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminMovies } from '../data/adminMovies';

const Home = () => {
  const navigate = useNavigate();
  const [globallyShowing, setGloballyShowing] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [randomMovies, setRandomMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_KEY = import.meta.env.VITE_TMDB_KEY;

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // 1. Fetch "Now Playing" for Theater + Globally Showing
        const nowPlayingRes = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&region=IN`);
        const nowPlayingData = await nowPlayingRes.json();
        
        // Globally Showing (World hits)
        setGloballyShowing(nowPlayingData.results.slice(0, 8));

        // 2. Fetch Global Trending
        const trendRes = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`);
        const trendData = await trendRes.json();
        setTrendingMovies(trendData.results.slice(0, 10));

        // 3. Fetch Random (Just 3 as requested)
        const randomRes = await fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&page=3`);
        const randomData = await randomRes.json();
        setRandomMovies(randomData.results.slice(0, 3));

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchHomeData();
  }, [API_KEY]);

  if (loading) return <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0b1121] text-white pb-20 scale-[0.98] origin-top">
      
      <div className="max-w-6xl mx-auto px-4">
        
        {/* SECTION 1: THEATER EXCLUSIVE (Currently Airing in MY Theater) */}
        <section className="pt-20">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-2 h-8 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]"></span>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Currently Airing in Theater</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* We combine Admin Movies + top 3 from API as "Airing" */}
            {[...adminMovies, ...globallyShowing.slice(0, 2)].map((movie) => (
              <div 
                key={movie.id} 
                className="group relative cursor-pointer rounded-2xl overflow-hidden border border-slate-800 hover:border-red-600 transition-all duration-500"
                onClick={() => navigate(`/movie/${movie.id}`, { state: { category: 'now_showing' } })}
              >
                <div className="aspect-video">
                  <img 
                    src={movie.image || `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-transparent to-transparent"></div>
                </div>
                <div className="absolute bottom-5 left-5">
                  <h3 className="text-lg font-bold mb-1">{movie.title}</h3>
                  <p className="text-xs font-black text-red-500 uppercase flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    Book Now
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: GLOBALLY SHOWING (Horizontal) */}
        <section className="mt-20">
          <h2 className="text-sm font-black text-slate-500 mb-6 uppercase tracking-[0.3em]">Globally Showing</h2>
          <div className="flex overflow-x-auto gap-5 pb-6 scrollbar-hide snap-x">
            {globallyShowing.map(movie => (
              <div 
                key={movie.id} 
                className="min-w-[150px] cursor-pointer snap-start" 
                onClick={() => navigate(`/movie/${movie.id}`, { state: { category: 'other' } })}
              >
                <img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} className="rounded-xl shadow-lg hover:-translate-y-2 transition-transform duration-300" alt="" />
                <h4 className="text-[11px] font-bold mt-3 truncate text-slate-400">{movie.title}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: GLOBAL TRENDING */}
        <section className="mt-16">
          <h2 className="text-sm font-black text-slate-500 mb-6 uppercase tracking-[0.3em]">Global Trending</h2>
          <div className="flex overflow-x-auto gap-5 pb-6 scrollbar-hide snap-x">
            {trendingMovies.map(movie => (
              <div 
                key={movie.id} 
                className="min-w-[150px] cursor-pointer snap-start" 
                onClick={() => navigate(`/movie/${movie.id}`, { state: { category: 'other' } })}
              >
                <img src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} className="rounded-xl opacity-70 hover:opacity-100 transition-opacity" alt="" />
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: RANDOM PICKS (Just 3) */}
        <section className="mt-16">
          <h2 className="text-sm font-black text-slate-500 mb-8 uppercase tracking-[0.3em]">Random Picks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {randomMovies.map(movie => (
              <div 
                key={movie.id} 
                className="flex items-center gap-4 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => navigate(`/movie/${movie.id}`, { state: { category: 'other' } })}
              >
                <img src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`} className="w-20 rounded-lg" alt="" />
                <div>
                  <h4 className="text-sm font-black leading-tight mb-1">{movie.title}</h4>
                  <p className="text-[10px] text-slate-500">★ {movie.vote_average.toFixed(1)} Rating</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;