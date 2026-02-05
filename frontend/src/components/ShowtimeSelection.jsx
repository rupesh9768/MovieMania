import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { backendApi } from '../api';

// INLINE MOCK DATA: Showtimes (replace with API call when backend is ready)
const MOCK_SHOWTIMES = [
  { id: 'show-1', time: '10:30 AM', hallName: 'Hall A - Standard', availableSeats: 45, price: 350 },
  { id: 'show-2', time: '1:15 PM', hallName: 'Hall B - Premium', availableSeats: 32, price: 450 },
  { id: 'show-3', time: '4:00 PM', hallName: 'Hall A - Standard', availableSeats: 60, price: 350 },
  { id: 'show-4', time: '7:30 PM', hallName: 'Hall C - IMAX', availableSeats: 28, price: 600 },
  { id: 'show-5', time: '10:00 PM', hallName: 'Hall B - Premium', availableSeats: 50, price: 450 },
];

const ShowtimeSelection = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState(null);

  // Generate next 7 days for date selection
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      full: date.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Find movie details from backend API
      try {
        const movieData = await backendApi.getBackendMovieById(movieId);
        setMovie(movieData);
      } catch (err) {
        console.error('Failed to fetch movie:', err);
        setMovie(null);
      }
      
      // TODO: Fetch showtimes from API when backend is ready
      // const res = await fetch(`/api/showtimes?movieId=${movieId}`);
      // const data = await res.json();
      // setShowtimes(data);
      
      // For now, use mock data
      setShowtimes(MOCK_SHOWTIMES);
      setLoading(false);
    };
    
    loadData();
  }, [movieId]);

  const handleContinue = () => {
    if (selectedShowtime) {
      const selectedHall = showtimes.find(h => h.id === selectedShowtime);

      navigate(`/seat-selection/${movieId}/${selectedShowtime}`, { 
        state: { 
          movieTitle: movie?.title || "Movie",
          time: selectedHall.time,
          hall: selectedHall.hallName || selectedHall.name,
          price: selectedHall.price,
          date: dates[selectedDate].full
        } 
      });
    } else {
      alert("Please select a showtime first!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading showtimes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1121] text-white pt-8 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-2"
          >
            ← Back to Movie
          </button>
          <h1 className="text-3xl font-black mb-2">{movie?.title || 'Select Showtime'}</h1>
          <p className="text-slate-400">Choose your preferred date and time</p>
        </div>

        {/* Date Selection */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Select Date</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {dates.map((d, index) => (
              <button 
                key={index}
                onClick={() => setSelectedDate(index)}
                className={`flex flex-col items-center min-w-[70px] py-3 px-4 rounded-xl transition-all ${
                  selectedDate === index 
                    ? 'bg-cyan-500 text-black' 
                    : 'bg-slate-900 border border-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="text-xs font-bold uppercase">{d.day}</span>
                <span className="text-2xl font-black">{d.date}</span>
                <span className="text-xs opacity-70">{d.month}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Showtimes Grid */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Available Shows</h2>
          <div className="space-y-4">
            {showtimes.map((show) => (
              <div 
                key={show.id} 
                onClick={() => setSelectedShowtime(show.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedShowtime === show.id 
                    ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {/* Time */}
                    <div className="text-center min-w-[80px]">
                      <p className="text-2xl font-black">{show.time}</p>
                    </div>
                    
                    {/* Divider */}
                    <div className="h-12 w-[1px] bg-slate-700"></div>
                    
                    {/* Hall Info */}
                    <div>
                      <h4 className={`font-bold ${selectedShowtime === show.id ? 'text-cyan-400' : 'text-white'}`}>
                        {show.hallName || show.name}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {show.availableSeats || show.available} seats available
                      </p>
                    </div>
                  </div>
                  
                  {/* Price & Select */}
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Price</p>
                      <p className="text-xl font-black text-cyan-400">NPR {show.price}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedShowtime === show.id 
                        ? 'border-cyan-500 bg-cyan-500' 
                        : 'border-slate-600'
                    }`}>
                      {selectedShowtime === show.id && (
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <button 
          onClick={handleContinue}
          disabled={!selectedShowtime}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            selectedShowtime 
              ? 'bg-cyan-500 hover:bg-cyan-400 text-black' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Continue to Seat Selection
        </button>
        
      </div>
    </div>
  );
};

export default ShowtimeSelection;