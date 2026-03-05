import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; 

const MovieCard = ({ movie, showBooking = false }) => {
  const navigate = useNavigate();

  if (!movie) return <div className="movie-card shadow">Loading...</div>;

  const canBook = showBooking || movie.source === 'theatre' || movie.isNowPlaying;

  return (
    <div className="group cursor-pointer" onClick={() => navigate(`/details/movie/${movie.id}`)}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2.5 border border-slate-800/50 group-hover:border-cyan-500/40 shadow-lg shadow-black/20 group-hover:shadow-cyan-500/10 transition-all duration-300">
        <img 
          src={movie.image || 'https://via.placeholder.com/300x450'} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
        

        
        {/* Bottom info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          {canBook ? (
            <Link 
              to={`/details/movie/${movie.id}`} 
              state={{ isNowShowing: true }}
              onClick={e => e.stopPropagation()}
              className="block w-full text-center bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg"
            >
              Book Now
            </Link>
          ) : (
            <span className="block text-center text-xs text-cyan-400 font-medium">View Details</span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">{movie.title}</h3>
      <p className="text-xs text-slate-500 mt-0.5">{movie.genre || movie.year}</p>
    </div>
  );
};

export default MovieCard;


