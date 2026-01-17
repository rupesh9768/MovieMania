import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">MovieMania</Link>
      </div>
      
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/movies">Movies</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>

      <div className="navbar-auth">
        <Link to="/login" className="nav-btn login-btn">Login</Link>
        <Link to="/register" className="nav-btn register-btn">Register</Link>
      </div>
    </nav>
  );
};

export default Navbar;