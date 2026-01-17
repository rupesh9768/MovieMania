import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; 

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  if (!movie) return <div className="movie-card shadow">Loading...</div>;

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
        <div className="flex gap-2 mt-4"> 
            
            {/* LINK 1: View Details */}
            <Link to={`/movie/${movie.id}`} className="details-btn px-4 py-2 bg-gray-700 rounded text-sm hover:bg-gray-600">
                Book Now
            </Link>

        </div>

      </div>
    </div>
  );
};

export default MovieCard;