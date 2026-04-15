import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NotificationPanel from './NotificationPanel';
import Logo from './Logo';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  // Predefined avatars are served from frontend public/avatars/
  if (avatar.startsWith('/avatars/') || !avatar.startsWith('/')) {
    return avatar.startsWith('/') ? avatar : `/avatars/${encodeURIComponent(avatar)}`;
  }
  return `${BACKEND_URL}${avatar}`;
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const browseRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { unreadCount } = useSocket();

  const isActive = (path) => location.pathname === path;
  const isBrowseActive = ['/browse', '/movies', '/tvshows', '/animations', '/anime'].includes(location.pathname);
  const isProfileActive = ['/booking-history', '/profile', '/watchlist', '/favorites'].includes(location.pathname) || location.pathname.startsWith('/profile');
  const isUpcomingActive = location.pathname === '/upcoming';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (browseRef.current && !browseRef.current.contains(event.target)) {
        setBrowseOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setBrowseOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleBrowseItemClick = (path) => {
    setBrowseOpen(false);
    navigate(path);
  };

  return (
    <nav className="bg-dark-bg border-b border-[#2a2a2a] sticky top-0 z-50 shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Logo size="md" linkToHome />
          
          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-8">
            <li>
              <Link 
                to="/" 
                className={`cinema-nav-link text-sm font-medium transition-colors ${
                  isActive('/') ? 'is-active' : ''
                }`}
              >
                Home
              </Link>
            </li>

            {/* Upcoming Movies Link */}
            <li>
              <Link 
                to="/upcoming" 
                className={`cinema-nav-link text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isUpcomingActive ? 'is-active' : ''
                }`}
              >
                Upcoming
              </Link>
            </li>
            
            {/* Browse Dropdown - CLICK to open */}
            <li className="relative" ref={browseRef}>
              <button 
                onClick={() => setBrowseOpen(!browseOpen)}
                className={`cinema-nav-link text-sm font-medium transition-colors flex items-center gap-1 ${
                  isBrowseActive ? 'is-active' : ''
                }`}
              >
                Browse
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${browseOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown */}
              <div 
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 z-40 transition-all duration-200 origin-top ${
                  browseOpen 
                    ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' 
                    : 'opacity-0 scale-95 pointer-events-none -translate-y-2'
                }`}
              >
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl shadow-black/50 p-2 w-52 backdrop-blur-xl">
                  {/* Arrow */}
                  <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1a1a1a] border-l border-t border-[#2a2a2a] rotate-45"></div>
                  
                  {/* Items */}
                  <div className="space-y-0.5">
                    {[
                      { path: '/movies', label: 'Movies', icon: (
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8">
                          <rect x="2" y="4" width="20" height="16" rx="3" />
                          <path d="M2 8h20M2 16h20M8 4v16M16 4v16" opacity="0.5" />
                        </svg>
                      )},
                      { path: '/tvshows', label: 'TV Shows', icon: (
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8">
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <path d="M8 21h8M12 17v4" />
                        </svg>
                      )},
                      { path: '/anime', label: 'Anime', icon: (
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 9.05a2.5 2.5 0 0 1 2.5 0M13.5 9.05a2.5 2.5 0 0 1 2.5 0M8 15c1.333 1 2.667 1.5 4 1.5s2.667-.5 4-1.5" />
                        </svg>
                      )},
                      { path: '/animations', label: 'Animations', icon: (
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8">
                          <path d="M15 4.5l-4 7.5 4 7.5" />
                          <path d="M9 4.5l4 7.5-4 7.5" />
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      )}
                    ].map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleBrowseItemClick(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isActive(item.path)
                            ? 'bg-white/10 text-white'
                            : 'text-[#999] hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <span className={`${isActive(item.path) ? 'text-[#E50914]' : 'text-[#666]'} transition-colors`}>
                          {item.icon}
                        </span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Divider + Browse All */}
                  <div className="border-t border-[#2a2a2a] mt-1.5 pt-1.5">
                    <button
                      onClick={() => handleBrowseItemClick('/browse')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#888] hover:bg-white/[0.06] hover:text-white transition-all duration-150"
                    >
                      Browse All
                      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </li>

            <li>
              <Link 
                to="/theater" 
                className={`cinema-nav-link text-sm font-medium transition-colors flex items-center gap-1 ${
                  isActive('/theater') ? 'is-active' : ''
                }`}
              >
                Theater
              </Link>
            </li>

            {/* Admin link - only shown to admins */}
            {isAdmin && (
              <li>
                <Link 
                  to="/admin" 
                  className={`cinema-nav-link text-sm font-medium transition-colors ${
                    isActive('/admin') ? 'is-active' : ''
                  }`}
                >
                  Admin
                </Link>
              </li>
            )}
          </ul>

          {/* Right Side - Auth Buttons / Profile Dropdown */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 text-[#b3b3b3] hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#E50914] text-white text-[10px] font-bold rounded-full px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
              </div>

              {/* Profile Dropdown - Logged In */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
                    isProfileActive ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
                  }`}
                >
                  {user?.avatar ? (
                    <img src={getAvatarUrl(user.avatar)} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-600" />
                  ) : (
                    <div className="w-8 h-8 bg-[#242424] rounded-full flex items-center justify-center text-white font-bold text-xs border border-[#2a2a2a]">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="max-w-25 truncate">{user?.name || 'User'}</span>
                  <svg className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {profileOpen && (
                  <div className="absolute top-full right-0 mt-3 bg-card-bg border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/35 p-3 min-w-50">
                    {/* Arrow */}
                    <div className="absolute -top-2 right-4 w-4 h-4 bg-card-bg border-l border-t border-[#2a2a2a] transform rotate-45"></div>
                    
                    {/* User Info */}
                    <div className="px-3 py-2 mb-2 border-b border-[#2a2a2a]">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-[#b3b3b3] truncate">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#242424] text-white text-xs font-bold rounded-full border border-[#2a2a2a]">
                          Admin
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                          isActive('/profile')
                            ? 'bg-[#242424] text-white'
                            : 'text-[#b3b3b3] hover:bg-[#242424] hover:text-white'
                        }`}
                        onClick={() => setProfileOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span>My Profile</span>
                      </Link>
                      
                      <Link
                        to="/watchlist"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                          isActive('/watchlist')
                            ? 'bg-[#242424] text-white'
                            : 'text-[#b3b3b3] hover:bg-[#242424] hover:text-white'
                        }`}
                        onClick={() => setProfileOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <span>Watchlist</span>
                      </Link>
                      
                      <Link
                        to="/favorites"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                          isActive('/favorites')
                            ? 'bg-[#242424] text-white'
                            : 'text-[#b3b3b3] hover:bg-[#242424] hover:text-white'
                        }`}
                        onClick={() => setProfileOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        <span>Favorites</span>
                      </Link>
                      
                      <Link
                        to="/booking-history"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                          isActive('/booking-history')
                            ? 'bg-[#242424] text-white'
                            : 'text-[#b3b3b3] hover:bg-[#242424] hover:text-white'
                        }`}
                        onClick={() => setProfileOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                        <span>Booking History</span>
                      </Link>
                      
                      {/* Admin Dashboard Link */}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                            isActive('/admin')
                              ? 'bg-[#242424] text-white'
                              : 'text-[#b3b3b3] hover:bg-[#242424] hover:text-white'
                          }`}
                          onClick={() => setProfileOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      
                      <div className="border-t border-[#2a2a2a] my-2"></div>
                      
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer w-full text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
            ) : (
              /* Login / Register Buttons - Logged Out */
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#b3b3b3] hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-bold bg-[#E50914] hover:bg-[#c40812] text-white px-4 py-2 rounded-lg transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/"
                  className={`block py-2 px-4 rounded-lg transition-colors ${
                    isActive('/') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Home
                </Link>
              </li>
              
              {/* Upcoming Movies - Mobile */}
              <li>
                <Link 
                  to="/upcoming"
                  className={`flex items-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                    isUpcomingActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Upcoming Movies
                </Link>
              </li>
              
              {/* Browse Links in Mobile */}
              <li className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Browse</li>
              <li>
                <Link to="/movies" className={`block py-2 px-6 rounded-lg transition-colors ${isActive('/movies') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  Movies
                </Link>
              </li>
              <li>
                <Link to="/tvshows" className={`block py-2 px-6 rounded-lg transition-colors ${isActive('/tvshows') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  TV Shows
                </Link>
              </li>
              <li>
                <Link to="/anime" className={`block py-2 px-6 rounded-lg transition-colors ${isActive('/anime') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  Anime
                </Link>
              </li>
              <li>
                <Link to="/animations" className={`block py-2 px-6 rounded-lg transition-colors ${isActive('/animations') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  Animations
                </Link>
              </li>
              <li>
                <Link to="/browse" className="block py-2 px-6 text-cyan-400 text-sm">
                  Browse All
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/theater"
                  className={`block py-2 px-4 rounded-lg transition-colors ${
                    isActive('/theater') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Theater
                </Link>
              </li>
              
              {/* Admin link - only for admins */}
              {isAdmin && (
                <li>
                  <Link 
                    to="/admin"
                    className={`block py-2 px-4 rounded-lg transition-colors ${
                      isActive('/admin') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                </li>
              )}
              
              {/* Authenticated user links */}
              {isAuthenticated && (
                <>
                  <li className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">My Library</li>
                  <li>
                    <Link 
                      to="/profile"
                      className={`block py-2 px-4 rounded-lg transition-colors ${
                        isActive('/profile') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      My Profile
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/watchlist"
                      className={`block py-2 px-4 rounded-lg transition-colors ${
                        isActive('/watchlist') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Watchlist
                    </Link>
                  </li>
                  
                  <li>
                    <Link 
                      to="/favorites"
                      className={`block py-2 px-4 rounded-lg transition-colors ${
                        isActive('/favorites') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Favorites
                    </Link>
                  </li>
                  
                  <li>
                    <Link
                      to="/booking-history"
                      className={`block py-2 px-4 rounded-lg transition-colors ${
                        isActive('/booking-history') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Booking History
                    </Link>
                  </li>
                </>
              )}
              
              <li className="pt-2 border-t border-slate-800">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 px-4 text-red-400 hover:text-red-300"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="block py-2 px-4 text-slate-400 hover:text-white">
                      Login
                    </Link>
                    <Link to="/register" className="block py-2 px-4 mx-4 bg-cyan-500 text-black font-bold rounded-lg text-center cursor-pointer mt-2">
                      Sign Up
                    </Link>
                  </>
                )}
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


