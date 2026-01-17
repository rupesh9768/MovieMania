import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ShowtimeSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  // Static data matching your UI mockup (Figure 27)
  const halls = [
    { id: 1, name: "Hall 1", time: "2:30 PM", price: 12.00, available: 48 },
    { id: 2, name: "Hall 2", time: "5:45 PM", price: 15.00, available: 27 },
    { id: 3, name: "Hall 3", time: "9:00 PM", price: 10.00, available: 64 }
  ];

  const handleContinue = () => {
    if (selectedShowtime) {
      const selectedHall = halls.find(h => h.id === selectedShowtime);

      // 2. Navigate AND pass the data (state)
      navigate(`/seat-selection/${id}/${selectedShowtime}`, { 
        state: { 
          movieTitle: "Avengers: Doomsday",
          time: selectedHall.time,
          hall: selectedHall.name,
          price: selectedHall.price 
        } 
      });
    } else {
      alert("Please select a showtime first!");
    }
  };

  return (
    <div className="movies-section">
      <div className="section-header">
        <h2>Neon Horizon - Select Showtime</h2>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {['Today', 'Tue 12', 'Wed 13', 'Thu 14'].map((date) => (
          <button key={date} className="nav-btn login-btn" style={{ padding: '10px 20px' }}>{date}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {halls.map((hall) => (
          <div 
            key={hall.id} 
            className={`movie-card ${selectedShowtime === hall.id ? 'selected-hall' : ''}`}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px', 
              width: '100%',
              cursor: 'pointer',
              borderColor: selectedShowtime === hall.id ? 'var(--btn-green)' : '#333'
            }}
            onClick={() => setSelectedShowtime(hall.id)}
          >
            <div>
              <h4 style={{ color: 'var(--primary-gold)' }}>{hall.name}</h4>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{hall.time}</p>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>Available Seats: {hall.available}</p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>${hall.price.toFixed(2)}</p>
              <button className={selectedShowtime === hall.id ? 'book-now-btn' : 'details-btn'}>
                {selectedShowtime === hall.id ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        className="book-now-btn" 
        style={{ width: '100%', marginTop: '30px', backgroundColor: 'var(--primary-gold)', color: 'black' }}
        onClick={handleContinue}
      >
        Continue to Seat Selection
      </button>
    </div>
  );
};

export default ShowtimeSelection;