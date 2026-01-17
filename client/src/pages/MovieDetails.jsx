import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Static data based on your UI mockup (Figure 26)
  const movie = {
    title: "Avengers: Doomsday",
    tagline: "The future has no limits",
    genre: "Sci-Fi • Action",
    rating: "4.5 (32380 reviews)",
    releaseDate: "2026",
    language: "English",
    description: "Avengers has a new threat now and that is Dr. Doom baby.",
    cast: [
      { name: "Tony Stark", role: "Actor" },
      { name: "Komal Bryam", role: "Actor" },
      { name: "Pedro Pascal", role: "Actor" }
    ],
    showtimes: ["Today 7:30 PM"]
  };

  // Function to handle the transition to the showtime selection step
  const handleBooking = () => {
    navigate(`/showtimes/${id}`);
  };

  return (
    <div className="movies-section">
      <div style={{ display: 'flex', gap: '40px', marginBottom: '40px' }}>
        {/* Movie Poster */}
        <div style={{ flex: '1', maxWidth: '300px' }}>
          <img 
            src="https://via.placeholder.com/300x450" 
            alt={movie.title} 
            className="movie-card-img"
            style={{ borderRadius: '12px' }}
          />
        </div>

        {/* Info Content */}
        <div style={{ flex: '2' }}>
          <h1 style={{ fontSize: '3rem', color: 'var(--primary-gold)' }}>{movie.title}</h1>
          <p className="movie-genre" style={{ fontSize: '1.2rem' }}>{movie.tagline}</p>
          <div className="movie-rating" style={{ margin: '15px 0' }}>★ {movie.rating}</div>
          <p style={{ marginBottom: '20px' }}>{movie.genre} | {movie.releaseDate} | {movie.language}</p>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Navigates to the showtime selection page per your flowchart */}
            <button className="book-now-btn" onClick={handleBooking}>
              Book Tickets
            </button>
            <button className="nav-btn login-btn">Add to Watchlist</button>
          </div>
        </div>
      </div>

      {/* Trailer Section placeholder */}
      <div style={{ marginBottom: '40px' }}>
        <h3>Trailer</h3>
        <div style={{ 
          width: '100%', 
          height: '400px', 
          backgroundColor: '#222', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          borderRadius: '12px',
          marginTop: '15px',
          cursor: 'pointer'
        }}>
          <span style={{ fontSize: '3rem' }}>▶</span>
        </div>
      </div>

      {/* Cast & Crew Section */}
      <div style={{ marginBottom: '40px' }}>
        <h3>Cast & Crew</h3>
        <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
          {movie.cast.map((member, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: '#333', 
                marginBottom: '10px',
                border: '1px solid #444' 
              }}></div>
              <p style={{ fontSize: '0.9rem' }}>{member.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;