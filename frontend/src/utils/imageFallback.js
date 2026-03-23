export const NO_POSTER_IMAGE = '/no-poster.png';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const getTmdbPosterUrl = (posterPath, size = 'w500') => {
  if (!posterPath) return NO_POSTER_IMAGE;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
};

export const getImageWithFallback = (src) => src || NO_POSTER_IMAGE;

export const handleImageError = (event, fallback = NO_POSTER_IMAGE) => {
  const target = event?.currentTarget || event?.target;
  if (!target) return;

  // Prevent loops if fallback image itself cannot be loaded.
  target.onerror = null;
  target.src = fallback;
};
