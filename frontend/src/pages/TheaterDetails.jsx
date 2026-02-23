import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { backendApi } from '../api';
import CommentSection from '../components/CommentSection';

// Theater movie details page with booking
const TheaterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [movie, setMovie] = useState(location.state?.movie || null);
  const [loading, setLoading] = useState(!location.state?.movie);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimesLoading, setShowtimesLoading] = useState(true);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });


  useEffect(() => {
    const fetchMovie = async () => {
      if (!movie) {
        try {
          setLoading(true);
          const data = await backendApi.getBackendMovieById(id);
          if (data) setMovie(data);
        } catch (err) {
          console.error('Failed to fetch movie:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchMovie();
  }, [id, movie]);

  // Fetch showtimes from backend
  useEffect(() => {
    const fetchShowtimes = async () => {
      setShowtimesLoading(true);
      try {
        const data = await backendApi.getMovieShowtimes(id);
        setShowtimes(data || []);
      } catch (err) {
        console.error('Failed to fetch showtimes:', err);
        setShowtimes([]);
      } finally {
        setShowtimesLoading(false);
      }
    };
    fetchShowtimes();
  }, [id]);

  // Filter showtimes for selected date
  const selectedDateStr = dates[selectedDate].toISOString().split('T')[0];
  const filteredShowtimes = showtimes.filter(st => {
    const stDate = new Date(st.date).toISOString().split('T')[0];
    return stDate === selectedDateStr;
  });


  const handleProceedToSeats = () => {
    if (selectedTime === null) {
      alert('Please select a showtime');
      return;
    }
    
    const selected = filteredShowtimes[selectedTime];
    navigate(`/booking/${id}`, {
      state: {
        movie,
        date: dates[selectedDate].toISOString(),
        time: selected.time,
        hall: selected.hall,
        price: selected.price
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-4">Movie Not Found</h1>
        <button onClick={() => navigate('/theater')} className="text-red-400 hover:underline">
          Back to Theater
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      
      {/* Hero Section with Backdrop */}
      <section className="relative h-[40vh] min-h-75 overflow-hidden">
        {/* Background */}
        {movie.backdrop ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${movie.backdrop})` }}
          />
        ) : movie.poster ? (
          <div 
            className="absolute inset-0 bg-cover bg-center blur-md"
            style={{ backgroundImage: `url(${movie.poster})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-red-900/40 to-slate-900" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-dark-bg via-dark-bg/80 to-dark-bg/50"></div>
        <div className="absolute inset-0 bg-linear-to-t from-dark-bg via-transparent to-transparent"></div>
        
        {/* Content */}
        <div className="relative h-full max-w-6xl mx-auto px-6 flex items-end pb-8">
          <div className="flex gap-6 items-end">
            {/* Poster */}
            {movie.poster && (
              <img 
                src={movie.poster} 
                alt={movie.title}
                className="hidden md:block w-40 rounded-lg shadow-2xl border-2 border-slate-700/50"
              />
            )}
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  NOW SHOWING
                </span>
                {movie.rating > 0 && (
                  <span className="bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded-full">
                    ★ {movie.rating.toFixed(1)}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black mb-2">{movie.title}</h1>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span>{movie.language?.toUpperCase() || 'NE'}</span>
                {movie.runtime > 0 && (
                  <>
                    <span>•</span>
                    <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                  </>
                )}
                {movie.genres?.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{movie.genres.slice(0, 3).join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left: Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Synopsis */}
            <div>
              <h2 className="text-lg font-bold mb-3">Synopsis</h2>
              <p className="text-slate-400 leading-relaxed">
                {movie.description || movie.overview || 'No description available.'}
              </p>
            </div>
            
            {/* Select Date */}
            <div>
              <h2 className="text-lg font-bold mb-3">Select Date</h2>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {dates.map((date, idx) => {
                  const isToday = idx === 0;
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => { setSelectedDate(idx); setSelectedTime(null); }}
                      className={`shrink-0 w-20 py-3 rounded-xl text-center transition-all border ${
                        selectedDate === idx
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <p className="text-xs font-medium">{isToday ? 'Today' : dayName}</p>
                      <p className="text-xl font-bold">{dayNum}</p>
                      <p className="text-xs">{month}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Select Showtime */}
            <div>
              <h2 className="text-lg font-bold mb-3">Select Showtime</h2>
              {showtimesLoading ? (
                <p className="text-slate-500 text-sm">Loading showtimes...</p>
              ) : filteredShowtimes.length === 0 ? (
                <p className="text-slate-500 text-sm">No showtimes available for this date.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {filteredShowtimes.map((st, idx) => (
                    <button
                      key={st._id || idx}
                      onClick={() => setSelectedTime(idx)}
                      className={`py-3 px-6 rounded-xl text-sm font-medium transition-all border ${
                        selectedTime === idx
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <span className="block">{st.time}</span>
                      <span className="block text-xs mt-1 opacity-70">{st.hall} - NPR {st.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right: Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-6 sticky top-28">
              <h3 className="text-lg font-bold mb-4">Booking Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Movie</span>
                  <span className="font-medium">{movie.title}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Date</span>
                  <span className="font-medium">
                    {dates[selectedDate].toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Time</span>
                  <span className="font-medium">
                    {selectedTime !== null && filteredShowtimes[selectedTime]
                      ? filteredShowtimes[selectedTime].time
                      : 'Not selected'}
                  </span>
                </div>
                
                <div className="border-t border-slate-700 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hall</span>
                    <span className="font-medium text-red-400">
                      {selectedTime !== null && filteredShowtimes[selectedTime]
                        ? filteredShowtimes[selectedTime].hall
                        : '-'}
                    </span>
                  </div>
                </div>

                {selectedTime !== null && filteredShowtimes[selectedTime] && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Price</span>
                    <span className="font-medium text-cyan-400">NPR {filteredShowtimes[selectedTime].price}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleProceedToSeats}
                disabled={selectedTime === null}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  selectedTime !== null
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {selectedTime !== null ? 'Select Seats' : 'Select a Showtime'}
              </button>

              <button
                onClick={() => navigate('/theater')}
                className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Back to Theater
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comment Section */}
      {movie && (
        <div className="max-w-6xl mx-auto px-6">
          <CommentSection
            contentId={String(id)}
            contentType="theater"
            contentTitle={movie.title}
          />
        </div>
      )}
    </div>
  );
};

export default TheaterDetails;



