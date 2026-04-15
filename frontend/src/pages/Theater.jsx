import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendApi } from '../api';

// Theater page - movies currently playing
const Theater = () => {
  const navigate = useNavigate();
  
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('all');
  const [selectedTheaterId, setSelectedTheaterId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [nowPlaying, theaterList, cityList] = await Promise.all([
          backendApi.getBackendNowPlaying(),
          backendApi.getTheaters(true),
          backendApi.getCities()
        ]);
        setMovies(nowPlaying);
        setTheaters(theaterList || []);
        setCities(cityList || []);
        
      } catch (err) {
        console.error('Failed to fetch theater data:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter theaters by selected city
  const filteredTheaters = selectedCityId === 'all'
    ? theaters
    : theaters.filter((t) => t.city?._id === selectedCityId || t.city === selectedCityId);

  // Reset theater selection when city changes
  const handleCityChange = (cityId) => {
    setSelectedCityId(cityId);
    setSelectedTheaterId('all');
  };

  // Filter movies: by selected theater or by all theaters in selected city
  const filteredMovies = (() => {
    if (selectedTheaterId !== 'all') {
      return movies.filter((movie) => {
        const showtimes = movie._raw?.showtimes || [];
        return showtimes.some((st) => st.theater === selectedTheaterId);
      });
    }
    if (selectedCityId !== 'all') {
      const theaterIdsInCity = new Set(filteredTheaters.map((t) => t._id));
      return movies.filter((movie) => {
        const showtimes = movie._raw?.showtimes || [];
        return showtimes.some((st) => theaterIdsInCity.has(st.theater));
      });
    }
    return movies;
  })();

  const handleBookNow = (movie) => {
    const state = { movie };
    if (selectedTheaterId !== 'all') {
      state.selectedTheaterId = selectedTheaterId;
      const theater = theaters.find((t) => t._id === selectedTheaterId);
      if (theater) state.selectedTheaterName = theater.name;
    }
    navigate(`/theater/${movie.id}`, { state });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading theater movies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">

      {/* Top bar with filters */}
      <div className="sticky top-0 z-30 bg-dark-bg/90 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4">
          <h1 className="text-xl font-black tracking-tight mr-auto">
            <span className="text-red-500">Now</span> Showing
          </h1>

          {/* City dropdown */}
          {cities.length > 0 && (
            <div className="relative">
              <select
                value={selectedCityId}
                onChange={(e) => handleCityChange(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl pl-4 pr-9 py-2.5 text-sm font-semibold text-white focus:border-red-500 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="all">All Cities</option>
                {cities.map((city) => (
                  <option key={city._id} value={city._id}>{city.name}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          )}

          {/* Theater dropdown */}
          {filteredTheaters.length > 0 && (
            <div className="relative">
              <select
                value={selectedTheaterId}
                onChange={(e) => setSelectedTheaterId(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl pl-4 pr-9 py-2.5 text-sm font-semibold text-white focus:border-red-500 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="all">All Theaters</option>
                {filteredTheaters.map((theater) => (
                  <option key={theater._id} value={theater._id}>{theater.name} — {theater.location}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          )}

          {/* Movie count pill */}
          <span className="text-xs text-slate-500 bg-slate-800/80 px-3 py-1.5 rounded-full font-semibold">
            {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-20">

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center mb-8">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-300 hover:text-red-200 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredMovies.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-slate-800/60 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">{selectedTheaterId !== 'all' ? 'No movies at this theater' : 'No movies showing right now'}</h2>
            <p className="text-slate-500 text-sm">{selectedTheaterId !== 'all' ? 'Try a different theater or check back later.' : 'New releases coming soon!'}</p>
          </div>
        )}

        {/* Movie Grid */}
        {filteredMovies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => handleBookNow(movie)}
                className="group cursor-pointer"
              >
                {/* Poster */}
                <div className="aspect-2/3 relative rounded-xl overflow-hidden mb-3 ring-1 ring-slate-800 group-hover:ring-red-500/60 transition-all duration-300">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Book button on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="bg-red-600 text-white text-xs font-bold py-2 rounded-lg text-center">
                      Book Now
                    </div>
                  </div>

                  {/* Rating */}
                  {movie.rating > 0 && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-yellow-400 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>★</span> {movie.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3 className="font-bold text-sm leading-tight truncate group-hover:text-red-400 transition-colors">{movie.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  {movie.language && <span className="uppercase">{movie.language}</span>}
                  {movie.runtime > 0 && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                      <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                    </>
                  )}
                </div>
                {movie.genres?.length > 0 && (
                  <p className="text-[10px] text-slate-600 mt-1 truncate">{movie.genres.slice(0, 3).join(' · ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Theater;



