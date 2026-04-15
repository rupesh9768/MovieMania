import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-[#0a0a0f] border-t border-slate-800/40 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" linkToHome />
        <div className="flex items-center gap-5 text-xs">
          <Link to="/browse" className="text-slate-500 hover:text-white transition-colors">Browse</Link>
          <Link to="/movies" className="text-slate-500 hover:text-white transition-colors">Movies</Link>
          <Link to="/tvshows" className="text-slate-500 hover:text-white transition-colors">TV Shows</Link>
          <Link to="/anime" className="text-slate-500 hover:text-white transition-colors">Anime</Link>
        </div>
        <p className="text-slate-600 text-[11px]">© 2026 MovieMania</p>
      </div>
    </footer>
  );
};

export default Footer;


