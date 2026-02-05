import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetails from './pages/MovieDetails';
import Movies from './pages/Movies';
import Browse from './pages/Browse';
import TVShows from './pages/TVShows';
import Animations from './pages/Animations';
import Anime from './pages/Anime';
import AdminDashboard from './pages/AdminDashboard';
import Booking from './pages/Booking';
import Theater from './pages/Theater';
import TheaterDetails from './pages/TheaterDetails';

// Import Components (used as pages)
import ShowtimeSelection from './components/ShowtimeSelection';
import SeatSelection from './components/SeatSelection';
import Payment from './components/Payment';

// Import Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <BrowserRouter>
      {/* Wrapper to ensure footer pushes to bottom if content is short */}
      <div className="App bg-[#0b1121] min-h-screen font-sans text-white flex flex-col">
        
        <Navbar /> 

        {/* 'flex-grow' ensures this section takes up all available space */}
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tvshows" element={<TVShows />} />
            <Route path="/animations" element={<Animations />} />
            <Route path="/anime" element={<Anime />} />
            {/* Unified details route: /details/:mediaType/:id */}
            <Route path="/details/:mediaType/:id" element={<MovieDetails />} />
            {/* Legacy routes for backwards compatibility */}
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/tv/:id" element={<MovieDetails />} />
            
            {/* Booking Flow Routes */}
            <Route path="/showtimes/:movieId" element={<ShowtimeSelection />} />
            <Route path="/seat-selection/:movieId/:showtimeId" element={<Booking />} />
            <Route path="/booking/:id" element={<Booking />} />
            
            {/* Theater Routes - Movies in our halls */}
            <Route path="/theater" element={<Theater />} />
            <Route path="/theater/:id" element={<TheaterDetails />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* 404 Fallback */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-6xl font-black text-red-500 mb-4">404</h1>
                <p className="text-xl text-slate-400 mb-6">Page not found</p>
                <a href="/" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full transition-all">
                  Go Home
                </a>
              </div>
            } />
          </Routes>
        </main>

        <Footer />
        
      </div>
    </BrowserRouter>
  );
}

export default App;