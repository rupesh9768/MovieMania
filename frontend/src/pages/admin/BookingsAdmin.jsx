import React, { useEffect, useState } from 'react';
import { backendApi } from '../../api';

const BookingsAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await backendApi.getAdminBookings();
        setBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black">Bookings</h2>
        <p className="text-slate-400 text-sm mt-1">All customer bookings from backend</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl border border-slate-800 bg-slate-900/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/70 text-slate-300">
                  <th className="p-3 text-left">Movie</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Seats</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-500">No bookings available</td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking._id} className="border-t border-slate-800 text-slate-200">
                      <td className="p-3">{booking.movieTitle || 'Unknown Movie'}</td>
                      <td className="p-3">{booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'} {booking.time || ''}</td>
                      <td className="p-3">{Array.isArray(booking.seats) ? booking.seats.join(', ') : 'N/A'}</td>
                      <td className="p-3">NPR {Number(booking.totalPrice || booking.totalAmount || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${booking.status === 'booked' || booking.status === 'confirmed' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-300'}`}>
                          {booking.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsAdmin;
