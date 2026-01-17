import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetails from './pages/MovieDetails';
import ShowtimeSelection from './components/ShowtimeSelection'; 
import Booking from './pages/Booking'; 
import Movies from './pages/Movies';

// Import Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer'; // <--- 1. Import Footer

function App() {
  return (
    <BrowserRouter>
      {/* Wrapper to ensure footer pushes to bottom if content is short */}
      <div className="App bg-[#0b1121] min-h-screen font-sans text-white flex flex-col">
        
        <Navbar /> 

        {/* 'flex-grow' ensures this section takes up all available space */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/showtimes/:id" element={<ShowtimeSelection />} />
            <Route path="/seat-selection/:movieId/:showtimeId" element={<Booking />} />
            <Route path="/movies" element={<Movies />} />
          </Routes>
        </div>

        <Footer />
        
      </div>
    </BrowserRouter>
  );
}

export default App;