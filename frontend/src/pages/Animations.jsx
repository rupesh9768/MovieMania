import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrowseSidebarFilters from '../components/BrowseSidebarFilters';
import { NO_POSTER_IMAGE, handleImageError } from '../utils/imageFallback';
import { getBatchRatings } from '../api/ratingService';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const ANIMATION_GENRE_ID = 16;

const CATEGORIES = [
  { id: 'all', name: 'All Animations' },
  { id: 'movie', name: 'Animated Movies' },
  { id: 'tv', name: 'Animated Series' },
];

const SUB_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 878, name: 'Sci-Fi' },
  { id: 18, name: 'Drama' },
  { id: 10749, name: 'Romance' },
  { id: 9648, name: 'Mystery' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest First' },
  { value: 'primary_release_date.asc', label: 'Oldest First' },
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
      <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>Prev
      </button>
      <div className="flex items-center gap-1">
        {getPages().map((page, i) => page === '...' ? (
          <span key={`dot-${i}`} className="px-2 text-slate-600">...</span>
        ) : (
          <button key={page} onClick={() => onPageChange(page)} className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === currentPage ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>{page}</button>
        ))}
      </div>
      <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
        Next<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
};

const Animations = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubGenre, setSelectedSubGenre] = useState(null);
  const [selectedSort, setSelectedSort] = useState('popularity.desc');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [siteRatings, setSiteRatings] = useState({});

  useEffect(() => {
    const fetchAnimations = async () => {
      setLoading(true);
      try {
        let results = [];
        let pages = 1;
        let total = 0;

        if (searchQuery.trim()) {
          if (selectedCategory === 'all' || selectedCategory === 'movie') {
            const movieRes = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`);
            const movieData = await movieRes.json();
            const animatedMovies = (movieData.results || [])
              .filter(m => m.genre_ids?.includes(ANIMATION_GENRE_ID))
              .map(m => ({ ...m, media_type: 'movie' }));
            results = [...results, ...animatedMovies];
            pages = Math.max(pages, movieData.total_pages || 1);
            total += movieData.total_results || 0;
          }
          if (selectedCategory === 'all' || selectedCategory === 'tv') {
            const tvRes = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${currentPage}`);
            const tvData = await tvRes.json();
            const animatedTV = (tvData.results || [])
              .filter(t => t.genre_ids?.includes(ANIMATION_GENRE_ID))
              .map(t => ({ ...t, media_type: 'tv' }));
            results = [...results, ...animatedTV];
            pages = Math.max(pages, tvData.total_pages || 1);
            total += tvData.total_results || 0;
          }
        } else {
          const genreQuery = selectedSubGenre
            ? `${ANIMATION_GENRE_ID},${selectedSubGenre}`
            : ANIMATION_GENRE_ID;

          const yr = getYearRange(selectedYear);

          if (selectedCategory === 'all' || selectedCategory === 'movie') {
            let movieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreQuery}&page=${currentPage}&sort_by=${selectedSort}&vote_count.gte=20`;
            if (yr.gte) movieUrl += `&primary_release_date.gte=${yr.gte}`;
            if (yr.lte) movieUrl += `&primary_release_date.lte=${yr.lte}`;
            if (selectedRating) movieUrl += `&vote_average.gte=${selectedRating}`;
            const movieRes = await fetch(movieUrl);
            const movieData = await movieRes.json();
            const movies = (movieData.results || []).map(m => ({ ...m, media_type: 'movie' }));
            results = [...results, ...movies];
            pages = Math.max(pages, movieData.total_pages || 1);
            total += movieData.total_results || 0;
          }
          if (selectedCategory === 'all' || selectedCategory === 'tv') {
            let tvUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreQuery}&page=${currentPage}&sort_by=${selectedSort}&vote_count.gte=20`;
            if (yr.gte) tvUrl += `&first_air_date.gte=${yr.gte}`;
            if (yr.lte) tvUrl += `&first_air_date.lte=${yr.lte}`;
            if (selectedRating) tvUrl += `&vote_average.gte=${selectedRating}`;
            const tvRes = await fetch(tvUrl);
            const tvData = await tvRes.json();
            const tvShows = (tvData.results || []).map(t => ({ ...t, media_type: 'tv' }));
            results = [...results, ...tvShows];
            pages = Math.max(pages, tvData.total_pages || 1);
            total += tvData.total_results || 0;
          }
        }

        results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        setItems(results);
        setTotalPages(Math.min(pages, 20));
        setTotalResults(total);

        // Fetch site ratings
        try {
          const movieIds = results.map(r => r.id);
          if (movieIds.length > 0) {
            const ratingsMap = await getBatchRatings(movieIds);
            setSiteRatings(ratingsMap);
          }
        } catch (e) {
          console.error('Failed to fetch site ratings:', e);
        }
      } catch (err) {
        console.error('Failed to fetch animations:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchAnimations, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedCategory, selectedSubGenre, selectedSort, selectedYear, selectedRating, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, selectedSubGenre, selectedSort, selectedYear, selectedRating]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubGenre(null);
    setSelectedSort('popularity.desc');
    setSelectedYear(null);
    setSelectedRating(null);
    setCurrentPage(1);
  };

  const activeFilterCount =
    Number(Boolean(searchQuery)) +
    Number(selectedCategory !== 'all') +
    Number(Boolean(selectedSubGenre)) +
    Number(selectedSort !== 'popularity.desc') +
    Number(Boolean(selectedYear)) +
    Number(Boolean(selectedRating));

  const hasFilters = activeFilterCount > 0;

  const filterChips = [];
  if (searchQuery) filterChips.push({ label: `"${searchQuery}"`, onRemove: () => setSearchQuery('') });
  if (selectedCategory !== 'all') filterChips.push({ label: CATEGORIES.find(c => c.id === selectedCategory)?.name, onRemove: () => setSelectedCategory('all') });
  if (selectedSubGenre) filterChips.push({ label: SUB_GENRES.find(g => g.id === selectedSubGenre)?.name, onRemove: () => setSelectedSubGenre(null) });
  if (selectedSort !== 'popularity.desc') filterChips.push({ label: SORT_OPTIONS.find(s => s.value === selectedSort)?.label, onRemove: () => setSelectedSort('popularity.desc') });
  if (selectedYear) filterChips.push({ label: YEAR_OPTIONS.find(y => y.value === selectedYear)?.label || selectedYear, onRemove: () => setSelectedYear(null) });
  if (selectedRating) filterChips.push({ label: `${selectedRating}+ Rating`, onRemove: () => setSelectedRating(null) });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-transparent to-teal-900/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.12),transparent_60%)]"></div>
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Animations</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Animated movies and series from around the world
                <span className="mx-2 text-slate-600">|</span>
                <button onClick={() => navigate('/anime')} className="text-pink-400 hover:text-pink-300 transition-colors font-medium">
                  Looking for Anime?
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <BrowseSidebarFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search animations..."
            sortOptions={SORT_OPTIONS}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
            groups={[
              {
                id: 'category',
                label: 'Category',
                options: CATEGORIES.filter(c => c.id !== 'all'),
                selectedValue: selectedCategory,
                onChange: setSelectedCategory,
                showAllOption: true,
                allValue: 'all',
                allLabel: 'All Animations',
                allowDeselect: false,
              },
              {
                id: 'subgenre',
                label: 'Sub-Genre',
                options: SUB_GENRES,
                selectedValue: selectedSubGenre,
                onChange: setSelectedSubGenre,
                showAllOption: true,
                allValue: null,
                allLabel: 'All Sub-Genres',
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
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-sm text-slate-500">
                {loading ? 'Loading...' : `${totalResults.toLocaleString()} animations found`}
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
                  <div className="absolute inset-0 rounded-full border-4 border-green-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin"></div>
                </div>
                <p className="text-slate-500 text-sm">Loading animations...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-24 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-400 font-medium mb-1">No animations found</p>
                <p className="text-slate-600 text-sm">Try adjusting your filters</p>
                {hasFilters && <button onClick={clearFilters} className="mt-4 text-red-400 text-sm hover:text-red-300 transition-colors">Clear all filters</button>}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {items.map(item => {
                    const isMovie = item.media_type === 'movie' || item.title !== undefined;
                    const title = isMovie ? item.title : item.name;
                    const year = isMovie ? item.release_date?.slice(0, 4) : item.first_air_date?.slice(0, 4);
                    const rating = siteRatings[String(item.id)]?.averageRating > 0 ? siteRatings[String(item.id)].averageRating.toFixed(1) : '0.0';
                    return (
                      <div key={`${item.media_type || 'item'}-${item.id}`} onClick={() => navigate(`/details/animation/${item.id}`)} className="group cursor-pointer">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2.5 border border-slate-800/50 group-hover:border-green-500/40 shadow-lg shadow-black/30 group-hover:shadow-green-500/10 transition-all duration-300 group-hover:-translate-y-1">
                          <img
                            src={item.poster_path ? `${IMG_BASE}${item.poster_path}` : NO_POSTER_IMAGE}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={handleImageError}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                          
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            <span className="text-[11px] font-bold text-white">{rating}</span>
                          </div>

                          <div className="absolute top-2.5 right-2.5 bg-green-500/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold text-white">
                            {isMovie ? 'Movie' : 'TV'}
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <p className="text-white font-bold text-sm truncate mb-0.5">{title}</p>
                            <span className="text-[11px] text-green-400 font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              View Details
                            </span>
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm truncate group-hover:text-green-400 transition-colors">{title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-500">{year || 'TBA'}</p>
                          <span className="text-xs text-slate-600 flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            {rating}
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

export default Animations;