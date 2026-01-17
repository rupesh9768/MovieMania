import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- MOCK DATA (Simulating Admin & API Data) ---

// 1. "Now Showing" - The Admin puts these here. They are ready to book.
const nowShowingMovies = [
  { id: 1, title: "Avengers: Doomsday", genre: "Action • Sci-Fi", rating: 4.8, image: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" },
  { id: 2, title: "Dune: Part Three", genre: "Sci-Fi • Adventure", rating: 4.6, image: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
  { id: 3, title: "Spider-Man: Beyond", genre: "Animation • Action", rating: 4.9, image: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg" },
  { id: 4, title: "The Batman II", genre: "Crime • Drama", rating: 4.7, image: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg" },
];

// 2. "Trending" - This will come from TMDB API later.
const trendingMovies = [
  { id: 101, title: "Oppenheimer", backdrop: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", desc: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb." },
  { id: 102, title: "Avatar: Fire and Ash", backdrop: "https://image.tmdb.org/t/p/original/vL5LR6WdxWPjXuFRUE5VTg75Txt.jpg", desc: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora." },
  { id: 103, title: "Interstellar", backdrop: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VJhXEG.jpg", desc: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
];

const Home = () => {
  const navigate = useNavigate();
  
  // --- CAROUSEL LOGIC ---
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trendingMovies.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b1121] text-white pb-20">
      
      {/* 1. HERO SLIDESHOW (Carousel) */}
      <div className="relative w-full h-[550px] overflow-hidden">
        {trendingMovies.map((movie, index) => (
          <div 
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Background Image with Gradient Overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${movie.backdrop})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-[#0b1121]/40 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b1121] via-transparent to-transparent"></div>
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-2xl animate-fade-in-up">
              <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-3 inline-block">
                Trending #1
              </span>
              <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight drop-shadow-lg">
                {movie.title}
              </h1>
              <p className="text-slate-300 text-sm md:text-lg mb-8 line-clamp-3 drop-shadow-md">
                {movie.desc}
              </p>
              
              <div className="flex gap-4">
                 {/* This button leads to details/discussion */}
                <button 
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-3 rounded-full font-bold transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 right-8 flex gap-2">
          {trendingMovies.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-600'}`}
            ></div>
          ))}
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-6">
        
        {/* 2. NOW SHOWING (Admin Section) */}
        <div className="mt-12 mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-8 bg-cyan-500 rounded-sm"></span>
                Now Showing
              </h2>
              <p className="text-slate-400 text-sm mt-1 ml-4">Book tickets for latest releases</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {nowShowingMovies.map((movie) => (
              <div key={movie.id} className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-2">
                
                {/* Image Container */}
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img src={movie.image} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  
                  {/* Hover Overlay with Primary Action */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                    <button 
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-8 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-cyan-500/20"
                    >
                      Book Ticket
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-1 truncate">{movie.title}</h3>
                  <div className="flex justify-between items-center text-sm text-slate-400">
                    <span>{movie.genre}</span>
                    <span className="flex items-center text-yellow-500 font-bold gap-1">
                      ★ {movie.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* 3. TRENDING / COMING SOON (API Section) */}
        <div className="mb-12">
           <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6 opacity-80">
             <span className="w-2 h-6 bg-purple-500 rounded-sm"></span>
             Trending Discussions
           </h2>
           
           {/* Horizontal Scroll Container */}
           <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide">
              {trendingMovies.map((movie) => (
                <div key={movie.id} className="min-w-[280px] bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => navigate(`/movie/${movie.id}`)}>
                    <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${movie.backdrop})` }}></div>
                    <div className="p-4">
                      <h4 className="font-bold text-white mb-2">{movie.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{movie.desc}</p>
                      
                      {/* Secondary Button Style */}
                      <button className="mt-4 w-full py-2 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-all uppercase tracking-wider">
                         View Details
                      </button>
                    </div>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Home;