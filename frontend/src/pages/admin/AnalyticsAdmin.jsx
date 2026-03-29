import React, { useEffect, useState } from 'react';
import { backendApi } from '../../api';

const AnalyticsAdmin = () => {
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalTicketsSold: 0,
    topMovies: [],
    recentBookings: [],
    revenueByDate: []
  });

  const fetchAnalytics = async (days = analyticsDays) => {
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const data = await backendApi.getAdminDashboardAnalytics(days);
      setAnalytics({
        totalRevenue: data.totalRevenue || 0,
        totalBookings: data.totalBookings || 0,
        totalTicketsSold: data.totalTicketsSold || 0,
        topMovies: data.topMovies || [],
        recentBookings: data.recentBookings || [],
        revenueByDate: data.revenueByDate || []
      });
    } catch (err) {
      setAnalyticsError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(analyticsDays);
  }, [analyticsDays]);

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    return `NPR ${value.toLocaleString()}`;
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Business Analytics</h2>
          <p className="text-slate-400 text-sm">Revenue, bookings, tickets sold, and top-performing movies</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnalyticsDays(7)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${analyticsDays === 7 ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setAnalyticsDays(30)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${analyticsDays === 30 ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => fetchAnalytics(analyticsDays)}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {analyticsError && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
          {analyticsError}
        </div>
      )}

      {analyticsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total Revenue</p>
            <p className="text-3xl font-black text-cyan-300">{formatCurrency(analytics.totalRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Total Bookings</p>
            <p className="text-3xl font-black text-cyan-300">{analytics.totalBookings.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Tickets Sold</p>
            <p className="text-3xl font-black text-cyan-300">{analytics.totalTicketsSold.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg p-5">
        <h3 className="text-lg font-bold mb-4">Top Movies by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-4">Movie Name</th>
                <th className="py-2 pr-4">Revenue</th>
                <th className="py-2">Tickets Sold</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topMovies.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-slate-500 text-center">No booking data for selected range.</td>
                </tr>
              ) : (
                analytics.topMovies.map((movie, idx) => {
                  const isLowPerf = Number(movie.totalRevenue || 0) < 5000;
                  return (
                    <tr key={`${movie.movieId}-${idx}`} className="border-b border-slate-800/60 last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-white">
                        {idx === 0 && <span className="mr-2 text-red-400">Top Movie</span>}
                        {movie.title}
                        {isLowPerf && <span className="ml-2 text-amber-400 text-xs">Low Performance</span>}
                      </td>
                      <td className="py-3 pr-4 text-cyan-300 font-semibold">{formatCurrency(movie.totalRevenue)}</td>
                      <td className="py-3 text-slate-300">{Number(movie.totalTickets || 0).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg p-5">
          <h3 className="text-lg font-bold mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {analytics.recentBookings.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent bookings.</p>
            ) : (
              analytics.recentBookings.map((booking) => (
                <div key={booking._id} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white text-sm">{booking.movieTitle || 'Unknown Movie'}</p>
                      <p className="text-xs text-slate-400 mt-1">Seats: {Array.isArray(booking.seats) ? booking.seats.join(', ') : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-300 text-sm">{formatCurrency(booking.totalAmount || booking.totalPrice || 0)}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDateTime(booking.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg p-5">
          <h3 className="text-lg font-bold mb-4">Revenue by Date</h3>
          {analytics.revenueByDate.length === 0 ? (
            <p className="text-slate-500 text-sm">No revenue data available.</p>
          ) : (
            <div className="space-y-3">
              {(() => {
                const maxRevenue = Math.max(...analytics.revenueByDate.map((row) => Number(row.revenue || 0)), 1);
                return analytics.revenueByDate.map((row) => {
                  const revenue = Number(row.revenue || 0);
                  const widthPct = Math.max(4, Math.round((revenue / maxRevenue) * 100));
                  return (
                    <div key={row.date}>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>{row.date}</span>
                        <span>{formatCurrency(revenue)}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-linear-to-r from-cyan-500 to-cyan-300 rounded-full" style={{ width: `${widthPct}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAdmin;
