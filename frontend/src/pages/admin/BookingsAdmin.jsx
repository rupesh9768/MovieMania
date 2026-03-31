import React, { useEffect, useState, useMemo } from 'react';
import { backendApi } from '../../api';

// Mini seat map modal to view booked/available seats per showtime
const SeatMapModal = ({ movieId, showtimeId, hallName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [seatData, setSeatData] = useState(null);
  const [layout, setLayout] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await backendApi.getShowtimeSeatMap(movieId, showtimeId);
        setSeatData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load seat map');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [movieId, showtimeId]);

  const seatMap = seatData?.seatMap || {};
  const seatLabels = Object.keys(seatMap);

  // Build a simple grid from seat labels (A1, A2, B1, etc.)
  const gridInfo = useMemo(() => {
    if (seatLabels.length === 0) return null;

    // Include all possible seats (booked ones are in seatMap)
    // We'll show a 10x10 default grid and mark booked ones
    const allSeats = {};
    seatLabels.forEach((label) => {
      allSeats[label] = seatMap[label];
    });

    let maxRow = 0;
    let maxCol = 0;
    Object.keys(allSeats).forEach((label) => {
      const match = label.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const r = match[1].charCodeAt(0) - 65;
        const c = parseInt(match[2], 10);
        if (r > maxRow) maxRow = r;
        if (c > maxCol) maxCol = c;
      }
    });

    // Ensure minimum grid
    maxRow = Math.max(maxRow, 9);
    maxCol = Math.max(maxCol, 10);

    return { maxRow, maxCol, seats: allSeats };
  }, [seatLabels, seatMap]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Seat Booking Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">Hall: {hallName || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center text-slate-500">Loading seat map...</div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>
        ) : seatLabels.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No seats booked for this showtime yet.</div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/40 border border-red-400/50"></div>
                <span className="text-slate-300">Booked ({seatLabels.filter((s) => seatMap[s]?.status === 'booked' || seatMap[s]?.status === 'confirmed').length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500/40 border border-amber-400/50"></div>
                <span className="text-slate-300">Reserved ({seatLabels.filter((s) => seatMap[s]?.status === 'reserved').length})</span>
              </div>
            </div>

            {/* Seat list */}
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/70 text-slate-400 text-left">
                    <th className="p-2.5">Seat</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">User</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Booked At</th>
                  </tr>
                </thead>
                <tbody>
                  {seatLabels.sort().map((seat) => {
                    const info = seatMap[seat];
                    const isBooked = info?.status === 'booked' || info?.status === 'confirmed';
                    return (
                      <tr key={seat} className="border-t border-slate-800/70">
                        <td className="p-2.5 font-bold text-white">{seat}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            isBooked ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {info?.status || 'unknown'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300">{info?.user?.name || '--'}</td>
                        <td className="p-2.5 text-slate-400 text-xs">{info?.user?.email || '--'}</td>
                        <td className="p-2.5 text-slate-500 text-xs">
                          {info?.bookedAt ? new Date(info.bookedAt).toLocaleString() : '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BookingsAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [seatMapTarget, setSeatMapTarget] = useState(null);

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

  const filtered = useMemo(() => {
    let list = [...bookings];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.movieTitle || '').toLowerCase().includes(q) ||
          (b.userName || '').toLowerCase().includes(q) ||
          (b.userEmail || '').toLowerCase().includes(q) ||
          (b.hall || '').toLowerCase().includes(q) ||
          (b.seats || []).some((s) => s.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter);
    }

    if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === 'amount') list.sort((a, b) => (b.totalPrice || b.totalAmount || 0) - (a.totalPrice || a.totalAmount || 0));

    return list;
  }, [bookings, search, statusFilter, sortBy]);

  const totalRevenue = bookings
    .filter((b) => b.status === 'booked' || b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.totalPrice || b.totalAmount || 0), 0);
  const totalTickets = bookings
    .filter((b) => b.status === 'booked' || b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.seats?.length || 0), 0);

  const statusColors = {
    booked: 'bg-cyan-500/20 text-cyan-300',
    confirmed: 'bg-emerald-500/20 text-emerald-300',
    reserved: 'bg-amber-500/20 text-amber-300',
    cancelled: 'bg-red-500/20 text-red-300'
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'N/A';
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black">Bookings</h2>
        <p className="text-slate-400 text-sm mt-1">All customer bookings with user and seat details</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Total Bookings</p>
          <p className="text-2xl font-black text-cyan-300">{bookings.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Revenue</p>
          <p className="text-2xl font-black text-emerald-300">NPR {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Tickets Sold</p>
          <p className="text-2xl font-black text-amber-300">{totalTickets}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Cancelled</p>
          <p className="text-2xl font-black text-red-300">{bookings.filter((b) => b.status === 'cancelled').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search movie, user, hall, or seat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
        >
          <option value="all">All Status</option>
          <option value="booked">Booked</option>
          <option value="confirmed">Confirmed</option>
          <option value="reserved">Reserved</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount">Highest Amount</option>
        </select>
      </div>

      {/* Table */}
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
                <tr className="bg-slate-800/70 text-slate-400 text-left">
                  <th className="p-3">Movie</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Hall</th>
                  <th className="p-3">Date / Time</th>
                  <th className="p-3">Seats</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-10 text-slate-500">No bookings found</td>
                  </tr>
                ) : (
                  filtered.map((booking) => (
                    <tr key={booking._id} className="border-t border-slate-800/70 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <span className="text-white font-medium truncate block max-w-[160px]">
                          {booking.movieTitle || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-white text-xs font-medium">{booking.userName || '--'}</p>
                          <p className="text-slate-500 text-[11px]">{booking.userEmail || ''}</p>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300 text-xs">{booking.hall || '--'}</td>
                      <td className="p-3 text-slate-300 text-xs">
                        <p>{formatDate(booking.date)}</p>
                        <p className="text-slate-500">{booking.time || ''}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {(booking.seats || []).map((seat) => (
                            <span key={seat} className="px-1.5 py-0.5 rounded bg-slate-700/60 text-[10px] font-bold text-slate-300">{seat}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right text-cyan-300 font-semibold">
                        NPR {Number(booking.totalPrice || booking.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[booking.status] || 'bg-slate-700 text-slate-300'}`}>
                          {booking.status || 'unknown'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSeatMapTarget({ movieId: booking.movieId, showtimeId: booking.showtimeId, hall: booking.hall })}
                          className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition-colors"
                          title="View seat map for this showtime"
                        >
                          Seat Map
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/30 text-xs text-slate-500">
            Showing {filtered.length} of {bookings.length} bookings
          </div>
        </div>
      )}

      {/* Seat map modal */}
      {seatMapTarget && (
        <SeatMapModal
          movieId={seatMapTarget.movieId}
          showtimeId={seatMapTarget.showtimeId}
          hallName={seatMapTarget.hall}
          onClose={() => setSeatMapTarget(null)}
        />
      )}
    </div>
  );
};

export default BookingsAdmin;
