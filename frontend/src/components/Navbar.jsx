import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const browseRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const isBrowseActive = ['/browse', '/movies', '/tvshows', '/animations', '/anime'].includes(location.pathname);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (browseRef.current && !browseRef.current.contains(event.target)) {
        setBrowseOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setBrowseOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleBrowseItemClick = (path) => {
    setBrowseOpen(false);
    navigate(path);
  };

  return (
    <nav className="bg-[#0a0f1a] border-b border-slate-800/50 sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter">
              MOVIE<span className="text-cyan-400">MANIA</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-8">
            <li>
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Home
              </Link>
            </li>
            
            {/* Browse Dropdown - CLICK to open */}
            <li className="relative" ref={browseRef}>
              <button 
                onClick={() => setBrowseOpen(!browseOpen)}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                  isBrowseActive ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Browse
                <svg className={`w-4 h-4 transition-transform ${browseOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Overlay Box */}
              {browseOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl shadow-black/50 p-4 min-w-[360px]">
                  {/* Arrow */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#111827] border-l border-t border-slate-700 transform rotate-45"></div>
                  
                  {/* Browse Options - Horizontal Layout */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBrowseItemClick('/movies')}
                      className={`flex-1 px-4 py-4 rounded-xl text-center transition-all duration-200 ${
                        isActive('/movies')
                          ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/40'
                          : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="block text-xl mb-1.5">🎬</span>
                      <span className="text-sm font-medium">Movies</span>
                    </button>
                    
                    <button
                      onClick={() => handleBrowseItemClick('/tvshows')}
                      className={`flex-1 px-4 py-4 rounded-xl text-center transition-all duration-200 ${
                        isActive('/tvshows')
                          ? 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/40'
                          : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="block text-xl mb-1.5">📺</span>
                      <span className="text-sm font-medium">TV Shows</span>
                    </button>
                    
                    <button
                      onClick={() => handleBrowseItemClick('/anime')}
                      className={`flex-1 px-4 py-4 rounded-xl text-center transition-all duration-200 ${
                        isActive('/anime')
                          ? 'bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/40'
                          : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="block text-xl mb-1.5">🎌</span>
                      <span className="text-sm font-medium">Anime</span>
                    </button>
                    
                    <button
                      onClick={() => handleBrowseItemClick('/animations')}
                      className={`flex-1 px-4 py-4 rounded-xl text-center transition-all duration-200 ${
                        isActive('/animations')
                          ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40'
                          : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="block text-xl mb-1.5">✨</span>
                      <span className="text-sm font-medium">Animations</span>
                    </button>
                  </div>
                  
                  {/* Browse All Link */}
                  <button
                    onClick={() => handleBrowseItemClick('/browse')}
                    className="w-full mt-4 py-2.5 text-center text-sm font-semibold bg-slate-800/80 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-all rounded-lg border border-slate-700/50"
                  >
                    Browse All →
                  </button>
                </div>
              )}
            </li>

            <li>
              <Link 
                to="/admin" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/admin') ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </Link>
            </li>
          </ul>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              to="/login" 
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-2 rounded-full transition-all"
            >
              Sign Up
            </Link>
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
              
              {/* Browse Links in Mobile */}
              <li className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Browse</li>
              <li>
                <Link to="/movies" className={`block py-2 px-6 rounded-lg transition-colors ${isActive('/movies') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  🎬 Movies
                </Link>
              </li>
              <li>
                <Link to="/tvshows" className={`block py-2 px-6 rounded-lg transition-colors ${isActive('/tvshows') ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  📺 TV Shows
                </Link>
              </li>
              <li>
                <Link to="/anime" className={`block py-2 px-6 rounded-lg transition-colors ${isActive('/anime') ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  🎌 Anime
                </Link>
              </li>
              <li>
                <Link to="/animations" className={`block py-2 px-6 rounded-lg transition-colors ${isActive('/animations') ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  ✨ Animations
                </Link>
              </li>
              <li>
                <Link to="/browse" className="block py-2 px-6 text-cyan-400 text-sm">
                  Browse All →
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/admin"
                  className={`block py-2 px-4 rounded-lg transition-colors ${
                    isActive('/admin') ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Admin
                </Link>
              </li>
              
              <li className="pt-2 border-t border-slate-800">
                <Link to="/login" className="block py-2 px-4 text-slate-400 hover:text-white">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="block py-2 px-4 mx-4 bg-cyan-500 text-black font-bold rounded-lg text-center">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;