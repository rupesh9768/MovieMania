import React, { useState, useEffect, useMemo } from 'react';
import { backendApi } from '../api';

const rowLabel = (r) => {
  if (r < 26) return String.fromCharCode(65 + r);
  return String.fromCharCode(65 + Math.floor(r / 26) - 1) + String.fromCharCode(65 + (r % 26));
};

const LiveSeatStatus = ({ user }) => {
  const assignedTheaterId = user?.role === 'theater_admin' ? user.assignedTheater : null;
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');
  const [seatMap, setSeatMap] = useState(null);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Layout state
  const [layout, setLayout] = useState(null);

  // Load movies
  useEffect(() => {
    const load = async () => {
      try {
        const data = await backendApi.getBackendMovies();
        setMovies(data || []);
      } catch {
        setMovies([]);
      }
    };
    load();
  }, []);

  // Load showtimes when movie selected — filter by assigned theater for theater_admin
  useEffect(() => {
    if (!selectedMovieId) {
      setShowtimes([]);
      setSelectedShowtimeId('');
      return;
    }
    const load = async () => {
      try {
        let data = await backendApi.getMovieShowtimes(selectedMovieId);
        // Theater admin: only show showtimes for their theater
        if (assignedTheaterId && data) {
          data = data.filter((s) => s.theater === assignedTheaterId || s.theater?._id === assignedTheaterId);
        }
        setShowtimes(data || []);
      } catch {
        setShowtimes([]);
      }
    };
    load();
  }, [selectedMovieId, assignedTheaterId]);

  // Load seat map + layout when showtime selected
  useEffect(() => {
    if (!selectedMovieId || !selectedShowtimeId) {
      setSeatMap(null);
      setLayout(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await backendApi.getShowtimeSeatMap(selectedMovieId, selectedShowtimeId);
        setSeatMap(data.seatMap || {});
        setTotalBookings(data.totalBookings || 0);
      } catch (err) {
        setError('Failed to load seat map');
        setSeatMap(null);
      }

      // Find the showtime to load the theater/hall layout
      const showtime = showtimes.find((s) => s._id === selectedShowtimeId);
      if (showtime?.theater) {
        try {
          const theater = await backendApi.getTheaterById(showtime.theater);
          if (theater?.halls?.length) {
            const hall = theater.halls.find((h) => {
              const fullName = `${h.name} - ${h.type}`;
              return fullName === showtime.hall || h.name === showtime.hall;
            });
            if (hall?.seatLayout?.length > 0) {
              setLayout({ seatLayout: hall.seatLayout, layoutRows: hall.layoutRows, layoutCols: hall.layoutCols });
            } else {
              setLayout(null);
            }
          }
        } catch {
          setLayout(null);
        }
      } else {
        setLayout(null);
      }

      setLoading(false);
    };
    load();
  }, [selectedMovieId, selectedShowtimeId, showtimes]);

  // Build grid from layout
  const grid = useMemo(() => {
    if (!layout) return null;
    const { seatLayout, layoutRows, layoutCols } = layout;
    const g = Array.from({ length: layoutRows }, () =>
      Array.from({ length: layoutCols }, () => ({ type: 'empty', label: '' }))
    );
    seatLayout.forEach((cell) => {
      if (cell.row < layoutRows && cell.col < layoutCols) {
        let type = cell.type || 'empty';
        if (type === 'vip' || type === 'wheelchair') type = 'seat';
        g[cell.row][cell.col] = { type, label: cell.label || '' };
      }
    });
    return g;
  }, [layout]);

  // Stats
  const stats = useMemo(() => {
    if (!grid || !seatMap) return null;
    let total = 0, booked = 0, reserved = 0, available = 0;
    grid.forEach((row) => row.forEach((cell) => {
      if (['seat', 'premium'].includes(cell.type) && cell.label) {
        total++;
        const info = seatMap[cell.label];
        if (info) {
          if (info.status === 'reserved') reserved++;
          else booked++;
        } else {
          available++;
        }
      }
    }));
    const occupancy = total > 0 ? Math.round((booked + reserved) / total * 100) : 0;
    return { total, booked, reserved, available, occupancy };
  }, [grid, seatMap]);

  const selectedShowtime = showtimes.find((s) => s._id === selectedShowtimeId);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-black mb-1">Live Seat Status</h3>
        <p className="text-sm text-slate-400">Select a movie and showtime to view real-time seat occupancy</p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Movie</label>
          <select
            value={selectedMovieId}
            onChange={(e) => { setSelectedMovieId(e.target.value); setSelectedShowtimeId(''); }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Select Movie</option>
            {movies.map((m) => (
              <option key={m._id} value={m._id}>{m.title}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Showtime</label>
          <select
            value={selectedShowtimeId}
            onChange={(e) => setSelectedShowtimeId(e.target.value)}
            disabled={!selectedMovieId || showtimes.length === 0}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select Showtime</option>
            {showtimes.map((s) => (
              <option key={s._id} value={s._id}>
                {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {s.time} — {s.hall}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Stats */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-white">{stats.total}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Seats</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-400">{stats.available}</p>
            <p className="text-[10px] text-emerald-500/70 uppercase tracking-wider">Available</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-red-400">{stats.booked}</p>
            <p className="text-[10px] text-red-500/70 uppercase tracking-wider">Booked</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-amber-400">{stats.reserved}</p>
            <p className="text-[10px] text-amber-500/70 uppercase tracking-wider">Reserved</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-cyan-400">{stats.occupancy}%</p>
            <p className="text-[10px] text-cyan-500/70 uppercase tracking-wider">Occupancy</p>
          </div>
        </div>
      )}

      {/* Seat Grid */}
      {!loading && grid && seatMap && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 overflow-auto">
          {/* Screen */}
          <div className="mb-4 mx-8">
            <div className="h-1.5 bg-linear-to-r from-cyan-500/10 via-cyan-500/30 to-cyan-500/10 rounded-full"></div>
            <p className="text-center text-[9px] text-cyan-500/40 mt-0.5 uppercase tracking-[0.2em] font-bold">Screen</p>
          </div>

          <div className="space-y-px">
            {grid.map((row, r) => (
              <div key={r} className="flex gap-px items-center justify-center">
                <span className="text-[9px] font-bold text-slate-600 w-5 text-center shrink-0">{rowLabel(r)}</span>
                {row.map((cell, c) => {
                  if (cell.type === 'empty' || cell.type === 'aisle') {
                    return (
                      <div
                        key={c}
                        className={`w-7 h-7 ${cell.type === 'aisle' ? 'w-3' : ''}`}
                      />
                    );
                  }

                  const seatId = cell.label;
                  const info = seatMap[seatId];
                  const isPremium = cell.type === 'premium';

                  let bg, text, border, title;
                  if (!info) {
                    // Available
                    bg = isPremium ? 'bg-amber-500/20' : 'bg-emerald-500/20';
                    text = isPremium ? 'text-amber-300' : 'text-emerald-300';
                    border = isPremium ? 'border-amber-500/30' : 'border-emerald-500/30';
                    title = `${seatId} — Available${isPremium ? ' (Premium)' : ''}`;
                  } else if (info.status === 'reserved') {
                    bg = 'bg-amber-500/30';
                    text = 'text-amber-200';
                    border = 'border-amber-400/40';
                    title = `${seatId} — Reserved by ${info.user?.name || 'Unknown'}`;
                  } else {
                    // booked / confirmed
                    bg = 'bg-red-500/30';
                    text = 'text-red-200';
                    border = 'border-red-400/40';
                    title = `${seatId} — Booked by ${info.user?.name || 'Unknown'} (${info.user?.email || ''})`;
                  }

                  return (
                    <div
                      key={c}
                      className={`w-7 h-7 rounded text-[8px] font-bold flex items-center justify-center border cursor-default ${bg} ${text} ${border}`}
                      title={title}
                    >
                      {seatId.replace(/^[A-Z]+/, '')}
                    </div>
                  );
                })}
                <span className="text-[9px] font-bold text-slate-600 w-5 text-center shrink-0">{rowLabel(r)}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-[10px] text-slate-300 mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-emerald-500/25 border border-emerald-500/30"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-amber-500/25 border border-amber-500/30"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-red-500/30 border border-red-400/40"></div>
              <span>Booked</span>
            </div>
          </div>
        </div>
      )}

      {/* No layout message */}
      {!loading && selectedShowtimeId && !grid && !error && (
        <div className="text-center py-10 text-slate-500">
          <p>No seat layout configured for this hall.</p>
          <p className="text-xs mt-1">Configure a layout in Theater Management first.</p>
        </div>
      )}

      {/* No showtime selected */}
      {!loading && !selectedShowtimeId && !error && (
        <div className="text-center py-12 text-slate-600">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
          </svg>
          <p className="text-sm">Select a movie and showtime to view seat status</p>
        </div>
      )}
    </div>
  );
};

export default LiveSeatStatus;
