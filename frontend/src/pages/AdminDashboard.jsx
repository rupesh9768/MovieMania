import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const allMenuItems = [
  { key: 'dashboard', label: 'Dashboard', to: '/admin/dashboard', roles: ['admin', 'super_admin', 'theater_admin'] },
  { key: 'movies', label: 'Movies Management', to: '/admin/movies', roles: ['admin', 'super_admin', 'theater_admin'] },
  { key: 'theaters', label: 'Theaters', to: '/admin/theaters', roles: ['admin', 'super_admin', 'theater_admin'] },
  { key: 'bookings', label: 'Bookings', to: '/admin/bookings', roles: ['admin', 'super_admin', 'theater_admin'] },
  { key: 'users', label: 'Users', to: '/admin/users', roles: ['admin', 'super_admin'] },
  { key: 'theater-admins', label: 'Theater Admins', to: '/admin/theater-admins', roles: ['admin', 'super_admin'] },
  { key: 'analytics', label: 'Analytics', to: '/admin/analytics', roles: ['admin', 'super_admin', 'theater_admin'] },
  { key: 'chat', label: 'Chat', to: '/admin/chat', roles: ['admin', 'super_admin'] }
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

  if (type === 'theater-admins') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (type === 'chat') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
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
  const { user } = useAuth();
  const userRole = user?.role || 'user';
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));
  const panelTitle = userRole === 'theater_admin' ? 'Theater Admin' : 'Admin Panel';

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/90 px-4 py-6 sticky top-0 h-screen">
        <div className="mb-8 px-2">
          <Logo size="sm" linkToHome />
          <p className="text-xs text-slate-400 mt-2">{panelTitle}</p>
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
