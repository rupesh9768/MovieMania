import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../api/bookingService';
import { useAuth } from '../context/AuthContext';
import BookingTicket from '../components/BookingTicket';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const BookingHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const data = await getMyBookings();
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

  const isUpcoming = (booking) => {
    if (booking.status === 'cancelled') return false;
    try {
      const d = new Date(booking.date);
      if (isNaN(d.getTime())) return false;
      const dateStr = d.toISOString().split('T')[0];
      const combined = new Date(`${dateStr} ${booking.time || '23:59'}`);
      return combined > new Date();
    } catch { return false; }
  };

  const filtered = useMemo(() => {
    if (activeTab === 'all') return bookings;
    if (activeTab === 'cancelled') return bookings.filter(b => b.status === 'cancelled');
    if (activeTab === 'upcoming') return bookings.filter(b => isUpcoming(b));
    if (activeTab === 'past') return bookings.filter(b => !isUpcoming(b) && b.status !== 'cancelled');
    return bookings;
  }, [bookings, activeTab]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled', canCancel: false } : b));
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const statusColor = (status) => {
    if (status === 'reserved') return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
    if (status === 'booked') return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (status === 'cancelled') return 'text-red-400 bg-red-500/10 border-red-500/30';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  const formatShowtime = (date, time) => {
    const parsedDate = new Date(date);
    const dateLabel = isNaN(parsedDate.getTime())
      ? (date || '-')
      : parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { dateLabel, time: time || '-' };
  };

  const getPosterUrl = (poster) => {
    if (!poster) return '';
    if (poster.startsWith('http')) return poster;
    return `${TMDB_IMAGE_BASE}${poster}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-4 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Back
          </button>
          <h1 className="text-2xl font-black">Booking History</h1>
          <p className="text-slate-500 text-sm mt-1">View your past and upcoming bookings</p>
        </div>

        {/* Tabs */}
        {user && !loading && bookings.length > 0 && (
          <div className="flex gap-1 mb-6 bg-slate-900/60 rounded-lg p-1 w-fit">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-red-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Sign In Required</h3>
            <p className="text-slate-500 text-sm mb-6">Please sign in to view your booking history.</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full text-sm transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Empty State */}
        {user && !loading && bookings.length === 0 && !error && (
          <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M7 4v16M17 4v16M3 8h4M3 12h18M3 16h4M17 8h4M17 16h4M3 4h18v16H3z" /></svg>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Bookings Yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Your booking history will appear here once you book a movie ticket.
            </p>
            <button
              onClick={() => navigate('/movies')}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full text-sm transition-all cursor-pointer"
            >
              Browse Movies
            </button>
          </div>
        )}

        {/* Filtered empty */}
        {user && !loading && bookings.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm">
            No {activeTab} bookings found.
          </div>
        )}

        {/* Bookings List */}
        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const showtime = formatShowtime(booking.date, booking.time);
              return (
                <div
                  key={booking._id}
                  className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 hover:border-red-500/20 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Poster */}
                    <div className="shrink-0">
                      {booking.moviePoster ? (
                        <img
                          src={getPosterUrl(booking.moviePoster)}
                          alt={booking.movieTitle}
                          className="w-20 h-28 object-cover rounded-lg border border-slate-700/50"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="w-20 h-28 rounded-lg border border-slate-700/50 bg-slate-800 items-center justify-center" style={{ display: booking.moviePoster ? 'none' : 'flex' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M7 4v16M17 4v16M3 8h4M3 12h18M3 16h4M17 8h4M17 16h4M3 4h18v16H3z" /></svg>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white truncate">{booking.movieTitle}</h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${statusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m2 0l7-3 7 3" /></svg>
                          {booking.hall}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                          {showtime.dateLabel}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                          {showtime.time}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                          <span className="text-red-400 font-medium">{booking.seats?.sort().join(', ')}</span>
                        </div>
                      </div>

                      {/* Footer row */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          {new Date(booking.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </span>
                        {booking.paymentMethod && (
                          <span className="capitalize">Paid via {booking.paymentMethod}</span>
                        )}
                        <span className="text-[11px] font-mono text-slate-600">#{booking._id?.slice(-8)}</span>
                      </div>
                    </div>

                    {/* Price & Cancel */}
                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                      <span className="text-xl font-bold text-white">NPR {booking.totalPrice}</span>
                      {booking.status === 'booked' && (
                        <button
                          onClick={() => setSelectedTicket(booking)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500/10 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          Ticket
                        </button>
                      )}
                      {(booking.status === 'booked' || booking.status === 'reserved') && booking.canCancel && (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          disabled={cancellingId === booking._id}
                          className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute -top-10 right-0 text-slate-400 hover:text-white transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <BookingTicket
              bookingResult={selectedTicket}
              movieMeta={{
                title: selectedTicket.movieTitle,
                poster: selectedTicket.moviePoster || '',
                hall: selectedTicket.hall,
              }}
              showtimeLabel={(() => {
                const d = new Date(selectedTicket.date);
                const dateLabel = isNaN(d.getTime())
                  ? (selectedTicket.date || '')
                  : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                return `${dateLabel} • ${selectedTicket.time || ''}`;
              })()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;



