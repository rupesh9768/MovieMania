import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { NO_POSTER_IMAGE, handleImageError } from '../utils/imageFallback';

const MovieCard = ({ movie, showBooking = false }) => {
  const navigate = useNavigate();

  if (!movie) return <div className="movie-card shadow">Loading...</div>;

  const movieStatus = movie.status || (movie.isNowPlaying ? 'now_playing' : (movie.source === 'theatre' ? 'coming_soon' : null));
  const canBook = showBooking || movie.source === 'theatre' || movieStatus === 'now_playing' || movie.isNowPlaying;

  return (
    <div className="group cursor-pointer" onClick={() => navigate(`/details/movie/${movie.id}`)}>
      <div className="relative aspect-2/3 rounded-[14px] overflow-hidden mb-3 border border-[#2a2a2a] bg-card-bg group-hover:border-[#3a3a3a] shadow-sm group-hover:shadow-lg transition-all duration-150 group-hover:-translate-y-1">
        <img 
          src={movie.image || NO_POSTER_IMAGE} 
          alt={movie.title} 
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-150" 
          onError={handleImageError}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-150"></div>

        {/* Status Badge */}
        {movieStatus === 'now_playing' && (
          <div className="absolute top-2 left-2">
            <span className="bg-cyan-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">NOW SHOWING</span>
          </div>
        )}
        {movieStatus === 'coming_soon' && (
          <div className="absolute top-2 left-2">
            <span className="bg-amber-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">COMING SOON</span>
          </div>
        )}
        
        {/* Bottom info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-1.5 group-hover:translate-y-0">
          {canBook ? (
            <Link 
              to={`/details/movie/${movie.id}`} 
              state={{ isNowShowing: true }}
              onClick={e => e.stopPropagation()}
              className="block w-full text-center bg-[#E50914] hover:bg-[#c40812] px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150"
            >
              Book Now
            </Link>
          ) : (
            <span className="block text-center text-xs text-white font-medium">View Details</span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-sm truncate text-white transition-colors">{movie.title}</h3>
      <p className="text-xs text-[#b3b3b3] mt-0.5">{movie.genre || movie.year}</p>
    </div>
  );
};

export default MovieCard;


