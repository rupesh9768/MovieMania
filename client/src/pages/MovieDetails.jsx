import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { adminMovies } from '../data/adminMovies';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// ============================================
// BACKEND-SAFE: MovieDetails handles movie, tv, animation
// Media type is determined from URL path (/movie/:id or /tv/:id)
// ============================================
const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine media type from URL path
  const isTV = location.pathname.startsWith('/tv/');
  const mediaType = isTV ? 'tv' : 'movie';
  
  const isNowShowingFromState = location.state?.isNowShowing;
  
  // State
  const [item, setItem] = useState(null);
  const [cast, setCast] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocalItem, setIsLocalItem] = useState(false);
  const [isNowShowing, setIsNowShowing] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  // ============================================
  // BACKEND-SAFE: Fetch item data
  // This logic can be replaced with backend API call later
  // ============================================
  useEffect(() => {
    const fetchItemData = async () => {
      setLoading(true);
      
      // Check if it's a local/admin movie first (only for movies, not TV)
      if (mediaType === 'movie') {
        const localMovie = adminMovies.find(m => String(m.id) === String(id));
        
        if (localMovie) {
          setItem({
            id: localMovie.id,
            title: localMovie.title,
            name: localMovie.title, // For consistency
            overview: localMovie.description || 'A captivating film experience awaits you at our cinema.',
            poster_path: null,
            localImage: localMovie.image,
            vote_average: localMovie.rating ? localMovie.rating * 2 : 7.5,
            runtime: localMovie.duration ? parseInt(localMovie.duration) : 120,
            release_date: localMovie.releaseDate || '2024',
            genres: localMovie.genre?.split(',').map((g, i) => ({ id: i, name: g.trim() })) || [],
            original_language: 'ne',
            price: localMovie.price,
            mediaType: 'movie'
          });
          setIsLocalItem(true);
          setIsNowShowing(localMovie.isNowShowing || false);
          setLoading(false);
          return;
        }
      }

      // Fetch from TMDB
      try {
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        
        const [itemRes, creditsRes, videosRes, providersRes] = await Promise.all([
          fetch(`${BASE_URL}/${endpoint}/${id}?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/${endpoint}/${id}/credits?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/${endpoint}/${id}/videos?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/${endpoint}/${id}/watch/providers?api_key=${API_KEY}`)
        ]);

        if (!itemRes.ok) throw new Error('Item not found');
        
        const itemData = await itemRes.json();
        
        // Normalize TV and Movie data to have consistent fields
        setItem({
          ...itemData,
          // Ensure title is always available (movies use title, TV uses name)
          title: itemData.title || itemData.name,
          name: itemData.name || itemData.title,
          // Ensure release_date is always available (TV uses first_air_date)
          release_date: itemData.release_date || itemData.first_air_date,
          // For TV shows, convert episode_run_time to runtime
          runtime: itemData.runtime || (itemData.episode_run_time?.[0] || null),
          mediaType: mediaType
        });
        
        setIsNowShowing(isNowShowingFromState || false);
        
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setCast(creditsData.cast?.slice(0, 10) || []);
        }
        
        if (videosRes.ok) {
          const videosData = await videosRes.json();
          const trailerVideo = videosData.results?.find(
            v => v.type === 'Trailer' && v.site === 'YouTube'
          ) || videosData.results?.find(v => v.site === 'YouTube');
          if (trailerVideo) setTrailer(trailerVideo.key);
        }

        if (providersRes.ok) {
          const providersData = await providersRes.json();
          const providers = providersData.results?.US || providersData.results?.IN || Object.values(providersData.results || {})[0];
          setWatchProviders(providers);
        }
      } catch (err) {
        console.error('Failed to fetch item:', err);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchItemData();
  }, [id, mediaType, isNowShowingFromState]);

  // ============================================
  // Helper functions
  // ============================================
  const formatRuntime = (mins) => {
    if (!mins) return 'N/A';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleGenreClick = (genre) => {
    if (mediaType === 'tv') {
      navigate('/tvshows', { state: { genreId: genre.id, genreName: genre.name } });
    } else {
      navigate('/movies', { state: { genreId: genre.id, genreName: genre.name } });
    }
  };

  const getLanguageName = (code) => {
    const langs = { en: 'English', ne: 'Nepali', hi: 'Hindi', ko: 'Korean', ja: 'Japanese', es: 'Spanish', fr: 'French', zh: 'Chinese' };
    return langs[code] || code?.toUpperCase() || 'N/A';
  };

  const handleBack = () => {
    // If there's history, go back; otherwise go to browse
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/browse');
    }
  };

  // ============================================
  // Loading state
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ============================================
  // Not found state
  // ============================================
  if (!item) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-4">
          {mediaType === 'tv' ? 'TV Show' : 'Movie'} Not Found
        </h1>
        <button onClick={() => navigate('/browse')} className="text-cyan-400 hover:underline">
          ← Back to Browse
        </button>
      </div>
    );
  }

  const posterUrl = item.localImage || (item.poster_path ? `${IMG_BASE}${item.poster_path}` : null);
  const backdropUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null;
  const displayTitle = item.title || item.name;

  // ============================================
  // Main render
  // ============================================
  return (
    <div className="min-h-screen bg-[#0b1121] text-white">
      
      {/* ========== BACK BUTTON (Fixed at top) ========== */}
      <div className="sticky top-16 z-40 bg-[#0b1121]/90 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* ========== TRAILER MODAL ========== */}
      {showTrailerModal && trailer && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTrailerModal(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${trailer}?autoplay=1&rel=0`}
              className="w-full h-full rounded-xl"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
            <button 
              onClick={() => setShowTrailerModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-red-400 text-xl font-bold"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* ========== HERO SECTION ========== */}
      <section className="relative h-[45vh] min-h-[350px] overflow-hidden">
        {/* Background */}
        {backdropUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        ) : posterUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center blur-sm scale-110"
            style={{ backgroundImage: `url(${posterUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1121] via-[#0b1121]/80 to-[#0b1121]/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-transparent to-transparent"></div>
        
        {/* Hero Content */}
        <div className="relative h-full max-w-6xl mx-auto px-6 flex items-end pb-8">
          <div className="flex gap-6 items-end">
            {/* Poster */}
            {posterUrl && (
              <img 
                src={posterUrl} 
                alt={displayTitle}
                className="hidden md:block w-40 rounded-lg shadow-2xl border border-slate-700/50"
              />
            )}
            
            {/* Title & Actions */}
            <div className="flex-1">
              {/* Media Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                  mediaType === 'tv' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {mediaType === 'tv' ? '📺 TV Show' : '🎬 Movie'}
                </span>
                {item.genres?.find(g => g.id === 16 || g.name?.toLowerCase() === 'animation') && (
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    ✨ Animated
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                {displayTitle}
              </h1>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Book Now - Only for local movies that are Now Showing */}
                {isNowShowing && isLocalItem && (
                  <button 
                    onClick={() => navigate(`/showtimes/${item.id}`)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-lg shadow-red-600/30 text-sm"
                  >
                    🎟️ Book Now
                  </button>
                )}
                {trailer ? (
                  <button 
                    onClick={() => setShowTrailerModal(true)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold py-2.5 px-6 rounded-full transition-all text-sm border border-white/20"
                  >
                    ▶ Watch Trailer
                  </button>
                ) : (
                  <span className="text-slate-500 text-sm italic">No trailer available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MAIN CONTENT (2 Column Layout) ========== */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Overview, Rating, Cast */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview */}
            <section>
              <h2 className="text-lg font-bold mb-3 text-slate-200">Overview</h2>
              <p className="text-slate-400 leading-relaxed text-sm">
                {item.overview || `No description available for this ${mediaType === 'tv' ? 'TV show' : 'movie'}.`}
              </p>
            </section>

            {/* Rating Section (UI only - no backend) */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">User Rating</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-yellow-400">
                      {item.vote_average?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-slate-500 text-sm">/ 10</span>
                  </div>
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`text-lg ${
                          star <= Math.round((item.vote_average || 0) / 2) 
                            ? 'text-yellow-400' 
                            : 'text-slate-700'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-4 rounded-lg transition-all">
                  ⭐ Rate This
                </button>
              </div>
            </section>

            {/* Cast & Crew */}
            {cast.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 text-slate-200">Cast & Crew</h2>
                <div 
                  className="flex gap-3 overflow-x-auto pb-3"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {cast.map(person => (
                    <div key={person.id} className="flex-shrink-0 w-24 text-center group">
                      <div className="relative w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-cyan-500 transition-colors">
                        {person.profile_path ? (
                          <img 
                            src={`${IMG_BASE}${person.profile_path}`} 
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xl">
                            👤
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold truncate">{person.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{person.character}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Booking Banner (Only for local Now Showing movies) */}
            {isNowShowing && isLocalItem && (
              <section>
                <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 border border-red-500/30 rounded-xl p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-red-400 text-xs font-bold uppercase">Now Showing</span>
                      </div>
                      <h3 className="text-lg font-bold">Book your tickets!</h3>
                    </div>
                    <button 
                      onClick={() => navigate(`/showtimes/${item.id}`)}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-full transition-all text-sm"
                    >
                      View Showtimes →
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: Details Box */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 sticky top-32">
              <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">
                {mediaType === 'tv' ? 'Show Details' : 'Movie Details'}
              </h3>
              
              <div className="space-y-4">
                {/* Release/Air Date */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    {mediaType === 'tv' ? 'First Aired' : 'Release Date'}
                  </p>
                  <p className="font-medium text-sm">{item.release_date || item.first_air_date || 'TBA'}</p>
                </div>

                {/* Runtime / Episode Count */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    {mediaType === 'tv' ? 'Episode Runtime' : 'Runtime'}
                  </p>
                  <p className="font-medium text-sm">{formatRuntime(item.runtime)}</p>
                </div>

                {/* Seasons (TV only) */}
                {mediaType === 'tv' && item.number_of_seasons && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Seasons</p>
                    <p className="font-medium text-sm">{item.number_of_seasons} seasons • {item.number_of_episodes || '?'} episodes</p>
                  </div>
                )}

                {/* Status (TV only) */}
                {mediaType === 'tv' && item.status && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <p className={`font-medium text-sm ${item.status === 'Ended' ? 'text-slate-400' : 'text-green-400'}`}>
                      {item.status}
                    </p>
                  </div>
                )}

                {/* Genres (Clickable) */}
                <div>
                  <p className="text-xs text-slate-500 mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {item.genres?.length > 0 ? (
                      item.genres.map((genre) => (
                        <button
                          key={genre.id || genre.name}
                          onClick={() => handleGenreClick(genre)}
                          className="bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 px-3 py-1 rounded-full text-xs transition-all border border-transparent hover:border-cyan-500/30"
                        >
                          {genre.name}
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">N/A</span>
                    )}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Original Language</p>
                  <p className="font-medium text-sm">{getLanguageName(item.original_language)}</p>
                </div>

                {/* Watch Providers / OTT */}
                {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Where to Watch</p>
                    <div className="flex flex-wrap gap-2">
                      {[...(watchProviders.flatrate || []), ...(watchProviders.rent || []), ...(watchProviders.buy || [])]
                        .slice(0, 5)
                        .filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i)
                        .map(provider => (
                          <div 
                            key={provider.provider_id} 
                            className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 border border-slate-700"
                            title={provider.provider_name}
                          >
                            <img 
                              src={`${IMG_BASE}${provider.logo_path}`} 
                              alt={provider.provider_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Price (Local movies only) */}
                {isLocalItem && item.price && (
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Ticket Price</p>
                    <p className="font-bold text-lg text-cyan-400">NPR {item.price}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
