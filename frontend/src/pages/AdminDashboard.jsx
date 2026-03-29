import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', to: '/admin/dashboard' },
  { key: 'movies', label: 'Movies Management', to: '/admin/movies' },
  { key: 'theaters', label: 'Theaters', to: '/admin/theaters' },
  { key: 'bookings', label: 'Bookings', to: '/admin/bookings' },
  { key: 'users', label: 'Users', to: '/admin/users' },
  { key: 'analytics', label: 'Analytics', to: '/admin/analytics' }
];

const Icon = ({ type }) => {
  if (type === 'dashboard') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
        <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10Zm0-18v4h8V3h-8ZM3 21h8v-4H3v4Z" />
      </svg>
    );
  }

  if (type === 'movies') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 4v16M17 4v16M3 9h18M3 15h18" />
      </svg>
    );
  }

  if (type === 'theaters') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    );
  }

  if (type === 'bookings') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
        <path d="M8 7V3m8 4V3M4 11h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (type === 'users') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M20 8v6m3-3h-6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
      <path d="M4 19h16M4 15l4-4 3 3 5-6 4 4" />
    </svg>
  );
};

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/90 px-4 py-6 sticky top-0 h-screen">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-black tracking-wide">Admin Panel</h1>
          <p className="text-xs text-slate-400 mt-1">MovieMania Control Center</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                isActive
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon type={item.key} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="flex-1 min-w-0 px-4 md:px-8 py-6">
        <Outlet />
      </section>
    </div>
  );
};

export default AdminDashboard;
