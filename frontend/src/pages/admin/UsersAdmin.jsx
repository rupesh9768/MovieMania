import React, { useEffect, useState, useMemo } from 'react';
import { backendApi } from '../../api';

const UsersAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await backendApi.getAdminUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...users];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.location || '').toLowerCase().includes(q)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter);
    }

    // Sort
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'bookings') list.sort((a, b) => (b.totalBookings || 0) - (a.totalBookings || 0));
    else if (sortBy === 'spent') list.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));

    return list;
  }, [users, search, roleFilter, sortBy]);

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeBookers = users.filter((u) => (u.totalBookings || 0) > 0).length;
  const totalSpent = users.reduce((sum, u) => sum + (u.totalSpent || 0), 0);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return 'N/A';
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black">User Management</h2>
        <p className="text-slate-400 text-sm mt-1">All registered users and their booking activity</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Total Users</p>
          <p className="text-2xl font-black text-cyan-300">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Admins</p>
          <p className="text-2xl font-black text-amber-300">{adminCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Active Bookers</p>
          <p className="text-2xl font-black text-emerald-300">{activeBookers}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Total Spent</p>
          <p className="text-2xl font-black text-purple-300">NPR {totalSpent.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">By Name</option>
          <option value="bookings">Most Bookings</option>
          <option value="spent">Most Spent</option>
        </select>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-slate-800 bg-slate-900/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/70 text-slate-400 text-left">
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Location</th>
                  <th className="p-3 text-right">Bookings</th>
                  <th className="p-3 text-right">Total Spent</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-10 text-slate-500">No users found</td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user._id} className="border-t border-slate-800/70 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              (user.name || '?')[0].toUpperCase()
                            )}
                          </div>
                          <span className="text-white font-medium truncate max-w-[140px]">{user.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300 truncate max-w-[180px]">{user.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[120px]">{user.location || '--'}</td>
                      <td className="p-3 text-right">
                        <span className={`font-semibold ${(user.totalBookings || 0) > 0 ? 'text-emerald-300' : 'text-slate-500'}`}>
                          {user.totalBookings || 0}
                        </span>
                      </td>
                      <td className="p-3 text-right text-cyan-300 font-semibold">
                        {(user.totalSpent || 0) > 0 ? `NPR ${user.totalSpent.toLocaleString()}` : '--'}
                      </td>
                      <td className="p-3 text-slate-400 text-xs">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/30 text-xs text-slate-500">
            Showing {filtered.length} of {totalUsers} users
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;
