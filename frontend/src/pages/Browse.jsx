import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BrowseSidebarFilters from '../components/BrowseSidebarFilters';
import { NO_POSTER_IMAGE, handleImageError } from '../utils/imageFallback';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const MOVIE_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
];

const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' }, { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' }, { id: 10767, name: 'Talk' }, { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
];

const COUNTRIES = [
  { id: 'US', name: 'United States' }, { id: 'GB', name: 'United Kingdom' },
  { id: 'KR', name: 'South Korea' }, { id: 'JP', name: 'Japan' },
  { id: 'IN', name: 'India' }, { id: 'FR', name: 'France' },
  { id: 'DE', name: 'Germany' }, { id: 'ES', name: 'Spain' },
  { id: 'IT', name: 'Italy' }, { id: 'CN', name: 'China' },
  { id: 'CA', name: 'Canada' }, { id: 'AU', name: 'Australia' },
  { id: 'BR', name: 'Brazil' }, { id: 'MX', name: 'Mexico' },
  { id: 'TH', name: 'Thailand' }, { id: 'TR', name: 'Turkey' },
];

const CONTENT_TYPES = [
  { id: 'all', name: 'All' },
  { id: 'movie', name: 'Movies' },
  { id: 'tv', name: 'TV Shows' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'release_date.asc', label: 'Oldest First' },
  { value: 'vote_count.desc', label: 'Most Voted' },
];

const YEAR_OPTIONS = [
  { value: '2026', label: '2026' }, { value: '2025', label: '2025' },
  { value: '2024', label: '2024' }, { value: '2023', label: '2023' },
  { value: '2020s', label: '2020s' }, { value: '2010s', label: '2010s' },
  { value: '2000s', label: '2000s' }, { value: '90s', label: '90s' },
  { value: '80s', label: '80s' }, { value: 'classic', label: 'Classic' },
];

const RATING_OPTIONS = [
  { value: 6, label: '6+' }, { value: 7, label: '7+' },
  { value: 8, label: '8+' }, { value: 9, label: '9+' },
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
      <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Prev
      </button>
      <div className="flex items-center gap-1">
        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={`dot-${i}`} className="px-2 text-slate-600">...</span>
          ) : (
            <button key={page} onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                page === currentPage ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}>{page}</button>
          )
        )}
      </div>
      <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
        Next
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
};

const Browse = () => {
  const navigate = useNavigate();

  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedSort, setSelectedSort] = useState('popularity.desc');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const getGenres = () => {
    if (contentType === 'tv') return TV_GENRES;
    if (contentType === 'movie') return MOVIE_GENRES;
    return MOVIE_GENRES;
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        let allResults = [];

        if (searchQuery.trim()) {
          if (contentType === 'all' || contentType === 'movie') {
            const res = await axios.get(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`);
            allResults = [...allResults, ...(res.data.results || []).map(m => ({ ...m, mediaType: 'movie' }))];
          }
          if (contentType === 'all' || contentType === 'tv') {
            const res = await axios.get(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`);
            allResults = [...allResults, ...(res.data.results || []).map(t => ({ ...t, mediaType: 'tv' }))];
          }
          setTotalResults(allResults.length);
          setTotalPages(1);
        } else {
          const buildUrl = (type) => {
            const sortParam = selectedSort === 'release_date.desc'
              ? (type === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc')
              : selectedSort === 'release_date.asc'
              ? (type === 'tv' ? 'first_air_date.asc' : 'primary_release_date.asc')
              : selectedSort;
            let url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}&sort_by=${sortParam}&page=${currentPage}&vote_count.gte=50`;
            if (selectedGenre) url += `&with_genres=${selectedGenre}`;
            if (selectedCountry) url += `&with_origin_country=${selectedCountry}`;
            const yr = getYearRange(selectedYear);
            const dateField = type === 'tv' ? 'first_air_date' : 'primary_release_date';
            if (yr.gte) url += `&${dateField}.gte=${yr.gte}`;
            if (yr.lte) url += `&${dateField}.lte=${yr.lte}`;
            if (selectedRating) url += `&vote_average.gte=${selectedRating}`;
            return url;
          };

          if (contentType === 'all') {
            const [movieRes, tvRes] = await Promise.all([
              axios.get(buildUrl('movie')),
              axios.get(buildUrl('tv'))
            ]);
            const movies = (movieRes.data.results || []).map(m => ({ ...m, mediaType: 'movie' }));
            const tvShows = (tvRes.data.results || []).map(t => ({ ...t, mediaType: 'tv' }));
            const maxLen = Math.max(movies.length, tvShows.length);
            for (let i = 0; i < maxLen; i++) {
              if (movies[i]) allResults.push(movies[i]);
              if (tvShows[i]) allResults.push(tvShows[i]);
            }
            setTotalPages(Math.min(Math.max(movieRes.data.total_pages, tvRes.data.total_pages), 20));
            setTotalResults((movieRes.data.total_results || 0) + (tvRes.data.total_results || 0));
          } else if (contentType === 'movie') {
            const res = await axios.get(buildUrl('movie'));
            allResults = (res.data.results || []).map(m => ({ ...m, mediaType: 'movie' }));
            setTotalPages(Math.min(res.data.total_pages || 1, 20));
            setTotalResults(res.data.total_results || 0);
          } else if (contentType === 'tv') {
            const res = await axios.get(buildUrl('tv'));
            allResults = (res.data.results || []).map(t => ({ ...t, mediaType: 'tv' }));
            setTotalPages(Math.min(res.data.total_pages || 1, 20));
            setTotalResults(res.data.total_results || 0);
          }
        }

        const normalized = allResults.map(item => ({
          id: item.id,
          title: item.title || item.name,
          image: item.poster_path ? `${IMG_BASE}${item.poster_path}` : null,
          poster_path: item.poster_path,
          year: (item.release_date || item.first_air_date || '').slice(0, 4),
          mediaType: item.mediaType,
          rating: item.vote_average ? item.vote_average.toFixed(1) : null,
        }));

        setContent(normalized);
      } catch (err) {
        console.error('Failed to fetch content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchContent, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, contentType, selectedGenre, selectedCountry, selectedSort, selectedYear, selectedRating, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, contentType, selectedGenre, selectedCountry, selectedSort, selectedYear, selectedRating]);

  const clearFilters = () => {
    setSearchQuery('');
    setContentType('all');
    setSelectedGenre(null);
    setSelectedCountry(null);
    setSelectedSort('popularity.desc');
    setSelectedYear(null);
    setSelectedRating(null);
    setCurrentPage(1);
  };

  const activeFilterCount =
    Number(Boolean(searchQuery)) +
    Number(contentType !== 'all') +
    Number(Boolean(selectedGenre)) +
    Number(Boolean(selectedCountry)) +
    Number(selectedSort !== 'popularity.desc') +
    Number(Boolean(selectedYear)) +
    Number(Boolean(selectedRating));

  const hasFilters = activeFilterCount > 0;

  const filterChips = [];
  if (searchQuery) filterChips.push({ label: `"${searchQuery}"`, onRemove: () => setSearchQuery('') });
  if (contentType !== 'all') filterChips.push({ label: CONTENT_TYPES.find(t => t.id === contentType)?.name, onRemove: () => setContentType('all') });
  if (selectedGenre) filterChips.push({ label: getGenres().find(g => g.id === selectedGenre)?.name, onRemove: () => setSelectedGenre(null) });
  if (selectedCountry) filterChips.push({ label: COUNTRIES.find(c => c.id === selectedCountry)?.name, onRemove: () => setSelectedCountry(null) });
  if (selectedSort !== 'popularity.desc') filterChips.push({ label: SORT_OPTIONS.find(s => s.value === selectedSort)?.label, onRemove: () => setSelectedSort('popularity.desc') });
  if (selectedYear) filterChips.push({ label: YEAR_OPTIONS.find(y => y.value === selectedYear)?.label || selectedYear, onRemove: () => setSelectedYear(null) });
  if (selectedRating) filterChips.push({ label: `${selectedRating}+ Rating`, onRemove: () => setSelectedRating(null) });

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-5xl mb-4 text-red-400 font-bold">!</div>
          <h2 className="text-lg font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-5">{error}</p>
          <button onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-400 text-white font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer">
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Browse All</h1>
              <p className="text-slate-400 text-sm mt-0.5">Discover movies and TV shows from around the world</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <BrowseSidebarFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search movies & TV shows..."
            sortOptions={SORT_OPTIONS}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
            groups={[
              {
                id: 'contentType',
                label: 'Content Type',
                options: CONTENT_TYPES,
                selectedValue: contentType,
                onChange: setContentType,
                allValue: 'all',
                allowDeselect: false,
              },
              {
                id: 'genre',
                label: 'Genres',
                options: getGenres(),
                selectedValue: selectedGenre,
                onChange: setSelectedGenre,
                showAllOption: true,
                allValue: null,
                allLabel: 'All Genres',
                allowDeselect: true,
              },
              {
                id: 'country',
                label: 'Country',
                options: COUNTRIES,
                selectedValue: selectedCountry,
                onChange: setSelectedCountry,
                showAllOption: true,
                allValue: null,
                allLabel: 'All Countries',
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
                {loading ? 'Loading...' : `${totalResults.toLocaleString()} results found`}
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
                <p className="text-slate-500 text-sm">Loading content...</p>
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-24 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <p className="text-slate-400 font-medium mb-1">No results found</p>
                <p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-4 text-red-400 text-sm hover:text-red-300 transition-colors">Clear all filters</button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {content.map((item, index) => {
                    const imageUrl = item.image || NO_POSTER_IMAGE;
                    return (
                      <div
                        key={`${item.mediaType}-${item.id}-${index}`}
                        onClick={() => navigate(`/details/${item.mediaType}/${item.id}`)}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2.5 border border-slate-800/50 group-hover:border-red-500/40 shadow-lg shadow-black/30 group-hover:shadow-red-500/10 transition-all duration-300 group-hover:-translate-y-1">
                          <img src={imageUrl} alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={handleImageError} loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>

                          {/* Rating badge */}
                          {item.rating && parseFloat(item.rating) > 0 && (
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <span className="text-[11px] font-bold text-white">{item.rating}</span>
                            </div>
                          )}

                          {/* Media Type Badge */}
                          <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-sm ${
                            item.mediaType === 'movie' ? 'bg-red-500/90 text-white' : 'bg-blue-500/90 text-white'
                          }`}>
                            {item.mediaType === 'movie' ? 'Movie' : 'TV'}
                          </div>

                          {/* Hover overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <p className="text-white font-bold text-sm truncate mb-0.5">{item.title}</p>
                            {item.year && <p className="text-slate-400 text-xs">{item.year}</p>}
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                View Details
                              </span>
                            </div>
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm truncate group-hover:text-red-400 transition-colors">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-500">{item.year}</p>
                          {item.rating && parseFloat(item.rating) > 0 && (
                            <span className="text-xs text-slate-600 flex items-center gap-0.5">
                              <svg className="w-2.5 h-2.5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                              {item.rating}
                            </span>
                          )}
                          <span className={`text-[10px] ml-auto font-medium ${item.mediaType === 'movie' ? 'text-red-400/60' : 'text-blue-400/60'}`}>
                            {item.mediaType === 'movie' ? 'Movie' : 'TV'}
                          </span>
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

export default Browse;
