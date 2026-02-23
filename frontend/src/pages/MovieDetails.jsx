import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  checkItemInLists, 
  addToWatchlist, 
  removeFromWatchlist,
  addToFavorites,
  removeFromFavorites 
} from '../api/userService';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';

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
  const { isAuthenticated } = useAuth();
  
  // Determine media type from URL
  const getMediaType = () => {
    if (routeMediaType) return routeMediaType;
    if (location.pathname.startsWith('/tv/')) return 'tv';
    if (location.pathname.startsWith('/anime/')) return 'anime';
    return 'movie';
  };
  
  const mediaType = getMediaType();
  
  // State
  const [item, setItem] = useState(null);
  const [cast, setCast] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  
  // Watchlist and Favorites state
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [listLoading, setListLoading] = useState(false);

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
    
    setListLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(mediaType, id);
        setInWatchlist(false);
      } else {
        await addToWatchlist({
          mediaType,
          id,
          title: item.title,
          poster: item.poster,
          rating: item.rating
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Watchlist error:', error);
      alert(error.response?.data?.message || 'Failed to update watchlist');
    } finally {
      setListLoading(false);
    }
  };

  const handleFavoritesToggle = async () => {
    if (!isAuthenticated) {
      alert('Please login to add to favorites');
      navigate('/login');
      return;
    }
    
    if (!item) return;
    
    setListLoading(true);
    try {
      if (inFavorites) {
        await removeFromFavorites(mediaType, id);
        setInFavorites(false);
      } else {
        await addToFavorites({
          mediaType,
          id,
          title: item.title,
          poster: item.poster,
          rating: item.rating
        });
        setInFavorites(true);
      }
    } catch (error) {
      console.error('Favorites error:', error);
      alert(error.response?.data?.message || 'Failed to update favorites');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
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
            rating: anime.score,
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
          rating: data.vote_average,
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
        
      } catch (err) {
        console.error('Failed to fetch:', err);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, mediaType]);

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

  const posterUrl = item.isAnime 
    ? item.poster 
    : item.poster ? `${IMG_BASE}${item.poster}` : null;
  
  const backdropUrl = item.isAnime 
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
              
              {item.tagline && (
                <p className="text-slate-400 italic text-sm mb-3">"{item.tagline}"</p>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {trailer && (
                  <button 
                    onClick={() => setShowTrailerModal(true)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-5 rounded-full transition-all text-sm cursor-pointer"
                  >
                    Watch Trailer
                  </button>
                )}
                
                {/* Watchlist Button */}
                <button 
                  onClick={handleWatchlistToggle}
                  disabled={listLoading}
                  className={`font-medium py-2.5 px-5 rounded-full transition-all text-sm border cursor-pointer flex items-center gap-2 ${
                    inWatchlist 
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  } ${listLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {listLoading ? (
                    <span className="animate-spin text-xs">...</span>
                  ) : inWatchlist ? (
                    <>In Watchlist</>
                  ) : (
                    <>+ Watchlist</>
                  )}
                </button>
                
                {/* Favorites Button */}
                <button 
                  onClick={handleFavoritesToggle}
                  disabled={listLoading}
                  className={`font-medium py-2.5 px-5 rounded-full transition-all text-sm border cursor-pointer flex items-center gap-2 ${
                    inFavorites 
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  } ${listLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {listLoading ? (
                    <span className="animate-spin text-xs">...</span>
                  ) : inFavorites ? (
                    <>Favorited</>
                  ) : (
                    <>Favorite</>
                  )}
                </button>

                <button 
                  onClick={() => navigate(-1)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-5 rounded-full transition-all text-sm border border-slate-700 cursor-pointer"
                >
                  Back
                </button>
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

            {/* Rating */}
            <section className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">User Rating</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-yellow-400">
                      {item.rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-slate-600">/ 10</span>
                  </div>
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`text-lg ${
                          star <= Math.round((item.rating || 0) / 2) 
                            ? 'text-yellow-400' 
                            : 'text-slate-700'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {item.voteCount && (
                    <p className="text-xs text-slate-500 mt-2">{item.voteCount.toLocaleString()} votes</p>
                  )}
                </div>
              </div>
            </section>

            {/* Cast */}
            {cast.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 text-slate-200">Cast</h2>
                <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                  {cast.map(person => (
                    <div key={person.id} className="shrink-0 w-20 text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800">
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
                      <p className="text-xs font-semibold truncate">{person.name}</p>
                      <p className="text-xs text-slate-500 truncate">{person.character}</p>
                    </div>
                  ))}
                </div>
              </section>
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

      {/* Comment Section */}
      <div className="max-w-6xl mx-auto px-6">
        <CommentSection
          contentId={String(id)}
          contentType={mediaType === 'tv' ? 'tv' : mediaType === 'anime' ? 'anime' : 'movie'}
          contentTitle={item.title}
        />
      </div>
    </div>
  );
};

export default MovieDetails;



