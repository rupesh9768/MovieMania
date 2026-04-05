import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNepaliMovies, getIndianMovies, getUpcomingBigMovies, getTrendingMovies } from '../api/movieService';
import { getTrendingTV } from '../api/tvService';
import { getTopAnime } from '../api/animeService';
import { getBackendNowPlaying, getGlobalShowingMovies, getMostInterestedMovies } from '../api/backendService';
import TrendingDiscussions from '../components/TrendingDiscussions';
import HeroSlider from '../components/HeroSlider';
import { NO_POSTER_IMAGE, handleImageError } from '../utils/imageFallback';

const Home = () => {
  const navigate = useNavigate();
  const nepaliRef = useRef(null);
  const indianRef = useRef(null);
  const trendingRef = useRef(null);
  const globalRef = useRef(null);
  const mostInterestedRef = useRef(null);
  const trendingTvRef = useRef(null);
  const trendingAnimeRef = useRef(null);
  
  // State for different movie sections
  const [nepaliMovies, setNepaliMovies] = useState([]);
  const [indianMovies, setIndianMovies] = useState([]);
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [globalMoviePool, setGlobalMoviePool] = useState([]);
  const [globalMovies, setGlobalMovies] = useState([]);
  const [trendingTVShows, setTrendingTVShows] = useState([]);
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [mostInterested, setMostInterested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const shuffleArray = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const normalizeGenreText = (movie) => {
    if (Array.isArray(movie?.genres)) {
      return movie.genres.map((g) => (typeof g === 'string' ? g : g?.name || '')).join(' ').toLowerCase();
    }
    if (Array.isArray(movie?.genre)) {
      return movie.genre.join(' ').toLowerCase();
    }
    return '';
  };

  const isLikelyNepali = (movie) => {
    const title = String(movie?.title || '').toLowerCase();
    const genreText = normalizeGenreText(movie);
    const language = String(movie?.original_language || movie?.language || '').toLowerCase();
    const region = String(movie?.region || movie?.country || '').toUpperCase();

    return (
      language === 'ne' ||
      region === 'NP' ||
      title.includes('nepali') ||
      genreText.includes('nepali')
    );
  };

  const dedupeById = (movies) => {
    const seen = new Set();
    return movies.filter((movie) => {
      const id = movie?._id || movie?.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const buildCuratedNepaliSelection = ({ baseNepali, upcoming }) => {
    const nepaliPool = dedupeById(baseNepali.filter(isLikelyNepali));
    const generalNepaliPool = dedupeById(baseNepali);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingNepali = nepaliPool.filter((movie) => {
      if (!movie.releaseDate) return false;
      const d = new Date(movie.releaseDate);
      return !Number.isNaN(d.getTime()) && d >= today;
    });

    const popularNepali = [...nepaliPool].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const olderNepali = nepaliPool.filter((movie) => {
      if (!movie.releaseDate) return false;
      const d = new Date(movie.releaseDate);
      return !Number.isNaN(d.getTime()) && d < today;
    });

    const mixed = dedupeById([
      ...shuffleArray(popularNepali).slice(0, 4),
      ...shuffleArray(upcomingNepali).slice(0, 3),
      ...shuffleArray(olderNepali).slice(0, 5)
    ]);

    // If our curated mix is too small, top up using globally upcoming items that still look Nepali.
    const upcomingFallback = dedupeById(upcoming.filter(isLikelyNepali));
    const toppedUp = dedupeById([...mixed, ...shuffleArray(upcomingFallback)]);

    // If strict filters produce too few titles, widen to general Nepali pool before fallback.
    const widened = toppedUp.length >= 12
      ? toppedUp
      : dedupeById([...toppedUp, ...shuffleArray(generalNepaliPool)]);

    return shuffleArray(widened).slice(0, 18);
  };

  const buildGlobalSelection = (movies, limit = 12) => {
    return shuffleArray(dedupeById(movies)).slice(0, limit);
  };

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          backendNowPlayingResult,
          globalShowingResult,
          nepaliPage1Result,
          nepaliPage2Result,
          nepaliPage3Result,
          nepaliPage4Result,
          nepaliPage5Result,
          indianResult,
          upcomingResult,
          trendingResult,
          trendingTVResult,
          topAnimeResult,
          mostInterestedResult
        ] = await Promise.allSettled([
          getBackendNowPlaying(),
          getGlobalShowingMovies(),
          getNepaliMovies(1),
          getNepaliMovies(2),
          getNepaliMovies(3),
          getNepaliMovies(4),
          getNepaliMovies(5),
          getIndianMovies(1),
          getUpcomingBigMovies(12),
          getTrendingMovies('week', false),
          getTrendingTV('week'),
          getTopAnime({ page: 1, limit: 15, filter: 'bypopularity' }),
          getMostInterestedMovies()
        ]);

        const backendNowPlaying = backendNowPlayingResult.status === 'fulfilled' ? backendNowPlayingResult.value : [];
        const globalShowing = globalShowingResult.status === 'fulfilled' ? globalShowingResult.value : [];
        const nepaliPage1 = nepaliPage1Result.status === 'fulfilled' ? nepaliPage1Result.value : [];
        const nepaliPage2 = nepaliPage2Result.status === 'fulfilled' ? nepaliPage2Result.value : [];
        const nepaliPage3 = nepaliPage3Result.status === 'fulfilled' ? nepaliPage3Result.value : [];
        const nepaliPage4 = nepaliPage4Result.status === 'fulfilled' ? nepaliPage4Result.value : [];
        const nepaliPage5 = nepaliPage5Result.status === 'fulfilled' ? nepaliPage5Result.value : [];
        const indian = indianResult.status === 'fulfilled' ? indianResult.value : [];
        const upcoming = upcomingResult.status === 'fulfilled' ? upcomingResult.value : [];
        const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [];
        const trendingTV = trendingTVResult.status === 'fulfilled' ? trendingTVResult.value : [];
        const topAnime = topAnimeResult.status === 'fulfilled' ? topAnimeResult.value?.data || [] : [];
        const mostInterestedData = mostInterestedResult.status === 'fulfilled' ? mostInterestedResult.value : [];
        
        console.log('Homepage data results:', {
          backendNowPlaying: backendNowPlaying.length,
          globalShowing: globalShowing.length,
          nepali: nepaliPage1.length + nepaliPage2.length + nepaliPage3.length + nepaliPage4.length + nepaliPage5.length,
          indian: indian.length,
          upcoming: upcoming.length,
          trending: trending.length,
          trendingTV: trendingTV.length,
          topAnime: topAnime.length
        });
        
        setNowShowingMovies(backendNowPlaying.slice(0, 15));

        const curatedNepali = buildCuratedNepaliSelection({
          baseNepali: [...nepaliPage1, ...nepaliPage2, ...nepaliPage3, ...nepaliPage4, ...nepaliPage5],
          upcoming
        });

        // Fallback: if no Nepali movies are found, use Indian/regional discovery picks.
        if (curatedNepali.length > 0) {
          setNepaliMovies(curatedNepali);
        } else {
          setNepaliMovies(shuffleArray(indian).slice(0, 18));
        }

        setIndianMovies(indian.slice(0, 15));

        // Globally showing movies (shuffled once on load)
        const globalPool = dedupeById(globalShowing);
        const globalFallbackPool = globalPool.length > 0 ? globalPool : dedupeById(trending);
        setGlobalMoviePool(globalFallbackPool);
        setGlobalMovies(buildGlobalSelection(globalFallbackPool, 12));

        setTrendingTVShows(trendingTV.slice(0, 12));
        setTrendingAnime(
          topAnime.slice(0, 12).map((anime) => ({
            id: anime.mal_id,
            title: anime.title,
            image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null,
            year: anime.aired?.prop?.from?.year || '',
            rating: anime.score || 0,
          }))
        );
        
        // Most Interested = upcoming movies sorted by interest count from backend
        setMostInterested(mostInterestedData.slice(0, 15));
        
      } catch (err) {
        console.error('Failed to load homepage data:', err);
        setError('Failed to load homepage movies.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllMovies();
  }, []);

  // Optional refresh behavior: reshuffle globally showing cards every 75s without refetching.
  useEffect(() => {
    if (globalMoviePool.length === 0) return undefined;
    const timer = setInterval(() => {
      setGlobalMovies(buildGlobalSelection(globalMoviePool, 12));
    }, 75000);

    return () => clearInterval(timer);
  }, [globalMoviePool]);

  const isBackendMovie = (movie) => Boolean(movie?.isBackend || movie?._id || movie?._raw?._id);

  const getBackendMovieId = (movie) => movie?._id || movie?._raw?._id || movie?.id;

  const getMovieDetailsPath = (movie) => {
    if (isBackendMovie(movie)) {
      return `/movie/backend/${getBackendMovieId(movie)}`;
    }
    return `/movie/${movie.id}`;
  };

  const handleViewDetails = (movie) => {
    navigate(getMovieDetailsPath(movie));
  };

  const scrollSection = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction * 300, behavior: 'smooth' });
    }
  };

  // Reusable movie card with fire emoji
  const MovieCardRow = ({ movie, rank, sectionBadge, showRating = false }) => {
    return (
      <div 
        key={movie.id} 
        className="shrink-0 w-48 cursor-pointer group"
        onClick={() => handleViewDetails(movie)}
      >
        <div className="relative aspect-2/3 rounded-[14px] overflow-hidden mb-3 border border-[#2a2a2a] bg-card-bg group-hover:border-[#3a3a3a] transition-all duration-150 shadow-sm group-hover:-translate-y-1 group-hover:shadow-lg">
          <img 
            src={movie.image || NO_POSTER_IMAGE} 
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-150"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>

          {/* Interested count badge */}
          {movie.interestedCount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
              {movie.interestedCount}
            </div>
          )}

          {sectionBadge && (
            <div className="absolute top-2 left-2 bg-black/65 border border-white/25 px-2 py-1 rounded-lg text-[11px] font-bold text-white backdrop-blur-sm">
              {sectionBadge}
            </div>
          )}

          {/* Rank badge for most interested */}
          {rank && (
            <div className="most-interested-rank absolute bottom-2 left-2 text-5xl font-black text-white/10 leading-none select-none pointer-events-none transition-all duration-200">
              {rank}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-sm truncate text-white transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-[#b3b3b3]">{movie.year}</p>
        {showRating && (
          <p className="text-xs text-[#b3b3b3] mt-1">⭐ {Number(movie.rating || 0).toFixed(1)}</p>
        )}
      </div>
    );
  };

  const MediaCardRow = ({ item, onClick, sectionBadge, showRating = false }) => (
    <div
      key={item.id}
      className="shrink-0 w-48 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-2/3 rounded-[14px] overflow-hidden mb-3 border border-[#2a2a2a] bg-card-bg group-hover:border-[#3a3a3a] transition-all duration-150 shadow-sm group-hover:-translate-y-1 group-hover:shadow-lg">
        <img
          src={item.image || NO_POSTER_IMAGE}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-150"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>

        {sectionBadge && (
          <div className="absolute top-2 left-2 bg-black/65 border border-white/25 px-2 py-1 rounded-lg text-[11px] font-bold text-white backdrop-blur-sm">
            {sectionBadge}
          </div>
        )}
      </div>
      <h3 className="font-semibold text-sm truncate text-white transition-colors">{item.title}</h3>
      <p className="text-xs text-[#b3b3b3]">{item.year || 'N/A'}</p>
      {showRating && (
        <p className="text-xs text-[#b3b3b3] mt-1">⭐ {Number(item.rating || 0).toFixed(1)}</p>
      )}
    </div>
  );

  // Section header component
  const SectionHeader = ({ title, badge, subtitle, scrollRef }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[1.85rem] font-bold tracking-tight">{title}</h2>
          {badge && (
            <span className="text-xs font-semibold text-[#b3b3b3] bg-[#181818] px-3 py-1 rounded-full border border-[#2a2a2a]">
              {badge}
            </span>
          )}
        </div>
        {scrollRef && (
          <div className="flex gap-2">
            <button 
              onClick={() => scrollSection(scrollRef, -1)} 
              className="w-10 h-10 bg-[#181818] hover:bg-[#242424] rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border border-[#2a2a2a] text-[#b3b3b3] hover:text-white hover:scale-[1.03]"
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              onClick={() => scrollSection(scrollRef, 1)} 
              className="w-10 h-10 bg-[#181818] hover:bg-[#242424] rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer border border-[#2a2a2a] text-[#b3b3b3] hover:text-white hover:scale-[1.03]"
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
      {subtitle && <p className="text-sm text-[#b3b3b3] mb-3">{subtitle}</p>}
      <div className="h-px bg-[#2a2a2a]"></div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">API Error</h2>
          <p className="text-[#b3b3b3] mb-6 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#E50914] hover:bg-[#c40812] text-white font-bold py-2.5 px-8 rounded-full transition-all duration-150 cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <HeroSlider />

      {/* Main Content */}
      <div className="max-w-310 mx-auto px-5 pt-6 pb-14">

        {/* ========== MOST INTERESTED SECTION ========== */}
        {!loading && mostInterested.length > 0 && (
          <section className="mt-6 mb-16 section-animate">
            <SectionHeader title="Most Anticipated" badge="Upcoming" scrollRef={mostInterestedRef} />
            
            <div 
              ref={mostInterestedRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {mostInterested.map((movie, index) => (
                <MovieCardRow key={movie.id} movie={movie} rank={index + 1} />
              ))}
            </div>
          </section>
        )}

        {/* ========== TRENDING DISCUSSIONS ========== */}
        <TrendingDiscussions />
        
        {/* ========== NEPALI MOVIES ========== */}
        {!loading && nepaliMovies.length > 0 && (
          <section className="mt-15 mb-14 section-animate">
            <SectionHeader
              title="Nepali Movies"
              badge="Nepal"
              subtitle="Popular & Trending Nepali Movies"
              scrollRef={nepaliRef}
            />
            
            <div 
              ref={nepaliRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {nepaliMovies.map((movie) => (
                <MovieCardRow key={movie.id} movie={movie} sectionBadge="🇳🇵 Nepali" />
              ))}
            </div>
          </section>
        )}

        {/* ========== INDIAN (BOLLYWOOD) MOVIES ========== */}
        {!loading && indianMovies.length > 0 && (
          <section className="mt-15 mb-14 section-animate">
            <SectionHeader title="Bollywood Movies" badge="India" scrollRef={indianRef} />
            
            <div 
              ref={indianRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {indianMovies.map((movie) => (
                <MovieCardRow key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* ========== GLOBALLY SHOWING MOVIES ========== */}
        {!loading && (
          <section className="mt-15 mb-14 section-animate">
            <SectionHeader
              title="Globally Trending Movies"
              badge="Trending"
              subtitle="TMDB trending movies from around the world"
              scrollRef={globalRef}
            />

            {globalMovies.length > 0 ? (
              <div
                ref={globalRef}
                className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {globalMovies.map((movie) => (
                  <MovieCardRow
                    key={movie.id}
                    movie={movie}
                    sectionBadge="Trending"
                    showRating
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#2a2a2a] bg-[#181818] p-6 text-sm text-[#b3b3b3]">
                Global movies are temporarily unavailable right now.
              </div>
            )}
          </section>
        )}

        {/* ========== TRENDING TV SHOWS ========== */}
        {!loading && trendingTVShows.length > 0 && (
          <section className="mt-15 mb-14 section-animate">
            <SectionHeader
              title="Trending TV Shows"
              badge="Weekly"
              subtitle="The hottest TV shows right now"
              scrollRef={trendingTvRef}
            />

            <div
              ref={trendingTvRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {trendingTVShows.map((show) => (
                <MediaCardRow
                  key={show.id}
                  item={show}
                  sectionBadge="TV"
                  onClick={() => navigate(`/details/tv/${show.id}`)}
                  showRating
                />
              ))}
            </div>
          </section>
        )}

        {/* ========== TRENDING ANIME ========== */}
        {!loading && trendingAnime.length > 0 && (
          <section className="mt-15 mb-14 section-animate">
            <SectionHeader
              title="Trending Anime"
              badge="Popular"
              subtitle="Top fan-favorite anime picks right now"
              scrollRef={trendingAnimeRef}
            />

            <div
              ref={trendingAnimeRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {trendingAnime.map((anime) => (
                <MediaCardRow
                  key={anime.id}
                  item={anime}
                  sectionBadge="Anime"
                  onClick={() => navigate(`/details/anime/${anime.id}`)}
                  showRating
                />
              ))}
            </div>
          </section>
        )}

        {/* ========== NOW SHOWING MOVIES ========== */}
        {!loading && nowShowingMovies.length > 0 && (
          <section className="mt-15 mb-14 section-animate">
            <SectionHeader title="Now Showing" badge="In Theater" scrollRef={trendingRef} />
            
            <div 
              ref={trendingRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {nowShowingMovies.map((movie) => (
                <MovieCardRow key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* ========== EXPLORE MORE BUTTON ========== */}
        <section className="mt-15 py-16 text-center section-animate">
          <div className="glass-card rounded-3xl p-12 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-3">Discover More Movies</h3>
            <p className="text-[#b3b3b3] text-sm mb-8 max-w-md mx-auto">Explore thousands of movies from around the world. From Hollywood blockbusters to regional cinema.</p>
            <button 
              onClick={() => navigate('/movies')}
              className="bg-[#E50914] hover:bg-[#c40812] text-white font-bold py-4 px-12 rounded-full text-lg transition-all duration-150 cursor-pointer"
            >
              Browse All Movies
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;



