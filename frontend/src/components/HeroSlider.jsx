import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { NO_POSTER_IMAGE } from '../utils/imageFallback';

const AUTO_SLIDE_MS = 9500;
const DESCRIPTION_LIMIT = 180;
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const PLACEHOLDER_BACKDROP = NO_POSTER_IMAGE;
const DATA_REFRESH_MS = 45000;
const trailerKeyCache = new Map();

const preloadImage = (src) => {
  if (!src) return Promise.resolve();
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
    if (image.complete) resolve();
  });
};

const truncate = (text, max = DESCRIPTION_LIMIT) => {
  const safe = String(text || '').trim();
  if (!safe) return 'No description available.';
  if (safe.length <= max) return safe;
  return `${safe.slice(0, max).trimEnd()}...`;
};

const formatYear = (dateValue) => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? 'N/A' : String(date.getFullYear());
};

const parseShowtimeStart = (dateValue, timeValue) => {
  const baseDate = new Date(dateValue);
  if (Number.isNaN(baseDate.getTime())) return null;

  const time = String(timeValue || '').trim();
  if (!time) return baseDate;

  const twelveHour = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const twentyFourHour = time.match(/^(\d{1,2}):(\d{2})$/);

  let hours = 0;
  let minutes = 0;

  if (twelveHour) {
    hours = Number(twelveHour[1]);
    minutes = Number(twelveHour[2]);
    const period = twelveHour[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else if (twentyFourHour) {
    hours = Number(twentyFourHour[1]);
    minutes = Number(twentyFourHour[2]);
  } else {
    return baseDate;
  }

  const parsed = new Date(baseDate);
  parsed.setHours(hours, minutes, 0, 0);
  return parsed;
};

const hasActiveShowtime = (movie) => {
  const showtimes = Array.isArray(movie?.showtimes) ? movie.showtimes : [];
  const now = new Date();

  return showtimes.some((showtime) => {
    const start = parseShowtimeStart(showtime?.date, showtime?.time);
    return start && start >= now;
  });
};

const getBackdrop = (movie) => movie?.backdrop || movie?.poster || PLACEHOLDER_BACKDROP;

const isDirectVideo = (url) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url || ''));

const getKnownTrailer = (movie) => {
  if (movie?.trailerUrl) {
    return isDirectVideo(movie.trailerUrl) ? { type: 'video', src: movie.trailerUrl } : null;
  }
  if (movie?.trailerVideoUrl) {
    return isDirectVideo(movie.trailerVideoUrl) ? { type: 'video', src: movie.trailerVideoUrl } : null;
  }
  if (movie?.trailerKey) {
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${movie.trailerKey}&rel=0&playsinline=1&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0&autohide=1&enablejsapi=0`
    };
  }
  return null;
};

const buildYoutubeTrailer = (key) => ({
  type: 'youtube',
  src: `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${key}&rel=0&playsinline=1&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0&autohide=1&enablejsapi=0`
});

const fetchTmdbTrailerKey = async (tmdbId) => {
  if (!TMDB_API_KEY || !tmdbId) return null;
  const cacheKey = String(tmdbId);
  if (trailerKeyCache.has(cacheKey)) {
    return trailerKeyCache.get(cacheKey);
  }

  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
    if (!response.ok) {
      trailerKeyCache.set(cacheKey, null);
      return null;
    }

    const data = await response.json();
    const videos = Array.isArray(data?.results) ? data.results : [];
    const trailer =
      videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
      videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
      videos.find((v) => v.site === 'YouTube');

    const key = trailer?.key || null;
    trailerKeyCache.set(cacheKey, key);
    return key;
  } catch {
    trailerKeyCache.set(cacheKey, null);
    return null;
  }
};

const getPrimaryGenre = (movie) => {
  if (Array.isArray(movie?.genre) && movie.genre.length > 0) {
    return movie.genre[0];
  }
  if (Array.isArray(movie?.genres) && movie.genres.length > 0) {
    return typeof movie.genres[0] === 'string' ? movie.genres[0] : movie.genres[0]?.name || 'N/A';
  }
  return 'N/A';
};

function HeroSlider() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    if (movies.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  const goToPrev = () => {
    if (movies.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  useEffect(() => {
    const fetchNowPlaying = async () => {
      setLoading(true);
      try {
        const response = await api.get('/movies');
        const rows = Array.isArray(response.data?.data) ? response.data.data : [];

        // Include recently added theater movies, not only isNowPlaying items.
        const active = rows
          .filter((movie) => hasActiveShowtime(movie) || movie?.isNowPlaying || movie?.bookingEnabled)
          .sort((a, b) => {
            const aActive = hasActiveShowtime(a) ? 1 : 0;
            const bActive = hasActiveShowtime(b) ? 1 : 0;
            if (bActive !== aActive) return bActive - aActive;

            const aCreated = new Date(a?.createdAt || 0).getTime();
            const bCreated = new Date(b?.createdAt || 0).getTime();
            return bCreated - aCreated;
          });

        const withTrailers = await Promise.all(
          active.map(async (movie) => {
            const known = getKnownTrailer(movie);
            if (known) return { ...movie, trailer: known };

            const trailerKey = await fetchTmdbTrailerKey(movie.tmdbId);
            if (trailerKey) {
              return { ...movie, trailer: buildYoutubeTrailer(trailerKey) };
            }

            return { ...movie, trailer: null };
          })
        );

        if (withTrailers.length > 0) {
          await preloadImage(getBackdrop(withTrailers[0]));
        }

        setMovies(withTrailers);
      } catch (error) {
        console.error('Failed to fetch hero slider movies:', error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNowPlaying();

    const timer = setInterval(fetchNowPlaying, DATA_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (movies.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, AUTO_SLIDE_MS);

    return () => clearInterval(timer);
  }, [movies.length]);

  useEffect(() => {
    if (movies.length <= 1) return;
    const nextMovie = movies[(currentIndex + 1) % movies.length];
    preloadImage(getBackdrop(nextMovie));
  }, [currentIndex, movies]);

  const activeMovie = useMemo(() => {
    if (movies.length === 0) return null;
    return movies[currentIndex] || movies[0];
  }, [movies, currentIndex]);

  if (loading) {
    return (
      <section className="relative h-[85vh] md:h-[90vh] min-h-130 w-full overflow-hidden bg-slate-950">
        <div className="absolute inset-0 animate-pulse bg-slate-800/80" />
        <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/40 to-transparent" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8 lg:px-12">
          <div className="w-full max-w-2xl space-y-4">
            <div className="h-5 w-40 rounded bg-slate-700/90" />
            <div className="h-12 w-3/4 rounded bg-slate-700/90" />
            <div className="h-4 w-2/3 rounded bg-slate-700/80" />
            <div className="h-4 w-full rounded bg-slate-700/80" />
            <div className="h-4 w-11/12 rounded bg-slate-700/80" />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="h-12 w-40 rounded-xl bg-slate-700/90" />
              <div className="h-12 w-40 rounded-xl bg-slate-700/80" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!activeMovie) {
    return (
      <section className="relative flex h-[60vh] min-h-105 w-full items-center justify-center bg-slate-950 text-center text-white">
        <div>
          <h2 className="text-3xl font-black sm:text-4xl">No active movies found</h2>
          <p className="mt-2 text-sm text-slate-400">Add now-playing movies with upcoming showtimes to display the hero slider.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[85vh] md:h-[90vh] min-h-130 w-full overflow-hidden text-white">
      {movies.map((movie, index) => (
        <div
          key={movie._id}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            index === currentIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {index === currentIndex && movie?.trailer?.type === 'video' ? (
            <video
              className={`h-full w-full object-cover object-center ${index === currentIndex ? 'cinema-hero-bg-zoom' : ''}`}
              src={movie.trailer.src}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : index === currentIndex && movie?.trailer?.type === 'youtube' ? (
            <>
              <iframe
                src={movie.trailer.src}
                title={`${movie.title} trailer`}
                className={`h-full w-full object-cover object-center pointer-events-none ${index === currentIndex ? 'cinema-hero-bg-zoom' : ''}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
              <div className="pointer-events-none absolute left-0 right-0 top-0 h-16 bg-black/45" />
              <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-16 bg-black/55" />
            </>
          ) : (
            <img
              src={getBackdrop(movie)}
              alt={movie.title}
              className={`h-full w-full object-cover object-center ${index === currentIndex ? 'cinema-hero-bg-zoom' : ''}`}
            />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-black/72 via-black/20 to-black/5" />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8 lg:px-12">
        <div className="flex w-full items-end justify-between gap-8">
          <div key={activeMovie._id} className="cinema-hero-text-enter max-w-xl space-y-4 md:space-y-6">
            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl">
              {activeMovie.title}
            </h1>

            <p className="text-sm font-semibold text-slate-200 md:text-base">
              ⭐ {Number(activeMovie.rating || 0).toFixed(1)} | {formatYear(activeMovie.releaseDate)} | {getPrimaryGenre(activeMovie)}
            </p>

            <p className="max-w-xl text-sm leading-relaxed text-slate-200 md:text-base lg:text-lg line-clamp-3">
              {truncate(activeMovie.description)}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate(`/booking/${activeMovie._id}`)}
                className="rounded-2xl border border-red-500/75 bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/35 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500"
              >
                Book Now
              </button>
              <button
                type="button"
                onClick={() => navigate(`/movie/backend/${activeMovie._id}`)}
                className="rounded-2xl border border-white/35 bg-[rgba(15,23,42,0.45)] px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(30,41,59,0.62)]"
              >
                View Details
              </button>
            </div>
          </div>

          {/* Optional floating poster preview */}
          <div className="hidden lg:block">
            <div className="cinema-hero-poster-float w-48 overflow-hidden rounded-2xl border border-white/20 bg-black/35 shadow-2xl shadow-black/45 backdrop-blur-sm">
              {activeMovie.poster ? (
                <img
                  src={activeMovie.poster}
                  alt={`${activeMovie.title} poster`}
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 w-full items-center justify-center bg-white/10 text-sm text-slate-300">
                  No Poster
                </div>
              )}
              <div className="border-t border-white/10 bg-black/55 p-3">
                <p className="truncate text-sm font-semibold text-white">{activeMovie.title}</p>
                <p className="text-xs text-slate-300">{formatYear(activeMovie.releaseDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {movies.length > 1 && (
        <div className="pointer-events-none absolute inset-y-0 left-3 right-3 z-20 hidden items-center justify-between sm:flex">
          <button
            type="button"
            onClick={goToPrev}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/65"
            aria-label="Previous slide"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/65"
            aria-label="Next slide"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {movies.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {movies.map((movie, index) => (
            <button
              key={movie._id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all ${
                index === currentIndex ? 'h-2.5 w-9 bg-white' : 'h-2.5 w-2.5 bg-white/45 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default HeroSlider;