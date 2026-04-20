import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getBackendMovieById, getBackendMovieByTmdbId } from '../api/backendService';
import { toggleMovieInterest, toggleTmdbMovieInterest } from '../api/backendService';
import { 
  checkItemInLists, 
  addToWatchlist, 
  removeFromWatchlist,
  addToFavorites,
  removeFromFavorites 
} from '../api/userService';
import { useAuth } from '../context/AuthContext';
import MovieRatingSection from '../components/MovieRatingSection';
import { getMovieRatings } from '../api/ratingService';

// TMDB API Config
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// Jikan API for Anime
const JIKAN_BASE = 'https://api.jikan.moe/v4';

const MovieDetails = () => {
  const { id, mediaType: routeMediaType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isBackendMovieRoute = location.pathname.startsWith('/movie/backend/');
  
  // Determine media type from URL
  const getMediaType = () => {
    if (isBackendMovieRoute) return 'movie';
    if (routeMediaType) return routeMediaType;
    if (location.pathname.startsWith('/tv/')) return 'tv';
    if (location.pathname.startsWith('/anime/')) return 'anime';
    return 'movie';
  };
  
  const mediaType = getMediaType();
  
  // State
  const [item, setItem] = useState(null);
  const [cast, setCast] = useState([]);
  const [crewDetails, setCrewDetails] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  
  // Watchlist and Favorites state
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [watchlistJustUpdated, setWatchlistJustUpdated] = useState(false);
  const [favoriteJustUpdated, setFavoriteJustUpdated] = useState(false);
  
  // Interest state (for upcoming backend movies)
  const [isInterested, setIsInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [interestLoading, setInterestLoading] = useState(false);

  // Platform rating state
  const [platformRating, setPlatformRating] = useState({ averageRating: 0, totalRatings: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, mediaType]);

  // Fetch platform rating
  const getRatingMovieId = () => {
    if (isBackendMovieRoute) return id;
    if (location.pathname.startsWith('/anime/')) return `anime_${id}`;
    if (location.pathname.startsWith('/tv/')) return `tv_${id}`;
    return `tmdb_${id}`;
  };

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const data = await getMovieRatings(getRatingMovieId());
        setPlatformRating({ averageRating: data.averageRating, totalRatings: data.totalRatings });
      } catch { /* no ratings yet */ }
    };
    if (id) fetchRating();
  }, [id, isBackendMovieRoute]);

  useEffect(() => {
    const checkLists = async () => {
      if (!isAuthenticated || !id || !mediaType) return;
      
      try {
        const status = await checkItemInLists(mediaType, id);
        setInWatchlist(status.inWatchlist);
        setInFavorites(status.inFavorites);
      } catch (error) {
        console.error('Error checking lists:', error);
      }
    };
    
    checkLists();
  }, [id, mediaType, isAuthenticated]);

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      alert('Please login to add to watchlist');
      navigate('/login');
      return;
    }
    
    if (!item) return;
    
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(mediaType, id);
        setInWatchlist(false);
      } else {
        await addToWatchlist({
          mediaType,
          id,
          title: item.title,
          poster: item.poster
        });
        setInWatchlist(true);
      }
      setWatchlistJustUpdated(true);
      setTimeout(() => setWatchlistJustUpdated(false), 500);
    } catch (error) {
      console.error('Watchlist error:', error);
      alert(error.response?.data?.message || 'Failed to update watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleFavoritesToggle = async () => {
    if (!isAuthenticated) {
      alert('Please login to add to favorites');
      navigate('/login');
      return;
    }
    
    if (!item) return;
    
    setFavoriteLoading(true);
    try {
      if (inFavorites) {
        await removeFromFavorites(mediaType, id);
        setInFavorites(false);
      } else {
        await addToFavorites({
          mediaType,
          id,
          title: item.title,
          poster: item.poster
        });
        setInFavorites(true);
      }
      setFavoriteJustUpdated(true);
      setTimeout(() => setFavoriteJustUpdated(false), 500);
    } catch (error) {
      console.error('Favorites error:', error);
      alert(error.response?.data?.message || 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // ========== BACKEND MOVIE (MongoDB API) ==========
        if (isBackendMovieRoute) {
          const backendMovie = await getBackendMovieById(id);
          if (!backendMovie) throw new Error('Backend movie not found');

          setItem({
            ...backendMovie,
            id: backendMovie._id || backendMovie.id,
            mediaType: 'movie',
            isBackend: true,
            isAnime: false,
            isAnimation: false,
            voteCount: backendMovie.rating || 0,
            status: backendMovie.bookingEnabled ? 'Now Showing' : 'Coming Soon',
            genres: (backendMovie.genres || []).map((genre) =>
              typeof genre === 'string' ? { id: genre, name: genre } : genre
            )
          });
          
          // Set interest data
          setInterestedCount(backendMovie.interestedCount || 0);
          if (user && backendMovie.interestedUsers?.length > 0) {
            setIsInterested(backendMovie.interestedUsers.some(
              (uid) => uid.toString() === user._id?.toString() || uid.toString() === user.id?.toString()
            ));
          }
          
          setCast([]);
          setCrewDetails([]);
          setTrailer(null);
          setWatchProviders(null);
          setLoading(false);
          return;
        }

        // ========== ANIME (Jikan API) ==========
        if (mediaType === 'anime') {
          const [animeRes, charsRes] = await Promise.all([
            fetch(`${JIKAN_BASE}/anime/${id}/full`),
            fetch(`${JIKAN_BASE}/anime/${id}/characters`)
          ]);
          
          if (!animeRes.ok) throw new Error('Anime not found');
          
          const animeData = await animeRes.json();
          const anime = animeData.data;
          
          setItem({
            id: anime.mal_id,
            mediaType: 'anime',
            isAnime: true,
            title: anime.title || anime.title_english,
            titleJapanese: anime.title_japanese,
            overview: anime.synopsis,
            poster: anime.images?.jpg?.large_image_url,
            backdrop: anime.images?.jpg?.large_image_url,
            voteCount: anime.scored_by,
            releaseDate: anime.aired?.from?.split('T')[0],
            aired: anime.aired?.string,
            runtime: anime.duration,
            episodes: anime.episodes,
            status: anime.status,
            source: anime.source,
            studios: anime.studios?.map(s => s.name) || [],
            genres: anime.genres?.map(g => ({ id: g.mal_id, name: g.name })) || [],
            language: 'ja',
            rank: anime.rank
          });
          
          // Set trailer
          if (anime.trailer?.youtube_id) {
            setTrailer(anime.trailer.youtube_id);
          }
          
          // Set characters as cast
          if (charsRes.ok) {
            const charsData = await charsRes.json();
            setCast((charsData.data || []).slice(0, 10).map(c => ({
              id: c.character?.mal_id,
              name: c.character?.name,
              character: c.role,
              profile_path: c.character?.images?.jpg?.image_url
            })));
          }
          setCrewDetails([]);
          
          setLoading(false);
          return;
        }
        
        // ========== MOVIES / TV / ANIMATIONS (TMDB API) ==========
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        
        // Fetch details, credits, videos, and providers in parallel
        const [detailsRes, creditsRes, videosRes, providersRes] = await Promise.all([
          fetch(`${TMDB_BASE}/${endpoint}/${id}?api_key=${API_KEY}`),
          fetch(`${TMDB_BASE}/${endpoint}/${id}/credits?api_key=${API_KEY}`),
          fetch(`${TMDB_BASE}/${endpoint}/${id}/videos?api_key=${API_KEY}`),
          fetch(`${TMDB_BASE}/${endpoint}/${id}/watch/providers?api_key=${API_KEY}`)
        ]);
        
        if (!detailsRes.ok) throw new Error('Item not found');
        
        const data = await detailsRes.json();
        const isAnimation = data.genres?.some(g => g.id === 16);
        
        setItem({
          id: data.id,
          mediaType: endpoint,
          isAnimation,
          isAnime: false,
          title: data.title || data.name,
          overview: data.overview,
          poster: data.poster_path,
          backdrop: data.backdrop_path,
          voteCount: data.vote_count,
          releaseDate: data.release_date || data.first_air_date,
          runtime: data.runtime || data.episode_run_time?.[0],
          status: data.status,
          genres: data.genres || [],
          language: data.original_language,
          numberOfSeasons: data.number_of_seasons,
          numberOfEpisodes: data.number_of_episodes,
          tagline: data.tagline,
          budget: data.budget,
          revenue: data.revenue
        });
        
        // Credits
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setCast(creditsData.cast?.slice(0, 10) || []);

          const rolePriority = [
            'Director',
            'Writer',
            'Screenplay',
            'Story',
            'Producer',
            'Executive Producer',
            'Original Music Composer',
            'Director of Photography',
            'Editor'
          ];

          const uniqueCrew = [];
          const seenByRoleAndName = new Set();

          rolePriority.forEach((role) => {
            const matches = (creditsData.crew || []).filter((member) => member.job === role);
            matches.forEach((member) => {
              const key = `${role}:${member.name}`;
              if (!seenByRoleAndName.has(key)) {
                seenByRoleAndName.add(key);
                uniqueCrew.push({
                  id: member.id || member.credit_id || key,
                  personId: member.id,
                  role,
                  name: member.name,
                  profile_path: member.profile_path
                });
              }
            });
          });

          // Add TV creators when available and not already included.
          if (endpoint === 'tv' && Array.isArray(data.created_by)) {
            data.created_by.forEach((creator) => {
              const key = `Creator:${creator.name}`;
              if (!seenByRoleAndName.has(key)) {
                seenByRoleAndName.add(key);
                uniqueCrew.push({
                  id: creator.id || key,
                  personId: creator.id,
                  role: 'Creator',
                  name: creator.name,
                  profile_path: creator.profile_path
                });
              }
            });
          }

          setCrewDetails(uniqueCrew.slice(0, 8));
        }
        
        // Videos - find trailer
        if (videosRes.ok) {
          const videosData = await videosRes.json();
          const trailerVideo = videosData.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
            || videosData.results?.find(v => v.type === 'Teaser' && v.site === 'YouTube')
            || videosData.results?.find(v => v.site === 'YouTube');
          if (trailerVideo) setTrailer(trailerVideo.key);
        }
        
        // Watch providers
        if (providersRes.ok) {
          const providersData = await providersRes.json();
          const providers = providersData.results?.US || providersData.results?.IN || Object.values(providersData.results || {})[0];
          setWatchProviders(providers);
        }

        // Check if this TMDB movie has interest data in backend (by tmdbId)
        if (user && data.id) {
          const backendMatch = await getBackendMovieByTmdbId(data.id);
          if (backendMatch) {
            setInterestedCount(backendMatch.interestedCount || 0);
            const userId = user._id || user.id;
            if (backendMatch.interestedUsers?.length > 0) {
              setIsInterested(backendMatch.interestedUsers.some(
                (uid) => uid.toString() === userId?.toString()
              ));
            }
          }
        }
        
      } catch (err) {
        console.error('Failed to fetch:', err);
        setItem(null);
        setCrewDetails([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, mediaType, isBackendMovieRoute]);

  const formatRuntime = (mins) => {
    if (!mins) return 'N/A';
    if (typeof mins === 'string') return mins; // Anime duration is already formatted
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getLanguageName = (code) => {
    const langs = { en: 'English', ne: 'Nepali', hi: 'Hindi', ko: 'Korean', ja: 'Japanese', es: 'Spanish', fr: 'French', zh: 'Chinese', de: 'German', it: 'Italian', pt: 'Portuguese', ru: 'Russian', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam', kn: 'Kannada', bn: 'Bengali', pa: 'Punjabi' };
    return langs[code] || code?.toUpperCase() || 'N/A';
  };

  const getMediaTypeLabel = () => {
    if (item?.isAnime) return 'Anime';
    if (item?.isAnimation) return 'Animation';
    if (item?.mediaType === 'tv') return 'TV Show';
    return 'Movie';
  };

  const handleInterestToggle = async () => {
    if (!isAuthenticated) {
      alert('Please login to mark interest');
      navigate('/login');
      return;
    }
    // Block if it's a now-playing backend movie
    if (item?.isBackend && item?.isNowPlaying) return;

    setInterestLoading(true);
    try {
      let result;
      if (item?.isBackend) {
        const movieId = item._id || item.id;
        result = await toggleMovieInterest(movieId);
      } else {
        // TMDB movie — auto-create in DB
        result = await toggleTmdbMovieInterest({
          tmdbId: item.id,
          title: item.title,
          poster: item.poster,
          backdrop: item.backdrop,
          releaseDate: item.releaseDate,
          language: item.original_language || item.language
        });
      }
      setIsInterested(result.interested);
      setInterestedCount(result.interestedCount);
    } catch (error) {
      console.error('Interest toggle error:', error);
      alert(error.response?.data?.error || 'Failed to update interest');
    } finally {
      setInterestLoading(false);
    }
  };

  const handleGenreClick = (genre) => {
    if (item?.isAnime) {
      navigate('/anime', { state: { genreId: genre.id, genreName: genre.name } });
    } else if (item?.mediaType === 'tv') {
      navigate('/tvshows', { state: { genreId: genre.id, genreName: genre.name } });
    } else if (item?.isAnimation) {
      navigate('/animations', { state: { genreId: genre.id, genreName: genre.name } });
    } else {
      navigate('/movies', { state: { genreId: genre.id, genreName: genre.name } });
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/browse');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-4">Not Found</h1>
        <p className="text-slate-400 mb-6">The {mediaType} you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/browse')} className="text-cyan-400 hover:underline">
          Back to Browse
        </button>
      </div>
    );
  }

  const posterUrl = item.isAnime || item.isBackend
    ? item.poster 
    : item.poster ? `${IMG_BASE}${item.poster}` : null;
  
  const backdropUrl = item.isAnime || item.isBackend
    ? item.backdrop 
    : item.backdrop ? `${BACKDROP_BASE}${item.backdrop}` : null;

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      
      {/* Back Button Bar */}
      <div className="sticky top-16 z-40 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Trailer Modal */}
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
              x Close
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-95 overflow-hidden">
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
          <div className="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-800" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-dark-bg via-dark-bg/85 to-dark-bg/50"></div>
        <div className="absolute inset-0 bg-linear-to-t from-dark-bg via-transparent to-dark-bg/30"></div>
        
        {/* Hero Content */}
        <div className="relative h-full max-w-6xl mx-auto px-6 flex items-end pb-10">
          <div className="flex gap-5 items-end">
            {/* Poster */}
            {posterUrl && (
              <img 
                src={posterUrl} 
                alt={item.title}
                className="hidden md:block w-36 rounded-lg shadow-2xl border border-slate-700/30"
              />
            )}
            
            {/* Title & Actions */}
            <div className="flex-1">
              {/* Media Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                  item.isAnime
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : item.isAnimation 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : item.mediaType === 'tv' 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {getMediaTypeLabel()}
                </span>
                {item.isAnime && item.studios?.length > 0 && (
                  <span className="text-xs text-slate-500">by {item.studios[0]}</span>
                )}
              </div>
              
              <h1 className="text-2xl md:text-4xl font-black mb-2 leading-tight">
                {item.title}
              </h1>

              {/* Platform Rating Badge */}
              {platformRating.totalRatings > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-3 py-1">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-yellow-300 font-bold text-sm">{platformRating.averageRating}</span>
                    <span className="text-slate-400 text-xs">/ 5</span>
                  </div>
                  <span className="text-slate-500 text-xs">
                    {platformRating.totalRatings} {platformRating.totalRatings === 1 ? 'rating' : 'ratings'} on MovieMania
                  </span>
                </div>
              )}

              {item.tagline && (
                <p className="text-slate-400 italic text-sm mb-3">"{item.tagline}"</p>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {trailer && (
                  <button 
                    onClick={() => setShowTrailerModal(true)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-5 rounded-full transition-all text-sm cursor-pointer active:scale-95"
                  >
                    Watch Trailer
                  </button>
                )}

                {/* Discussion Button (primary CTA) */}
                <button
                  onClick={() => navigate(`/discussion/${isBackendMovieRoute ? 'theater' : mediaType}/${id}`)}
                  className="bg-slate-100 hover:bg-white text-slate-900 font-extrabold py-2.5 px-6 rounded-full transition-all duration-200 text-sm border border-white/80 cursor-pointer flex items-center gap-2 shadow-lg shadow-black/25 hover:shadow-black/35 hover:-translate-y-0.5 active:scale-95"
                >
                  💬 Join Discussion
                </button>
                
                {/* Watchlist Button */}
                <button 
                  onClick={handleWatchlistToggle}
                  disabled={watchlistLoading}
                  className={`font-semibold py-2.5 px-5 rounded-full transition-all duration-200 text-sm border cursor-pointer flex items-center gap-2 active:scale-95 ${
                    inWatchlist 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  } ${watchlistJustUpdated ? 'scale-105' : ''} ${watchlistLoading ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                >
                  {watchlistLoading ? (
                    <span className="animate-spin text-xs">...</span>
                  ) : inWatchlist ? (
                    <>✓ In Watchlist</>
                  ) : (
                    <>+ Watchlist</>
                  )}
                </button>
                
                {/* Favorites Button */}
                <button 
                  onClick={handleFavoritesToggle}
                  disabled={favoriteLoading}
                  className={`font-semibold py-2.5 px-5 rounded-full transition-all duration-200 text-sm border cursor-pointer flex items-center gap-2 active:scale-95 ${
                    inFavorites 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/60 shadow-[0_0_0_1px_rgba(251,113,133,0.35)]'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  } ${favoriteJustUpdated ? 'scale-105' : ''} ${favoriteLoading ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                >
                  {favoriteLoading ? (
                    <span className="animate-spin text-xs">...</span>
                  ) : inFavorites ? (
                    <>♥ Favorited</>
                  ) : (
                    <>♡ Favorite</>
                  )}
                </button>

                {/* Interest Button (for upcoming movies — backend or TMDB with future release) */}
                {(item.isBackend ? !item.isNowPlaying : (item.releaseDate && new Date(item.releaseDate) > new Date())) && (
                  <button 
                    onClick={handleInterestToggle}
                    disabled={interestLoading}
                    className={`font-semibold py-2.5 px-5 rounded-full transition-all duration-200 text-sm border cursor-pointer flex items-center gap-2 active:scale-95 ${
                      isInterested 
                        ? 'bg-red-500/20 text-red-300 border-red-400/60 shadow-[0_0_0_1px_rgba(239,68,68,0.35)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    } ${interestLoading ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                  >
                    {interestLoading ? (
                      <span className="animate-spin text-xs">...</span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                        {isInterested ? 'Interested' : 'Mark Interested'}
                      </>
                    )}
                  </button>
                )}

                {/* Interest Count */}
                {interestedCount > 0 && (
                  <span className="text-sm text-red-400 font-medium flex items-center gap-1 ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                    {interestedCount} {interestedCount === 1 ? 'person' : 'people'} interested
                  </span>
                )}

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - 2 Column Layout */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Overview, Rating, Cast */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview */}
            <section>
              <h2 className="text-lg font-bold mb-3 text-slate-200">Overview</h2>
              <p className="text-slate-400 leading-relaxed">
                {item.overview || `No description available for this ${item.mediaType}.`}
              </p>
            </section>

            {/* Cast */}
            {cast.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 text-slate-200">Cast</h2>
                <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                  {cast.map(person => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => {
                        if (!item?.isAnime && !item?.isBackend && person?.id) {
                          navigate(`/person/${person.id}`);
                        }
                      }}
                      disabled={item?.isAnime || item?.isBackend || !person?.id}
                      className="shrink-0 w-20 text-center cursor-pointer disabled:cursor-default"
                      title={person?.id ? `View ${person.name}` : person.name}
                    >
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 transition-all hover:border-cyan-500/60">
                        {person.profile_path ? (
                          <img 
                            src={item.isAnime ? person.profile_path : `${IMG_BASE}${person.profile_path}`} 
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">N/A</div>
                        )}
                      </div>
                      <p className="text-xs font-semibold truncate hover:text-cyan-400 transition-colors">{person.name}</p>
                      <p className="text-xs text-slate-500 truncate">{person.character}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Crew */}
            {crewDetails.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 text-slate-200">Crew</h2>
                <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                  {crewDetails.map((member, index) => (
                    <button
                      key={member.id || `${member.role}-${member.name}-${index}`}
                      type="button"
                      onClick={() => {
                        if (member?.personId) {
                          navigate(`/person/${member.personId}`);
                        }
                      }}
                      disabled={!member?.personId}
                      className="shrink-0 w-20 text-center cursor-pointer disabled:cursor-default"
                      title={member?.personId ? `View ${member.name}` : member.name}
                    >
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 transition-all hover:border-cyan-500/60">
                        {member.profile_path ? (
                          <img
                            src={`${IMG_BASE}${member.profile_path}`}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">N/A</div>
                        )}
                      </div>
                      <p className="text-xs font-semibold truncate hover:text-cyan-400 transition-colors">{member.name}</p>
                      <p className="text-xs text-slate-500 truncate">{member.role}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* User Rating Section */}
            {!(item.isBackend ? !item.isNowPlaying : (item.releaseDate && new Date(item.releaseDate) > new Date())) && (
              <MovieRatingSection
                movieId={item.isBackend ? (item._id || item.id) : item.isAnime ? `anime_${item.id}` : item.mediaType === 'tv' ? `tv_${item.id}` : `tmdb_${item.id}`}
                isAuthenticated={isAuthenticated}
                onRatingChange={(data) => setPlatformRating({ averageRating: data.averageRating, totalRatings: data.totalRatings })}
              />
            )}
          </div>

          {/* Right Column - Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5 sticky top-28">
              <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
                {item.isAnime ? 'Anime Info' : item.mediaType === 'tv' ? 'Show Info' : 'Movie Info'}
              </h3>
              
              <div className="space-y-4">
                {/* Release Date */}
                <div>
                  <p className="text-xs text-slate-600 mb-0.5">
                    {item.isAnime ? 'Aired' : item.mediaType === 'tv' ? 'First Aired' : 'Release Date'}
                  </p>
                  <p className="font-medium text-sm">
                    {item.isAnime && item.aired ? item.aired : item.releaseDate || 'TBA'}
                  </p>
                </div>

                {/* Runtime */}
                <div>
                  <p className="text-xs text-slate-600 mb-0.5">
                    {item.isAnime ? 'Duration' : 'Runtime'}
                  </p>
                  <p className="font-medium text-sm">{formatRuntime(item.runtime)}</p>
                </div>

                {/* Episodes (Anime) */}
                {item.isAnime && item.episodes && (
                  <div>
                    <p className="text-xs text-slate-600 mb-0.5">Episodes</p>
                    <p className="font-medium text-sm">{item.episodes} episodes</p>
                  </div>
                )}

                {/* Seasons (TV) */}
                {item.mediaType === 'tv' && item.numberOfSeasons && (
                  <div>
                    <p className="text-xs text-slate-600 mb-0.5">Seasons</p>
                    <p className="font-medium text-sm">{item.numberOfSeasons} seasons • {item.numberOfEpisodes || '?'} episodes</p>
                  </div>
                )}

                {/* Status */}
                {item.status && (
                  <div>
                    <p className="text-xs text-slate-600 mb-0.5">Status</p>
                    <p className={`font-medium text-sm ${
                      item.status === 'Ended' || item.status === 'Finished Airing' 
                        ? 'text-slate-400' 
                        : 'text-green-400'
                    }`}>
                      {item.status}
                    </p>
                  </div>
                )}

                {/* Source (Anime) */}
                {item.isAnime && item.source && (
                  <div>
                    <p className="text-xs text-slate-600 mb-0.5">Source</p>
                    <p className="font-medium text-sm">{item.source}</p>
                  </div>
                )}

                {/* Studios (Anime) */}
                {item.isAnime && item.studios?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-600 mb-0.5">Studio</p>
                    <p className="font-medium text-sm">{item.studios.join(', ')}</p>
                  </div>
                )}

                {/* MAL Rank (Anime) */}
                {item.isAnime && item.rank && (
                  <div>
                    <p className="text-xs text-slate-600 mb-0.5">MAL Rank</p>
                    <p className="font-medium text-sm text-cyan-400">#{item.rank}</p>
                  </div>
                )}

                {/* Genres */}
                <div>
                  <p className="text-xs text-slate-600 mb-2">Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.genres?.length > 0 ? (
                      item.genres.map((genre) => (
                        <button
                          key={genre.id || genre.name}
                          onClick={() => handleGenreClick(genre)}
                          className="bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-400 px-2 py-1 rounded-full text-xs transition-all border border-slate-700/50 hover:border-cyan-500/30"
                        >
                          {genre.name}
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-600 text-sm">N/A</span>
                    )}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p className="text-xs text-slate-600 mb-0.5">Language</p>
                  <p className="font-medium text-sm">{getLanguageName(item.language)}</p>
                </div>

                {/* Watch Providers */}
                {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) && (
                  <div>
                    <p className="text-xs text-slate-600 mb-2">Where to Watch</p>
                    <div className="flex flex-wrap gap-2">
                      {[...(watchProviders.flatrate || []), ...(watchProviders.rent || []), ...(watchProviders.buy || [])]
                        .slice(0, 5)
                        .filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i)
                        .map(provider => (
                          <div 
                            key={provider.provider_id} 
                            className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50"
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
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MovieDetails;



