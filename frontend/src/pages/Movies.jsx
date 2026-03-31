import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import BrowseSidebarFilters from '../components/BrowseSidebarFilters';
import { NO_POSTER_IMAGE, handleImageError } from '../utils/imageFallback';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest First' },
  { value: 'primary_release_date.asc', label: 'Oldest First' },
  { value: 'revenue.desc', label: 'Highest Revenue' },
  { value: 'vote_count.desc', label: 'Most Voted' },
];

const YEAR_OPTIONS = [
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2020s', label: '2020s' },
  { value: '2010s', label: '2010s' },
  { value: '2000s', label: '2000s' },
  { value: '90s', label: '90s' },
  { value: '80s', label: '80s' },
  { value: 'classic', label: 'Classic' },
];

const RATING_OPTIONS = [
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
  { value: 9, label: '9+' },
];

function getYearRange(val) {
  if (!val) return {};
  const y = parseInt(val);
  if (!isNaN(y) && y >= 1900) return { gte: `${y}-01-01`, lte: `${y}-12-31` };
  if (val === '2020s') return { gte: '2020-01-01', lte: '2029-12-31' };
  if (val === '2010s') return { gte: '2010-01-01', lte: '2019-12-31' };
  if (val === '2000s') return { gte: '2000-01-01', lte: '2009-12-31' };
  if (val === '90s') return { gte: '1990-01-01', lte: '1999-12-31' };
  if (val === '80s') return { gte: '1980-01-01', lte: '1989-12-31' };
  if (val === 'classic') return { lte: '1979-12-31' };
  return {};
}

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPages = () => {
    const pages = [];
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-10 pt-8 border-t border-slate-800/50">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Prev
      </button>
      <div className="flex items-center gap-1">
        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={`dot-${i}`} className="px-2 text-slate-600">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                page === currentPage
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
      >
        Next
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
};

const Movies = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const genreFromState = location.state?.genreId;

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(genreFromState || null);
  const [selectedSort, setSelectedSort] = useState('popularity.desc');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let url;
        if (searchQuery.trim()) {
          url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
        } else {
          url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${selectedSort}&page=${currentPage}&vote_count.gte=50`;
          if (selectedGenre) url += `&with_genres=${selectedGenre}`;
          const yr = getYearRange(selectedYear);
          if (yr.gte) url += `&primary_release_date.gte=${yr.gte}`;
          if (yr.lte) url += `&primary_release_date.lte=${yr.lte}`;
          if (selectedRating) url += `&vote_average.gte=${selectedRating}`;
        }
        const response = await axios.get(url);
        const results = response.data.results || [];
        const normalized = results.map(m => ({
          id: m.id,
          title: m.title,
          image: m.poster_path ? `${IMG_BASE}${m.poster_path}` : null,
          poster_path: m.poster_path,
          overview: m.overview,
          year: m.release_date?.slice(0, 4) || '',
          rating: m.vote_average ? m.vote_average.toFixed(1) : null,
          genre_ids: m.genre_ids || [],
        }));
        setMovies(normalized);
        setTotalPages(Math.min(response.data.total_pages || 1, 20));
        setTotalResults(response.data.total_results || 0);
      } catch (err) {
        console.error('Failed to fetch movies:', err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchMovies, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedGenre, selectedSort, selectedYear, selectedRating, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedGenre, selectedSort, selectedYear, selectedRating]);
  useEffect(() => { if (genreFromState) setSelectedGenre(genreFromState); }, [genreFromState]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre(null);
    setSelectedSort('popularity.desc');
    setSelectedYear(null);
    setSelectedRating(null);
    setCurrentPage(1);
  };

  const activeFilterCount =
    Number(Boolean(searchQuery)) +
    Number(Boolean(selectedGenre)) +
    Number(selectedSort !== 'popularity.desc') +
    Number(Boolean(selectedYear)) +
    Number(Boolean(selectedRating));

  const hasFilters = activeFilterCount > 0;

  // Active filter chips
  const filterChips = [];
  if (searchQuery) filterChips.push({ label: `"${searchQuery}"`, onRemove: () => setSearchQuery('') });
  if (selectedGenre) filterChips.push({ label: GENRES.find(g => g.id === selectedGenre)?.name, onRemove: () => setSelectedGenre(null) });
  if (selectedSort !== 'popularity.desc') filterChips.push({ label: SORT_OPTIONS.find(s => s.value === selectedSort)?.label, onRemove: () => setSelectedSort('popularity.desc') });
  if (selectedYear) filterChips.push({ label: YEAR_OPTIONS.find(y => y.value === selectedYear)?.label || selectedYear, onRemove: () => setSelectedYear(null) });
  if (selectedRating) filterChips.push({ label: `${selectedRating}+ Rating`, onRemove: () => setSelectedRating(null) });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-purple-900/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.15),transparent_60%)]"></div>
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Movies</h1>
              <p className="text-slate-400 text-sm mt-0.5">Discover and explore movies from around the world</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <BrowseSidebarFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search movies..."
            sortOptions={SORT_OPTIONS}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
            groups={[
              {
                id: 'genre',
                label: 'Genres',
                options: GENRES,
                selectedValue: selectedGenre,
                onChange: setSelectedGenre,
                showAllOption: true,
                allValue: null,
                allLabel: 'All Genres',
                allowDeselect: true,
              },
            ]}
            yearOptions={YEAR_OPTIONS}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            ratingOptions={RATING_OPTIONS}
            selectedRating={selectedRating}
            onRatingChange={setSelectedRating}
            hasActiveFilters={hasFilters}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
          />

          <div className="flex-1 min-w-0">
            {/* Active Filter Chips + Result Count */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-sm text-slate-500">
                {loading ? 'Loading...' : `${totalResults.toLocaleString()} movies found`}
              </span>
              {filterChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  {filterChips.map((chip, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full text-xs text-slate-300">
                      {chip.label}
                      <button onClick={chip.onRemove} className="text-slate-500 hover:text-red-400 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-red-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
                </div>
                <p className="text-slate-500 text-sm">Loading movies...</p>
              </div>
            ) : movies.length === 0 ? (
              <div className="text-center py-24 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <p className="text-slate-400 font-medium mb-1">No movies found</p>
                <p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-4 text-red-400 text-sm hover:text-red-300 transition-colors">Clear all filters</button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {movies.map(movie => {
                    const imageUrl = movie.image || (movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : NO_POSTER_IMAGE);
                    return (
                      <div
                        key={movie.id}
                        onClick={() => navigate(`/movie/${movie.id}`)}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2.5 border border-slate-800/50 group-hover:border-red-500/40 shadow-lg shadow-black/30 group-hover:shadow-red-500/10 transition-all duration-300 group-hover:-translate-y-1">
                          <img
                            src={imageUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={handleImageError}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                          
                          {/* Rating badge */}
                          {movie.rating && parseFloat(movie.rating) > 0 && (
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <span className="text-[11px] font-bold text-white">{movie.rating}</span>
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <p className="text-white font-bold text-sm truncate mb-0.5">{movie.title}</p>
                            {movie.year && <p className="text-slate-400 text-xs">{movie.year}</p>}
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                View Details
                              </span>
                            </div>
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm truncate group-hover:text-red-400 transition-colors">{movie.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-500">{movie.year}</p>
                          {movie.rating && parseFloat(movie.rating) > 0 && (
                            <span className="text-xs text-slate-600 flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                              {movie.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Movies;