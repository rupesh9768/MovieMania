import React, { useEffect, useMemo, useState } from 'react';
import { backendApi } from '../../api';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell
} from 'recharts';

const AnimatedNumber = ({ value = 0, formatter = (n) => n.toLocaleString() }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value || 0);
    const duration = 700;
    let raf = null;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [value]);

  return formatter(displayValue);
};

const CardIcon = ({ type }) => {
  if (type === 'totalRevenue') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    );
  }
  if (type === 'todayRevenue') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h5l2-5 4 10 2-5h5" />
      </svg>
    );
  }
  if (type === 'totalBookings') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
        <path d="M8 7V3m8 4V3M4 11h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
      <path d="M4 10h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7Zm2-4h12a2 2 0 0 1 2 2v2H4V8a2 2 0 0 1 2-2Z" />
    </svg>
  );
};

const HALL_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#fb923c'];

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0, todayRevenue: 0, yesterdayRevenue: 0,
    totalBookings: 0, totalTicketsSold: 0,
    nowPlayingCount: 0, comingSoonCount: 0, archivedCount: 0,
    topMovies: [], revenueByDate: []
  });

  // Hall analytics state
  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState('');
  const [selectedHall, setSelectedHall] = useState('');
  const [hallStats, setHallStats] = useState(null);
  const [hallLoading, setHallLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [data, theaterData] = await Promise.all([
          backendApi.getAdminDashboardAnalytics(30),
          backendApi.getTheaters()
        ]);
        setStats({
          totalRevenue: data.totalRevenue || 0,
          todayRevenue: data.todayRevenue || 0,
          yesterdayRevenue: data.yesterdayRevenue || 0,
          totalBookings: data.totalBookings || 0,
          totalTicketsSold: data.totalTicketsSold || 0,
          nowPlayingCount: data.nowPlayingCount || 0,
          comingSoonCount: data.comingSoonCount || 0,
          archivedCount: data.archivedCount || 0,
          topMovies: data.topMovies || [],
          revenueByDate: data.revenueByDate || []
        });
        setTheaters(Array.isArray(theaterData) ? theaterData : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load hall analytics when theater or hall changes
  useEffect(() => {
    const loadHallStats = async () => {
      if (!selectedTheater) {
        setHallStats(null);
        return;
      }
      setHallLoading(true);
      try {
        const params = { theaterId: selectedTheater, days: 30 };
        if (selectedHall) params.hallName = selectedHall;
        const data = await backendApi.getHallAnalytics(params);
        setHallStats(data);
      } catch {
        setHallStats(null);
      } finally {
        setHallLoading(false);
      }
    };
    loadHallStats();
  }, [selectedTheater, selectedHall]);

  const selectedTheaterObj = theaters.find((t) => t._id === selectedTheater);

  const formatCurrency = (amount) => `NPR ${Number(amount || 0).toLocaleString()}`;

  const growth = useMemo(() => {
    const today = Number(stats.todayRevenue || 0);
    const yesterday = Number(stats.yesterdayRevenue || 0);
    if (yesterday <= 0) return { pct: today > 0 ? 100 : 0, isGrowing: today > 0 };
    const pct = ((today - yesterday) / yesterday) * 100;
    return { pct, isGrowing: pct > 0 };
  }, [stats.todayRevenue, stats.yesterdayRevenue]);

  const cards = [
    { key: 'totalRevenue', title: 'Total Revenue', value: stats.totalRevenue, color: 'text-cyan-300', formatter: formatCurrency },
    { key: 'todayRevenue', title: "Today's Revenue", value: stats.todayRevenue, color: 'text-emerald-300', formatter: formatCurrency, highlight: true },
    { key: 'totalBookings', title: 'Total Bookings', value: stats.totalBookings, color: 'text-indigo-300', formatter: (n) => Number(n || 0).toLocaleString() },
    { key: 'totalTickets', title: 'Tickets Sold', value: stats.totalTicketsSold, color: 'text-amber-300', formatter: (n) => Number(n || 0).toLocaleString() },
    { key: 'nowPlaying', title: 'Now Playing', value: stats.nowPlayingCount, color: 'text-cyan-300', formatter: (n) => Number(n || 0).toLocaleString() },
    { key: 'comingSoon', title: 'Coming Soon', value: stats.comingSoonCount, color: 'text-amber-300', formatter: (n) => Number(n || 0).toLocaleString() }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black">Dashboard Overview</h2>
          <p className="text-slate-400 text-sm mt-1">Revenue intelligence and booking performance</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${growth.isGrowing ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
          {growth.isGrowing ? 'Growing' : 'Stable'} ({growth.pct.toFixed(1)}%)
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-32 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.key}
              className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] ${card.highlight ? 'border-emerald-500/40 bg-emerald-900/20' : 'border-slate-800 bg-slate-900/70'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wider text-slate-500">{card.title}</p>
                <div className={card.highlight ? 'text-emerald-300' : 'text-slate-300'}>
                  <CardIcon type={card.key === 'totalTickets' ? 'totalTickets' : card.key} />
                </div>
              </div>
              <p className={`text-3xl font-black ${card.color}`}>
                <AnimatedNumber value={card.value} formatter={card.formatter} />
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Trend */}
      {!loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-lg font-bold mb-4">Revenue Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3, fill: '#22d3ee' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-Hall Analytics Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-lg font-bold mb-4">Hall Revenue Breakdown</h3>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select
            value={selectedTheater}
            onChange={(e) => { setSelectedTheater(e.target.value); setSelectedHall(''); }}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white min-w-[200px]"
          >
            <option value="">Select Theater</option>
            {theaters.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          {selectedTheaterObj && selectedTheaterObj.halls?.length > 0 && (
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white min-w-[160px]"
            >
              <option value="">All Halls</option>
              {selectedTheaterObj.halls.map((h) => (
                <option key={h._id} value={h.name}>{h.name}</option>
              ))}
            </select>
          )}
        </div>

        {hallLoading ? (
          <div className="h-48 flex items-center justify-center text-slate-500">Loading hall data...</div>
        ) : hallStats ? (
          <div className="space-y-5">
            {/* Hall summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Hall Revenue</p>
                <p className="text-2xl font-black text-cyan-300">{formatCurrency(hallStats.totalRevenue)}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Hall Bookings</p>
                <p className="text-2xl font-black text-indigo-300">{Number(hallStats.totalBookings || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Tickets Sold</p>
                <p className="text-2xl font-black text-amber-300">{Number(hallStats.totalTickets || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Revenue by Hall bar chart */}
            {hallStats.revenueByHall?.length > 0 && !selectedHall && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Revenue by Hall</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hallStats.revenueByHall} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hall" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {hallStats.revenueByHall.map((_, i) => (
                          <Cell key={i} fill={HALL_COLORS[i % HALL_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Hall revenue trend */}
            {hallStats.revenueByDate?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">{selectedHall || 'All Halls'} - Daily Trend</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hallStats.revenueByDate} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px' }}
                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={2} dot={{ r: 2, fill: '#a78bfa' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            Select a theater above to view hall-level analytics
          </div>
        )}
      </div>

      {/* Top Movies */}
      {!loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="text-lg font-bold mb-4">Top Movies by Revenue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Movie</th>
                  <th className="py-2 pr-3">Revenue</th>
                  <th className="py-2">Tickets</th>
                </tr>
              </thead>
              <tbody>
                {stats.topMovies.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-500">No bookings found yet.</td></tr>
                ) : (
                  stats.topMovies.map((movie, index) => (
                    <tr key={`${movie.movieId}-${index}`} className="border-b border-slate-800/70 last:border-0">
                      <td className="py-3 pr-3 text-slate-500 font-bold">{index + 1}</td>
                      <td className="py-3 pr-3 text-white font-medium">{movie.title}</td>
                      <td className="py-3 pr-3 text-cyan-300 font-semibold">{formatCurrency(movie.totalRevenue)}</td>
                      <td className="py-3 text-slate-300">{Number(movie.totalTickets || 0).toLocaleString()}</td>
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

export default DashboardOverview;
