import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; 

const MovieCard = ({ movie, showBooking = false }) => {
  const navigate = useNavigate();

  if (!movie) return <div className="movie-card shadow">Loading...</div>;

  // Determine if booking should be shown
  const canBook = showBooking || movie.source === 'theatre' || movie.isNowPlaying;

  return (
    <div className="movie-card">
      <img 
        src={movie.image || 'https://via.placeholder.com/300x450'} 
        alt={movie.title} 
        className="movie-card-img" 
      />
      <div className="movie-card-info">
        <h3>{movie.title}</h3>
        <p className="movie-genre">{movie.genre}</p>
        <div className="movie-rating">
          {'★'.repeat(Math.floor(movie.rating || 0))}
        </div>
        
        {/* Buttons Container */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {/* Primary Action Button */}
          {canBook ? (
            <Link 
              to={`/details/movie/${movie.id}`} 
              state={{ isNowShowing: true }}
              className="book-btn px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-semibold transition-colors"
            >
              Book Now
            </Link>
          ) : (
            <Link 
              to={`/details/movie/${movie.id}`} 
              state={{ isNowShowing: false }}
              className="details-btn px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-semibold transition-colors"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;


