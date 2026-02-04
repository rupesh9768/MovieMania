import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#0a0f1a] border-t border-slate-800/50 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          
          {/* Brand */}
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-white tracking-tighter mb-1">
              MOVIE<span className="text-cyan-500">MANIA</span>
            </h2>
            <p className="text-slate-500 text-xs">Your ultimate cinema experience</p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6 text-xs">
            <Link to="/" className="text-slate-400 hover:text-cyan-400 transition-colors">Home</Link>
            <Link to="/browse" className="text-slate-400 hover:text-cyan-400 transition-colors">Browse</Link>
            <Link to="/movies" className="text-slate-400 hover:text-cyan-400 transition-colors">Movies</Link>
            <Link to="/tvshows" className="text-slate-400 hover:text-cyan-400 transition-colors">TV Shows</Link>
            <Link to="/admin" className="text-slate-400 hover:text-cyan-400 transition-colors">Admin</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/50 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Copyright & Project Info */}
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <p className="text-slate-600 text-[10px]">
              © 2026 MovieMania. All rights reserved.
            </p>
            <span className="hidden md:block text-slate-700">•</span>
            <p className="text-slate-600 text-[10px]">
              Final Year Project
            </p>
          </div>

          {/* Tech Stack */}
          <div className="flex items-center gap-3">
            <span className="text-slate-600 text-[10px]">Built with</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-cyan-400">React</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-purple-400">Vite</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-blue-400">Tailwind</span>
            </div>
          </div>

          {/* Author */}
          <p className="text-slate-600 text-[10px]">
            Made by <span className="text-slate-400">Rupesh Pudasaini</span>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;