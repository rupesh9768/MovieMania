import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#0b1121] border-t border-slate-800 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* 1. BRAND SECTION */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-black text-white tracking-tighter mb-4">
              MOVIE<span className="text-cyan-500">MANIA</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
              Experience movies like never before. Premium seating, immersive sound, and the magic of cinema right at your fingertips.
            </p>
            
          </div>

          {/* 2. QUICK LINKS */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Quick Links</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/#now-showing" className="hover:text-cyan-400 transition-colors">Now Showing</Link>
              </li>
              <li>
                <Link to="/#trending" className="hover:text-cyan-400 transition-colors">Trending Movies</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-cyan-400 transition-colors">My Account</Link>
              </li>
            </ul>
          </div>

          {/* 3. SUPPORT / LEGAL */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Support</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs">
            © 2026 MovieMania. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <span>Made By Rupesh Pudasaini</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;