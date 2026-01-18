import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { adminMovies } from '../data/adminMovies';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]); // State for Cast
  const [loading, setLoading] = useState(true);
  
  // Rating State
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const API_KEY = import.meta.env.VITE_TMDB_KEY;
  const category = location.state?.category || (adminMovies.find(m => m.id === id) ? 'now_showing' : 'other');

  useEffect(() => {
    const adminMovie = adminMovies.find(m => m.id === id);
    if (adminMovie) {
      setMovie({ ...adminMovie, type: 'admin', ott: 'Cinema Hall' });
      // Mock Nepali Cast for Admin movies
      setCast([
        { name: 'Dayahang Rai', character: 'Maila', profile_path: null },
        { name: 'Upasana Singh', character: 'Saru', profile_path: null },
        { name: 'Saugat Malla', character: 'Bhasme', profile_path: null }
      ]);
      setLoading(false);
    } else {
      // Fetch movie details + Cast + OTT
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=credits,watch/providers`)
        .then(res => res.json())
        .then(data => {
          const providers = data['watch/providers']?.results?.US?.flatrate || [];
          setMovie({ ...data, type: 'api', ott: providers[0]?.provider_name || 'Netflix' });
          setCast(data.credits?.cast?.slice(0, 10) || []); // Get top 10 cast members
          setLoading(false);
        });
    }
  }, [id, API_KEY]);

  if (loading || !movie) return <div className="bg-[#0b1121] min-h-screen"></div>;

  return (
    <div className="min-h-screen bg-[#0b1121] text-white pb-20 scale-[0.98] origin-top transition-transform">
      
      {/* HERO SECTION */}
      <div className="relative h-[55vh] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : movie.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-[#0b1121]/60 to-transparent"></div>
        </div>
        <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row justify-between items-end gap-6 max-w-6xl mx-auto">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-2xl">{movie.title}</h1>
            {category === 'now_showing' ? (
              <button onClick={() => navigate(`/showtimes/${movie.id}`)} className="bg-red-600 hover:bg-red-700 text-white px-10 py-3 rounded-full font-black text-lg shadow-xl transition-all">
                Book Tickets Now
              </button>
            ) : (
              <div className="flex gap-3">
                 <button className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full font-bold text-sm">Watch Trailer</button>
                 <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm">Discussion</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* SYNOPSIS */}
          <section>
            <h2 className="text-sm font-black mb-4 text-red-500 uppercase tracking-[0.3em]">Synopsis</h2>
            <p className="text-slate-400 text-base leading-relaxed text-pretty">
              {movie.overview || movie.description || "Story details coming soon."}
            </p>
          </section>

         {/* CAST & CREW SECTION */}
<section className="mt-10">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em]">
      Cast & Crew
    </h2>
    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
      {cast.length} Members
    </span>
  </div>

  {/* Scroll Container with scrollbar-hide */}
  <div className="flex overflow-x-auto gap-8 pb-4 scrollbar-hide snap-x">
    {cast.map((person, index) => (
      <div 
        key={index} 
        className="min-w-[90px] md:min-w-[110px] text-center snap-start group cursor-pointer"
      >
        {/* Profile Image Circle */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-slate-800 group-hover:border-red-600 transition-colors duration-300"></div>
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 shadow-xl">
            {person.profile_path ? (
              <img 
                src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                alt={person.name} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-500 font-black text-xl">
                {person.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Name & Character */}
        <div className="space-y-0.5">
          <h4 className="text-[11px] font-black text-white truncate group-hover:text-red-500 transition-colors">
            {person.name}
          </h4>
          <p className="text-[10px] text-slate-500 font-medium truncate italic">
            {person.character || 'Lead Actor'}
          </p>
        </div>
      </div>
    ))}
  </div>
</section>

          {/* USER RATING FRONTEND */}
          <section className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl">
            <h2 className="text-sm font-black mb-2 text-white uppercase tracking-[0.2em]">Your Rating</h2>
            <p className="text-xs text-slate-500 mb-6">How would you rate this movie?</p>
            
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setUserRating(star)}
                  className="transition-transform active:scale-90"
                >
                  <svg 
                    className={`w-10 h-10 ${(hoverRating || userRating) >= star ? 'text-yellow-500' : 'text-slate-700'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              {userRating > 0 && (
                <span className="ml-4 text-sm font-bold text-yellow-500 animate-pulse">
                  {userRating}/5 Stars!
                </span>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: INFO BOX */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm sticky top-24">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Movie Details</h3>
            <div className="space-y-4">
              {category === 'now_showing' && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Status</span>
                  <span className="text-xs font-black px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20 uppercase tracking-tighter">Available</span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400">Genre</span>
                <span className="text-xs font-bold text-right max-w-[150px]">
                  {movie.genres?.map(g => g.name).join(', ') || movie.genre}
                </span>
              </div>
              {category !== 'now_showing' && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Streaming On</span>
                  <span className="text-xs font-bold text-cyan-400">{movie.ott}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">Avg Rating</span>
                <span className="text-xs font-bold text-yellow-500">★ {movie.vote_average?.toFixed(1) || movie.rating}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MovieDetails;