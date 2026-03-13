import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookingsByUserId, cancelBooking } from '../api/bookingService';
import { useAuth } from '../context/AuthContext';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Booking history page — fetches real data from backend
const BookingHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userId = user._id || user.id;
        const data = await getBookingsByUserId(userId);
        setBookings(data);
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setError('Failed to load booking history');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const statusColor = (status) => {
    if (status === 'reserved') return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
    if (status === 'booked') return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (status === 'cancelled') return 'text-red-400 bg-red-500/10 border-red-500/30';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  };

  const formatShowtime = (date, time) => {
    const parsedDate = new Date(date);
    const dateLabel = Number.isNaN(parsedDate.getTime())
      ? (date || '-')
      : parsedDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

    return `${dateLabel} • ${time || '-'}`;
  };

  const getPosterUrl = (poster) => {
    if (!poster) return '';
    if (poster.startsWith('http')) return poster;
    return `${TMDB_IMAGE_BASE}${poster}`;
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-black">Booking History</h1>
          <p className="text-slate-500 text-sm mt-1">View your past and upcoming bookings</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading bookings...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-center mb-6">
            {error}
          </div>
        )}

        {/* Not logged in */}
        {!user && !loading && (
          <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
            <span className="text-4xl mb-4 block">🔒</span>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Sign In Required</h3>
            <p className="text-slate-500 text-sm mb-6">Please sign in to view your booking history.</p>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full text-sm transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Empty State */}
        {user && !loading && bookings.length === 0 && !error && (
          <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
            <span className="text-4xl mb-4 block">🎬</span>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Bookings Yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Your booking history will appear here once you book a movie ticket.
            </p>
            <button 
              onClick={() => navigate('/movies')}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full text-sm transition-all cursor-pointer"
            >
              Browse Movies
            </button>
          </div>
        )}

        {/* Bookings List */}
        {bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div 
                key={booking._id} 
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 transition-all shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Movie info */}
                  <div className="flex-1 flex gap-4">
                    <div className="shrink-0">
                      {booking.moviePoster ? (
                        <img
                          src={getPosterUrl(booking.moviePoster)}
                          alt={booking.movieTitle}
                          className="w-20 h-28 object-cover rounded-xl border border-slate-700 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-28 rounded-xl border border-slate-700 bg-slate-800" />
                      )}
                    </div>

                    <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-white">{booking.movieTitle}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold capitalize ${statusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-400">
                      <div>
                        <span className="text-slate-500 block text-xs">Hall</span>
                        {booking.hall}
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs">Showtime</span>
                        {formatShowtime(booking.date, booking.time)}
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs">Seats</span>
                        <span className="text-cyan-400">{booking.seats?.sort().join(', ')}</span>
                      </div>
                    </div>
                    </div>
                  </div>

                  {/* Right: Price & Actions */}
                  <div className="text-right flex sm:flex-col items-center sm:items-end gap-3">
                    <span className="text-2xl font-black text-green-400">NPR {booking.totalPrice}</span>
                    {(booking.status === 'booked' || booking.status === 'reserved') && booking.canCancel && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="text-xs text-red-300 border border-red-500/40 px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        {cancellingId === booking._id ? 'Cancelling...' : booking.status === 'reserved' ? 'Cancel Reservation' : 'Cancel Booking'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Booking date */}
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-500">
                  Booked on {new Date(booking.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                  {booking.paymentMethod && ` • Paid via ${booking.paymentMethod}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;



