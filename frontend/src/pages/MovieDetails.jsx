import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { adminMovies } from '../data/adminMovies';

// TODO: Replace with backend API when backend is ready
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

// ============================================
// JIKAN API for Japanese Anime
// TODO: Replace with backend API when backend is ready
// ============================================
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// ============================================
// BACKEND-SAFE: Normalize TMDB response
// Maps movie/tv/animation data to a consistent format
// UI components consume ONLY normalized data
// ============================================
const normalizeTMDBData = (data, mediaType) => {
  // Determine if it's an animation based on genre
  const isAnimation = data.genres?.some(g => g.id === 16 || g.name?.toLowerCase() === 'animation');
  
  return {
    // Core identification
    id: data.id,
    mediaType: mediaType,
    isAnimation: isAnimation,
    isAnime: false,
    isNowPlaying: data.isNowShowing || data.isNowPlaying || false,
    
    // Title - movies use 'title', TV uses 'name'
    title: data.title || data.name,
    
    // Release date - movies use 'release_date', TV uses 'first_air_date'
    releaseDate: data.release_date || data.first_air_date,
    
    // Runtime - movies use 'runtime', TV uses 'episode_run_time' array
    runtime: data.runtime || (data.episode_run_time?.[0] || null),
    
    // Common fields
    overview: data.overview,
    genres: data.genres || [],
    rating: data.vote_average,
    voteCount: data.vote_count,
    language: data.original_language,
    
    // Images
    poster: data.poster_path,
    backdrop: data.backdrop_path,
    localImage: data.localImage || null,
    
    // TV-specific fields (null for movies)
    numberOfSeasons: data.number_of_seasons || null,
    numberOfEpisodes: data.number_of_episodes || null,
    status: data.status || null,
    
    // Local/admin movie fields
    price: data.price || null,
    isLocal: data.isLocal || false,
    
    // Keep original data for any edge cases
    _raw: data
  };
};

// ============================================
// BACKEND-SAFE: Normalize Jikan (Anime) response
// Maps anime data to a consistent format matching TMDB structure
// ============================================
const normalizeJikanData = (data) => {
  return {
    // Core identification
    id: data.mal_id,
    mediaType: 'anime',
    isAnimation: true,
    isAnime: true,
    isNowPlaying: false, // Anime can't be booked in theater
    
    // Title
    title: data.title || data.title_english || data.title_japanese,
    titleJapanese: data.title_japanese,
    titleEnglish: data.title_english,
    
    // Release date - use aired.from
    releaseDate: data.aired?.from?.split('T')[0] || null,
    
    // Runtime - parse duration string (e.g., "24 min per ep")
    runtime: data.duration ? parseInt(data.duration) || null : null,
    
    // Common fields
    overview: data.synopsis,
    genres: data.genres?.map(g => ({ id: g.mal_id, name: g.name })) || [],
    rating: data.score,
    voteCount: data.scored_by,
    language: 'ja', // Japanese
    
    // Images - Jikan provides full URLs
    poster: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url,
    backdrop: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url,
    localImage: null,
    
    // Anime-specific fields
    episodes: data.episodes,
    status: data.status,
    aired: data.aired?.string,
    source: data.source,
    rating_info: data.rating,
    rank: data.rank,
    popularity: data.popularity,
    studios: data.studios?.map(s => s.name) || [],
    
    // Trailer - Jikan provides YouTube embed URL
    trailerUrl: data.trailer?.embed_url || null,
    trailerYoutubeId: data.trailer?.youtube_id || null,
    
    // Local/admin fields (not applicable for anime)
    price: null,
    isLocal: false,
    
    // Keep original data
    _raw: data
  };
};

// ============================================
// BACKEND-SAFE: MovieDetails handles movie, tv, animation, anime
// Media type is determined from URL:
//   - /details/movie/:id
//   - /details/tv/:id
//   - /details/animation/:id
//   - /details/anime/:id (uses Jikan API)
//   - Legacy: /movie/:id, /tv/:id
// ============================================
const MovieDetails = () => {
  const { id, mediaType: routeMediaType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine media type from URL
  // New format: /details/:mediaType/:id
  // Legacy format: /movie/:id or /tv/:id
  const getMediaType = () => {
    if (routeMediaType) {
      return routeMediaType; // 'movie', 'tv', 'animation', or 'anime'
    }
    // Legacy route detection
    if (location.pathname.startsWith('/tv/')) return 'tv';
    return 'movie';
  };
  
  const mediaType = getMediaType();
  
  // For API calls: animation uses movie or tv endpoint based on source
  // Most animations are movies, but some are TV series
  const getApiEndpoint = (type) => {
    if (type === 'animation') {
      // Non-Japanese animations - try movie first, then TV
      return 'movie';
    }
    return type === 'tv' ? 'tv' : 'movie';
  };
  
  const isNowShowingFromState = location.state?.isNowShowing;
  
  // State - UI consumes normalized data only
  const [normalizedItem, setNormalizedItem] = useState(null);
  const [cast, setCast] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [trailerEmbed, setTrailerEmbed] = useState(null); // For anime embed URLs
  const [watchProviders, setWatchProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocalItem, setIsLocalItem] = useState(false);
  const [isNowShowing, setIsNowShowing] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  // ============================================
  // BACKEND-SAFE: Fetch item data
  // Uses Jikan API for anime, TMDB for everything else
  // ============================================
  useEffect(() => {
    const fetchItemData = async () => {
      setLoading(true);
      
      // ============================================
      // ANIME: Use Jikan API (NOT TMDB)
      // ============================================
      if (mediaType === 'anime') {
        try {
          // Fetch anime details from Jikan
          const [animeRes, charactersRes] = await Promise.all([
            fetch(`${JIKAN_BASE_URL}/anime/${id}/full`),
            fetch(`${JIKAN_BASE_URL}/anime/${id}/characters`)
          ]);
          
          if (!animeRes.ok) throw new Error('Anime not found');
          
          const animeData = await animeRes.json();
          
          // Normalize Jikan data to match our UI shape
          setNormalizedItem(normalizeJikanData(animeData.data));
          
          // Process characters as "cast"
          if (charactersRes.ok) {
            const charactersData = await charactersRes.json();
            // Map Jikan characters to match TMDB cast structure
            const animeCast = (charactersData.data || [])
              .slice(0, 10)
              .map(char => ({
                id: char.character?.mal_id,
                name: char.character?.name,
                character: char.role,
                profile_path: char.character?.images?.jpg?.image_url
              }));
            setCast(animeCast);
          }
          
          // Set trailer from Jikan data
          if (animeData.data?.trailer?.youtube_id) {
            setTrailer(animeData.data.trailer.youtube_id);
          }
          if (animeData.data?.trailer?.embed_url) {
            setTrailerEmbed(animeData.data.trailer.embed_url);
          }
          
        } catch (err) {
          console.error('Failed to fetch anime:', err);
          setNormalizedItem(null);
        } finally {
          setLoading(false);
        }
        return;
      }
      
      // ============================================
      // NON-ANIME: Check for local/admin movie first
      // ============================================
      if (mediaType === 'movie' || mediaType === 'animation') {
        const localMovie = adminMovies.find(m => String(m.id) === String(id));
        
        if (localMovie) {
          const localData = {
            id: localMovie.id,
            title: localMovie.title,
            overview: localMovie.description || 'A captivating film experience awaits you at our cinema.',
            poster_path: null,
            localImage: localMovie.image,
            vote_average: localMovie.rating ? localMovie.rating * 2 : 7.5,
            runtime: localMovie.duration ? parseInt(localMovie.duration) : 120,
            release_date: localMovie.releaseDate || '2024',
            genres: localMovie.genre?.split(',').map((g, i) => ({ id: i, name: g.trim() })) || [],
            original_language: 'ne',
            price: localMovie.price,
            isLocal: true,
            isNowShowing: localMovie.isNowShowing || false,
            isNowPlaying: localMovie.isNowShowing || localMovie.isNowPlaying || false
          };
          
          setNormalizedItem(normalizeTMDBData(localData, 'movie'));
          setIsLocalItem(true);
          setLoading(false);
          return;
        }
      }

      // Fetch from TMDB
      try {
        let endpoint = getApiEndpoint(mediaType);
        let itemData = null;
        
        // Try primary endpoint
        let itemRes = await fetch(`${BASE_URL}/${endpoint}/${id}?api_key=${API_KEY}`);
        
        // For animations: if movie endpoint fails, try TV
        if (!itemRes.ok && mediaType === 'animation') {
          endpoint = 'tv';
          itemRes = await fetch(`${BASE_URL}/${endpoint}/${id}?api_key=${API_KEY}`);
        }
        
        if (!itemRes.ok) throw new Error('Item not found');
        
        itemData = await itemRes.json();
        
        // Fetch credits, videos, and watch providers in parallel
        const [creditsRes, videosRes, providersRes] = await Promise.all([
          fetch(`${BASE_URL}/${endpoint}/${id}/credits?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/${endpoint}/${id}/videos?api_key=${API_KEY}`),
          fetch(`${BASE_URL}/${endpoint}/${id}/watch/providers?api_key=${API_KEY}`)
        ]);
        
        // Normalize the data BEFORE setting state
        const actualMediaType = endpoint === 'tv' ? 'tv' : 'movie';
        setNormalizedItem(normalizeTMDBData(itemData, actualMediaType));
        
        setIsNowShowing(isNowShowingFromState || false);
        
        // Process credits
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setCast(creditsData.cast?.slice(0, 10) || []);
        }
        
        // Process videos - auto-select YouTube trailer only
        if (videosRes.ok) {
          const videosData = await videosRes.json();
          const trailerVideo = videosData.results?.find(
            v => v.type === 'Trailer' && v.site === 'YouTube'
          ) || videosData.results?.find(
            v => v.type === 'Teaser' && v.site === 'YouTube'
          ) || videosData.results?.find(
            v => v.site === 'YouTube'
          );
          if (trailerVideo) setTrailer(trailerVideo.key);
        }

        // Process watch providers
        if (providersRes.ok) {
          const providersData = await providersRes.json();
          const providers = providersData.results?.US || providersData.results?.IN || Object.values(providersData.results || {})[0];
          setWatchProviders(providers);
        }
      } catch (err) {
        console.error('Failed to fetch item:', err);
        setNormalizedItem(null);
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
    // Use the actual mediaType from normalized data for proper navigation
    const actualType = normalizedItem?.mediaType || mediaType;
    if (actualType === 'anime') {
      navigate('/anime', { state: { genreId: genre.id, genreName: genre.name } });
    } else if (actualType === 'tv') {
      navigate('/tvshows', { state: { genreId: genre.id, genreName: genre.name } });
    } else if (normalizedItem?.isAnimation) {
      navigate('/animations', { state: { genreId: genre.id, genreName: genre.name } });
    } else {
      navigate('/movies', { state: { genreId: genre.id, genreName: genre.name } });
    }
  };

  const getLanguageName = (code) => {
    const langs = { en: 'English', ne: 'Nepali', hi: 'Hindi', ko: 'Korean', ja: 'Japanese', es: 'Spanish', fr: 'French', zh: 'Chinese', de: 'German', it: 'Italian', pt: 'Portuguese', ru: 'Russian' };
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
  
  // Get media type label for UI display
  const getMediaTypeLabel = () => {
    if (normalizedItem?.isAnime) return '🎌 Anime';
    if (normalizedItem?.isAnimation) return '✨ Animation';
    if (normalizedItem?.mediaType === 'tv') return '📺 TV Show';
    return '🎬 Movie';
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
  if (!normalizedItem) {
    const typeLabel = mediaType === 'tv' ? 'TV Show' : mediaType === 'animation' ? 'Animation' : mediaType === 'anime' ? 'Anime' : 'Movie';
    return (
      <div className="min-h-screen bg-[#0b1121] flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-4">
          {typeLabel} Not Found
        </h1>
        <button onClick={() => navigate('/browse')} className="text-cyan-400 hover:underline">
          ← Back to Browse
        </button>
      </div>
    );
  }

  // ============================================
  // Consume normalized data for rendering
  // For anime: poster is a full URL, not a path
  // ============================================
  const isAnime = normalizedItem.isAnime;
  const posterUrl = normalizedItem.localImage || (
    isAnime 
      ? normalizedItem.poster 
      : (normalizedItem.poster ? `${IMG_BASE}${normalizedItem.poster}` : null)
  );
  const backdropUrl = isAnime 
    ? normalizedItem.backdrop 
    : (normalizedItem.backdrop ? `https://image.tmdb.org/t/p/original${normalizedItem.backdrop}` : null);
  const displayTitle = normalizedItem.title;

  // ============================================
  // Main render
  // ============================================
  return (
    <div className="min-h-screen bg-[#0b1121] text-white">
      
      {/* ========== BACK BUTTON (Fixed at top) ========== */}
      <div className="sticky top-16 z-40 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors group text-xs"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">← Back</span>
          </button>
          
          {/* Discussion Button */}
          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700/50">
            <span>💬</span>
            <span>Discussion</span>
          </button>
        </div>
      </div>

      {/* ========== TRAILER MODAL ========== */}
      {showTrailerModal && (trailer || trailerEmbed) && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowTrailerModal(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
            <iframe
              src={trailerEmbed || `https://www.youtube.com/embed/${trailer}?autoplay=1&rel=0`}
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
      <section className="relative h-[50vh] min-h-[380px] overflow-hidden">
        {/* Background */}
        {backdropUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        ) : posterUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center blur-md scale-110"
            style={{ backgroundImage: `url(${posterUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1121] via-[#0b1121]/85 to-[#0b1121]/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-transparent to-[#0b1121]/30"></div>
        
        {/* Hero Content */}
        <div className="relative h-full max-w-6xl mx-auto px-6 flex items-end pb-10">
          <div className="flex gap-5 items-end">
            {/* Poster */}
            {posterUrl && (
              <img 
                src={posterUrl} 
                alt={displayTitle}
                className="hidden md:block w-36 rounded-lg shadow-2xl border border-slate-700/30 ring-1 ring-black/20"
              />
            )}
            
            {/* Title & Actions */}
            <div className="flex-1">
              {/* Media Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  normalizedItem.isAnime
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : normalizedItem.isAnimation 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : normalizedItem.mediaType === 'tv' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {getMediaTypeLabel()}
                </span>
                {normalizedItem.isAnime && normalizedItem.studios?.length > 0 && (
                  <span className="text-[10px] font-medium text-slate-500">
                    by {normalizedItem.studios[0]}
                  </span>
                )}
                {normalizedItem.isAnimation && !normalizedItem.isAnime && normalizedItem.mediaType === 'tv' && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    📺 Series
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-black mb-3 leading-tight">
                {displayTitle}
              </h1>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Book Now - Only if isNowPlaying is true */}
                {normalizedItem.isNowPlaying && (
                  <button 
                    onClick={() => navigate(`/showtimes/${normalizedItem.id}`)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-5 rounded-full transition-all shadow-lg shadow-red-600/30 text-xs"
                  >
                    🎟️ Book Now
                  </button>
                )}
                {(trailer || trailerEmbed) ? (
                  <button 
                    onClick={() => setShowTrailerModal(true)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-medium py-2 px-5 rounded-full transition-all text-xs border border-white/20"
                  >
                    ▶ Watch Trailer
                  </button>
                ) : (
                  <span className="text-slate-600 text-xs italic">No trailer available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MAIN CONTENT (2 Column Layout) ========== */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Overview, Rating, Cast */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview */}
            <section>
              <h2 className="text-sm font-bold mb-2 text-slate-300">Overview</h2>
              <p className="text-slate-400 leading-relaxed text-xs">
                {normalizedItem.overview || `No description available for this ${normalizedItem.mediaType === 'tv' ? 'TV show' : normalizedItem.isAnimation ? 'animation' : 'movie'}.`}
              </p>
            </section>

            {/* Rating Section (UI only - no backend) */}
            <section className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">User Rating</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-yellow-400">
                      {normalizedItem.rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-slate-600 text-xs">/ 10</span>
                  </div>
                  <div className="flex gap-0.5 mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`text-sm ${
                          star <= Math.round((normalizedItem.rating || 0) / 2) 
                            ? 'text-yellow-400' 
                            : 'text-slate-700'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <button className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] py-1.5 px-3 rounded-lg transition-all">
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

            {/* Booking Banner (Only if isNowPlaying is true) */}
            {normalizedItem.isNowPlaying && (
              <section>
                <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 border border-red-500/30 rounded-xl p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-red-400 text-xs font-bold uppercase">Now Playing</span>
                      </div>
                      <h3 className="text-lg font-bold">Book your tickets!</h3>
                    </div>
                    <button 
                      onClick={() => navigate(`/showtimes/${normalizedItem.id}`)}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-6 rounded-full transition-all text-sm"
                    >
                      View Showtimes →
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Discussion Section */}
            <section>
              <h2 className="text-lg font-bold mb-4 text-slate-200">💬 Discussion</h2>
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Join the conversation</h3>
                <p className="text-slate-500 text-xs mb-4">Share your thoughts, reviews, and theories about {displayTitle}</p>
                <button 
                  onClick={() => navigate(`/discussion/${normalizedItem.id}`)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-6 rounded-full text-sm transition-all"
                >
                  View Discussion →
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Details Box */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-lg p-4 sticky top-28">
              <h3 className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">
                {normalizedItem.isAnime ? 'Anime Info' : normalizedItem.isAnimation ? 'Animation Info' : normalizedItem.mediaType === 'tv' ? 'Show Info' : 'Movie Info'}
              </h3>
              
              <div className="space-y-3">
                {/* Release/Air Date */}
                <div>
                  <p className="text-[10px] text-slate-600 mb-0.5">
                    {normalizedItem.isAnime ? 'Aired' : normalizedItem.mediaType === 'tv' ? 'First Aired' : 'Release Date'}
                  </p>
                  <p className="font-medium text-xs">{normalizedItem.isAnime && normalizedItem.aired ? normalizedItem.aired : normalizedItem.releaseDate || 'TBA'}</p>
                </div>

                {/* Runtime / Episode Count */}
                <div>
                  <p className="text-[10px] text-slate-600 mb-0.5">
                    {normalizedItem.isAnime ? 'Duration' : normalizedItem.mediaType === 'tv' ? 'Episode Runtime' : 'Runtime'}
                  </p>
                  <p className="font-medium text-xs">{normalizedItem.isAnime ? (normalizedItem._raw?.duration || 'N/A') : formatRuntime(normalizedItem.runtime)}</p>
                </div>

                {/* Episodes (Anime) */}
                {normalizedItem.isAnime && normalizedItem.episodes && (
                  <div>
                    <p className="text-[10px] text-slate-600 mb-0.5">Episodes</p>
                    <p className="font-medium text-xs">{normalizedItem.episodes} episodes</p>
                  </div>
                )}

                {/* Status (Anime & TV) */}
                {(normalizedItem.isAnime || normalizedItem.mediaType === 'tv') && normalizedItem.status && (
                  <div>
                    <p className="text-[10px] text-slate-600 mb-0.5">Status</p>
                    <p className={`font-medium text-xs ${normalizedItem.status === 'Ended' || normalizedItem.status === 'Finished Airing' ? 'text-slate-400' : 'text-green-400'}`}>
                      {normalizedItem.status}
                    </p>
                  </div>
                )}

                {/* Source (Anime only) */}
                {normalizedItem.isAnime && normalizedItem.source && (
                  <div>
                    <p className="text-[10px] text-slate-600 mb-0.5">Source</p>
                    <p className="font-medium text-xs">{normalizedItem.source}</p>
                  </div>
                )}

                {/* Studios (Anime only) */}
                {normalizedItem.isAnime && normalizedItem.studios?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-600 mb-0.5">Studio</p>
                    <p className="font-medium text-xs">{normalizedItem.studios.join(', ')}</p>
                  </div>
                )}

                {/* MAL Rank (Anime only) */}
                {normalizedItem.isAnime && normalizedItem.rank && (
                  <div>
                    <p className="text-[10px] text-slate-600 mb-0.5">MAL Rank</p>
                    <p className="font-medium text-xs text-pink-400">#{normalizedItem.rank}</p>
                  </div>
                )}

                {/* Seasons (TV only - non-anime) */}
                {!normalizedItem.isAnime && normalizedItem.mediaType === 'tv' && normalizedItem.numberOfSeasons && (
                  <div>
                    <p className="text-[10px] text-slate-600 mb-0.5">Seasons</p>
                    <p className="font-medium text-xs">{normalizedItem.numberOfSeasons} seasons • {normalizedItem.numberOfEpisodes || '?'} episodes</p>
                  </div>
                )}

                {/* Genres (Clickable) */}
                <div>
                  <p className="text-[10px] text-slate-600 mb-1.5">Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {normalizedItem.genres?.length > 0 ? (
                      normalizedItem.genres.map((genre) => (
                        <button
                          key={genre.id || genre.name}
                          onClick={() => handleGenreClick(genre)}
                          className="bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-400 px-2 py-0.5 rounded-full text-[10px] transition-all border border-slate-700/50 hover:border-cyan-500/30"
                        >
                          {genre.name}
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-600 text-xs">N/A</span>
                    )}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p className="text-[10px] text-slate-600 mb-0.5">Original Language</p>
                  <p className="font-medium text-xs">{getLanguageName(normalizedItem.language)}</p>
                </div>

                {/* Watch Providers / OTT */}
                {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) && (
                  <div>
                    <p className="text-[10px] text-slate-600 mb-1.5">Where to Watch</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...(watchProviders.flatrate || []), ...(watchProviders.rent || []), ...(watchProviders.buy || [])]
                        .slice(0, 5)
                        .filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i)
                        .map(provider => (
                          <div 
                            key={provider.provider_id} 
                            className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50"
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
                {isLocalItem && normalizedItem.price && (
                  <div className="pt-2.5 border-t border-slate-800/50">
                    <p className="text-[10px] text-slate-600 mb-0.5">Ticket Price</p>
                    <p className="font-bold text-base text-cyan-400">NPR {normalizedItem.price}</p>
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
