import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrowseSidebarFilters from '../components/BrowseSidebarFilters';
import { NO_POSTER_IMAGE, handleImageError } from '../utils/imageFallback';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

const ANIME_GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 25, name: 'Shoujo' },
  { id: 27, name: 'Shounen' },
  { id: 7, name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Thriller' },
  { id: 13, name: 'Historical' },
  { id: 18, name: 'Mecha' },
  { id: 38, name: 'Military' },
  { id: 40, name: 'Psychological' },
];

const ANIME_TYPES = [
  { id: 'all', name: 'All Types' },
  { id: 'tv', name: 'TV Series' },
  { id: 'movie', name: 'Movies' },
  { id: 'ova', name: 'OVA' },
  { id: 'ona', name: 'ONA' },
  { id: 'special', name: 'Special' },
];

const ANIME_STATUS = [
  { id: 'all', name: 'Any Status' },
  { id: 'airing', name: 'Airing' },
  { id: 'complete', name: 'Completed' },
  { id: 'upcoming', name: 'Upcoming' },
];

const SORT_OPTIONS = [
  { value: 'score', label: 'Highest Rated' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'start_date', label: 'Newest First' },
  { value: 'episodes', label: 'Most Episodes' },
  { value: 'favorites', label: 'Most Favorited' },
];

const RATING_OPTIONS = [
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
  { value: 9, label: '9+' },
];

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

const Anime = () => {
  const navigate = useNavigate();

  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState('score');
  const [selectedRating, setSelectedRating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnime = async () => {
      setLoading(true);
      setError(null);
      try {
        let url;
        if (searchQuery.trim()) {
          url = `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=20&sfw=true`;
        } else {
          url = `${JIKAN_BASE_URL}/top/anime?page=${currentPage}&limit=20`;
          if (selectedSort !== 'score') {
            url = `${JIKAN_BASE_URL}/anime?page=${currentPage}&limit=20&sfw=true&order_by=${selectedSort}&sort=desc`;
          }
        }
        if (selectedType !== 'all') url += `&type=${selectedType}`;
        if (selectedGenre) url += `&genres=${selectedGenre}`;
        if (selectedStatus !== 'all') url += `&status=${selectedStatus}`;
        if (selectedRating) url += `&min_score=${selectedRating}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch anime');
        const data = await res.json();
        setAnimeList(data.data || []);
        setTotalPages(data.pagination?.last_visible_page || 1);
        setTotalResults(data.pagination?.items?.total || data.data?.length || 0);
      } catch (err) {
        console.error('Failed to fetch anime:', err);
        setError('Failed to load anime. Please try again.');
        setAnimeList([]);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchAnime, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedType, selectedGenre, selectedStatus, selectedSort, selectedRating, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedType, selectedGenre, selectedStatus, selectedSort, selectedRating]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedGenre(null);
    setSelectedStatus('all');
    setSelectedSort('score');
    setSelectedRating(null);
    setCurrentPage(1);
  };

  const activeFilterCount =
    Number(Boolean(searchQuery)) +
    Number(selectedType !== 'all') +
    Number(Boolean(selectedGenre)) +
    Number(selectedStatus !== 'all') +
    Number(selectedSort !== 'score') +
    Number(Boolean(selectedRating));

  const hasFilters = activeFilterCount > 0;

  const filterChips = [];
  if (searchQuery) filterChips.push({ label: `"${searchQuery}"`, onRemove: () => setSearchQuery('') });
  if (selectedType !== 'all') filterChips.push({ label: ANIME_TYPES.find(t => t.id === selectedType)?.name, onRemove: () => setSelectedType('all') });
  if (selectedGenre) filterChips.push({ label: ANIME_GENRES.find(g => g.id === selectedGenre)?.name, onRemove: () => setSelectedGenre(null) });
  if (selectedStatus !== 'all') filterChips.push({ label: ANIME_STATUS.find(s => s.id === selectedStatus)?.name, onRemove: () => setSelectedStatus('all') });
  if (selectedSort !== 'score') filterChips.push({ label: SORT_OPTIONS.find(s => s.value === selectedSort)?.label, onRemove: () => setSelectedSort('score') });
  if (selectedRating) filterChips.push({ label: `${selectedRating}+ Rating`, onRemove: () => setSelectedRating(null) });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-transparent to-purple-900/15"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(236,72,153,0.15),transparent_60%)]"></div>
        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-2xl">
              ??
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Anime</h1>
              <p className="text-slate-400 text-sm mt-0.5">Discover Japanese anime series, movies, and OVAs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <BrowseSidebarFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search anime..."
            sortOptions={SORT_OPTIONS}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
            groups={[
              {
                id: 'type',
                label: 'Type',
                options: ANIME_TYPES.filter(t => t.id !== 'all'),
                selectedValue: selectedType,
                onChange: setSelectedType,
                showAllOption: true,
                allValue: 'all',
                allLabel: 'All Types',
                allowDeselect: false,
              },
              {
                id: 'status',
                label: 'Status',
                options: ANIME_STATUS.filter(s => s.id !== 'all'),
                selectedValue: selectedStatus,
                onChange: setSelectedStatus,
                showAllOption: true,
                allValue: 'all',
                allLabel: 'Any Status',
                allowDeselect: false,
              },
              {
                id: 'genre',
                label: 'Genre',
                options: ANIME_GENRES,
                selectedValue: selectedGenre,
                onChange: setSelectedGenre,
                showAllOption: true,
                allValue: null,
                allLabel: 'All Genres',
                allowDeselect: true,
              },
            ]}
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
                {loading ? 'Loading...' : `${totalResults.toLocaleString()} anime found`}
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

            {error && (
              <div className="text-center py-10 mb-6 bg-red-500/5 rounded-2xl border border-red-500/20">
                <p className="text-red-400 font-medium">{error}</p>
                <button onClick={clearFilters} className="mt-2 text-sm text-slate-400 hover:text-white transition-colors">Try again</button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-pink-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin"></div>
                </div>
                <p className="text-slate-500 text-sm">Loading anime...</p>
              </div>
            ) : animeList.length === 0 && !error ? (
              <div className="text-center py-24 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                <div className="text-5xl mb-4">??</div>
                <p className="text-slate-400 font-medium mb-1">No anime found</p>
                <p className="text-slate-600 text-sm">Try adjusting your filters</p>
                {hasFilters && <button onClick={clearFilters} className="mt-4 text-red-400 text-sm hover:text-red-300 transition-colors">Clear all filters</button>}
              </div>
            ) : !error && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {animeList.map(anime => (
                    <div key={anime.mal_id} onClick={() => navigate(`/details/anime/${anime.mal_id}`)} className="group cursor-pointer">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2.5 border border-slate-800/50 group-hover:border-pink-500/40 shadow-lg shadow-black/30 group-hover:shadow-pink-500/10 transition-all duration-300 group-hover:-translate-y-1">
                        <img
                          src={anime.images?.jpg?.image_url || NO_POSTER_IMAGE}
                          alt={anime.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={handleImageError}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                        
                        {/* Rating badge */}
                        {anime.score && (
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            <span className="text-[11px] font-bold text-white">{anime.score.toFixed(1)}</span>
                          </div>
                        )}

                        {/* Type badge */}
                        {anime.type && (
                          <div className="absolute top-2.5 right-2.5 bg-pink-500/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold text-white">
                            {anime.type}
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <p className="text-white font-bold text-sm truncate mb-0.5">{anime.title}</p>
                          <span className="text-[11px] text-pink-400 font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            View Details
                          </span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm truncate group-hover:text-pink-400 transition-colors">{anime.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-500">{anime.aired?.prop?.from?.year || 'TBA'}</p>
                        {anime.score && (
                          <span className="text-xs text-slate-600 flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            {anime.score.toFixed(1)}
                          </span>
                        )}
                        {anime.episodes && (
                          <span className="text-xs text-slate-600">{anime.episodes} eps</span>
                        )}
                      </div>
                    </div>
                  ))}
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

export default Anime;