import React from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

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
import DashboardOverview from './pages/admin/DashboardOverview';
import MoviesAdmin from './pages/admin/MoviesAdmin';
import BookingsAdmin from './pages/admin/BookingsAdmin';
import AnalyticsAdmin from './pages/admin/AnalyticsAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import TheatersAdmin from './pages/admin/TheatersAdmin';
import TheaterAdminsAdmin from './pages/admin/TheaterAdminsAdmin';
import Booking from './pages/Booking';
import BookingHistory from './pages/BookingHistory';
import Theater from './pages/Theater';
import TheaterDetails from './pages/TheaterDetails';
import Profile from './pages/Profile';
import Discussion from './pages/Discussion';
import PersonDetails from './pages/PersonDetails';
import KhaltiCallback from './pages/KhaltiCallback';

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

function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  React.useEffect(() => {
    const key = `scroll:${location.key}`;

    if (navigationType === 'POP') {
      const savedY = window.sessionStorage.getItem(key);
      if (savedY !== null) {
        window.scrollTo({ top: Number(savedY) || 0, left: 0, behavior: 'auto' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    return () => {
      window.sessionStorage.setItem(key, String(window.scrollY || 0));
    };
  }, [location.key, navigationType]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
        <ScrollManager />
        {/* Wrapper to ensure footer pushes to bottom if content is short */}
        <div className="App min-h-screen font-sans flex flex-col bg-dark-bg text-white">
          
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
              <Route path="/person/:id" element={<PersonDetails />} />
              <Route path="/movie/backend/:id" element={<MovieDetails />} />
              {/* Legacy routes for backwards compatibility */}
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/tv/:id" element={<MovieDetails />} />
              
              {/* Discussion Route */}
              <Route path="/discussion/:type/:id" element={<Discussion />} />
              
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

              {/* Khalti Payment Callback */}
              <Route path="/payment/khalti/callback" element={
                <ProtectedRoute><KhaltiCallback /></ProtectedRoute>
              } />
              
              {/* Profile Routes */}
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
              <Route path="/booking-history" element={
                <ProtectedRoute><BookingHistory /></ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={<Profile />} />
              
              {/* Admin Routes (Protected — admin only) */}
              <Route path="/admin" element={
                <AdminRoute><AdminDashboard /></AdminRoute>
              }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route path="movies" element={<MoviesAdmin />} />
                <Route path="theaters" element={<TheatersAdmin />} />
                <Route path="bookings" element={<BookingsAdmin />} />
                <Route path="users" element={<UsersAdmin />} />
                <Route path="theater-admins" element={<TheaterAdminsAdmin />} />
                <Route path="analytics" element={<AnalyticsAdmin />} />
              </Route>
              
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
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


