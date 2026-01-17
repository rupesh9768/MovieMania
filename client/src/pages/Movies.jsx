import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- MOCK DATA (The "Database") ---
const allMovies = [
  { id: 1, title: "Avengers: Doomsday", genre: "Action", rating: 4.8, status: "now_showing", image: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" },
  { id: 2, title: "Dune: Part Three", genre: "Sci-Fi", rating: 4.6, status: "now_showing", image: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
  { id: 3, title: "Spider-Man: Beyond", genre: "Animation", rating: 4.9, status: "now_showing", image: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg" },
  { id: 4, title: "The Batman II", genre: "Crime", rating: 4.7, status: "now_showing", image: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg" },
  { id: 5, title: "Oppenheimer", genre: "Drama", rating: 4.8, status: "coming_soon", image: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { id: 6, title: "Interstellar", genre: "Sci-Fi", rating: 4.9, status: "coming_soon", image: "https://image.tmdb.org/t/p/w500/gEU2QniL6E8ahMcafCU74TotNw8.jpg" },
  { id: 7, title: "Joker: Folie à Deux", genre: "Drama", rating: 4.2, status: "coming_soon", image: "https://image.tmdb.org/t/p/w500/aciP8Km0waTLXEYf5ybFK5CSUxl.jpg" },
  { id: 8, title: "Deadpool 3", genre: "Action", rating: 4.5, status: "coming_soon", image: "https://image.tmdb.org/t/p/w500/yF1eOkaYvwy45m5zpjWfxpjeMv6.jpg" },
];

const Movies = () => {
  const navigate = useNavigate();
  
  // State for Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'now_showing', 'coming_soon'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Genres List
  const genres = ['All', 'Action', 'Sci-Fi', 'Drama', 'Animation', 'Crime'];

  // FILTER LOGIC
  const filteredMovies = allMovies.filter(movie => {
    // 1. Filter by Tab (Status)
    const matchesTab = activeTab === 'all' ? true : movie.status === activeTab;
    // 2. Filter by Search Text
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    // 3. Filter by Genre
    const matchesGenre = selectedGenre === 'All' ? true : movie.genre.includes(selectedGenre);

    return matchesTab && matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-[#0b1121] text-white pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black mb-2">Explore Movies</h1>
            <p className="text-slate-400">Find your next cinematic experience.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <input 
              type="text" 
              placeholder="Search movies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-full py-3 px-6 pl-12 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            {/* Search Icon */}
            <svg className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* CONTROLS (Tabs & Genres) */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 border-b border-slate-800 pb-6">
          
          {/* Status Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All Movies' },
              { id: 'now_showing', label: 'Now Showing' },
              { id: 'coming_soon', label: 'Coming Soon' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === tab.id 
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Genre Filters */}
          <div className="flex gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-hide">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                  selectedGenre === genre
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* MOVIES GRID */}
        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <div 
                key={movie.id} 
                className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Image Area */}
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img src={movie.image} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  
                  {/* Overlay Button */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className={`font-bold py-2 px-6 rounded-full transform scale-90 group-hover:scale-100 transition-all ${
                        movie.status === 'now_showing' 
                        ? 'bg-cyan-500 text-black hover:bg-cyan-400' 
                        : 'bg-white text-black hover:bg-slate-200'
                      }`}
                    >
                      {movie.status === 'now_showing' ? 'Book Ticket' : 'View Details'}
                    </button>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-4">
                  <h3 className="font-bold text-white truncate mb-1">{movie.title}</h3>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>{movie.genre}</span>
                    <span className="flex items-center text-yellow-500 gap-1">★ {movie.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-slate-600 mb-2">No movies found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Movies;