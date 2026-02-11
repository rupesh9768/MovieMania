import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Auth Provider
import { AuthProvider } from './context/AuthContext';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MovieDetails from './pages/MovieDetails';
import Movies from './pages/Movies';
import Browse from './pages/Browse';
import TVShows from './pages/TVShows';
import Animations from './pages/Animations';
import Anime from './pages/Anime';
import Upcoming from './pages/Upcoming';
import Watchlist from './pages/Watchlist';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/AdminDashboard';
import Booking from './pages/Booking';
import Theater from './pages/Theater';
import TheaterDetails from './pages/TheaterDetails';
import Profile from './pages/Profile';

// Import Components (used as pages)
import ShowtimeSelection from './components/ShowtimeSelection';
import SeatSelection from './components/SeatSelection';
import Payment from './components/Payment';

// Import Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Import Route Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Wrapper to ensure footer pushes to bottom if content is short */}
        <div className="App bg-dark-bg min-h-screen font-sans text-white flex flex-col">
          
          <Navbar /> 

          {/* 'grow' ensures this section takes up all available space */}
          <main className="grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tvshows" element={<TVShows />} />
              <Route path="/animations" element={<Animations />} />
              <Route path="/anime" element={<Anime />} />
              <Route path="/upcoming" element={<Upcoming />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              {/* Protected User Routes */}
              <Route path="/watchlist" element={
                <ProtectedRoute><Watchlist /></ProtectedRoute>
              } />
              <Route path="/favorites" element={
                <ProtectedRoute><Favorites /></ProtectedRoute>
              } />
              
              {/* Unified details route: /details/:mediaType/:id */}
              <Route path="/details/:mediaType/:id" element={<MovieDetails />} />
              {/* Legacy routes for backwards compatibility */}
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/tv/:id" element={<MovieDetails />} />
              
              {/* Booking Flow Routes (Protected) */}
              {/* TODO: Add booking ownership validation */}
              <Route path="/showtimes/:movieId" element={
                <ProtectedRoute><ShowtimeSelection /></ProtectedRoute>
              } />
              <Route path="/seat-selection/:movieId/:showtimeId" element={
                <ProtectedRoute><Booking /></ProtectedRoute>
              } />
              <Route path="/booking/:id" element={
                <ProtectedRoute><Booking /></ProtectedRoute>
              } />
              
              {/* Theater Routes - Movies in our halls */}
              <Route path="/theater" element={<Theater />} />
              <Route path="/theater/:id" element={<TheaterDetails />} />
              
              {/* Profile Routes */}
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={<Profile />} />
              
              {/* Admin Routes (Protected — admin only) */}
              <Route path="/admin" element={
                <AdminRoute><AdminDashboard /></AdminRoute>
              } />
              
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


