import React, { useState, useEffect, useRef } from 'react';
import { submitRating, getMovieRatings } from '../api/ratingService';

const StarRating = ({ rating, hoverRating, onHover, onLeave, onClick, disabled }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-1" onMouseLeave={onLeave}>
      {stars.map((star) => {
        const filled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onClick(star)}
            onMouseEnter={() => onHover(star)}
            className={`text-2xl transition-all duration-200 ease-out
              ${filled ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]' : 'text-slate-600'}
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-125 active:scale-90'}
            `}
            style={{ transform: disabled ? undefined : undefined }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};

const RatingDistribution = ({ distribution, totalRatings }) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const bars = [5, 4, 3, 2, 1];

  return (
    <div ref={ref} className="space-y-2">
      {bars.map((star) => {
        const count = distribution[star] || 0;
        const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-4 text-right text-slate-400 font-medium">{star}</span>
            <span className="text-yellow-400 text-xs">★</span>
            <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: animated ? `${pct}%` : '0%' }}
              />
            </div>
            <span className="w-8 text-right text-xs text-slate-500">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

const MovieRatingSection = ({ movieId, isAuthenticated, onRatingChange }) => {
  const [ratingData, setRatingData] = useState({
    averageRating: 0,
    totalRatings: 0,
    userRating: null,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [justRated, setJustRated] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!movieId) return;
    getMovieRatings(movieId)
      .then(data => {
        setRatingData(data);
        onRatingChange?.(data);
      })
      .catch(err => console.error('Failed to load ratings:', err));
  }, [movieId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleRate = async (star) => {
    if (!isAuthenticated || submitting) return;

    // Optimistic update
    const prev = { ...ratingData };
    const oldUserRating = ratingData.userRating;
    const newDist = { ...ratingData.distribution };

    if (oldUserRating) {
      newDist[oldUserRating] = Math.max(0, (newDist[oldUserRating] || 0) - 1);
    }
    newDist[star] = (newDist[star] || 0) + 1;

    const newTotal = oldUserRating ? ratingData.totalRatings : ratingData.totalRatings + 1;
    const oldSum = ratingData.averageRating * ratingData.totalRatings;
    const newSum = oldUserRating ? oldSum - oldUserRating + star : oldSum + star;
    const newAvg = newTotal > 0 ? Math.round((newSum / newTotal) * 10) / 10 : 0;

    setRatingData({
      averageRating: newAvg,
      totalRatings: newTotal,
      userRating: star,
      distribution: newDist
    });
    setJustRated(true);
    setTimeout(() => setJustRated(false), 2000);

    setSubmitting(true);
    try {
      await submitRating(movieId, star);
      // Refresh from server
      const fresh = await getMovieRatings(movieId);
      setRatingData(fresh);
      onRatingChange?.(fresh);
    } catch (err) {
      console.error('Failed to submit rating:', err);
      setRatingData(prev); // rollback
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`bg-slate-900/60 border border-slate-800/50 rounded-xl p-6 transition-all duration-700 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <h2 className="text-lg font-bold mb-5 text-slate-200">Rate this Movie</h2>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Left: Average + Star Input */}
        <div className="space-y-4">
          {/* Average Rating Display */}
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold text-yellow-400">
              {ratingData.averageRating > 0 ? ratingData.averageRating : '—'}
            </div>
            <div>
              <div className="flex text-yellow-400 text-sm">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className={s <= Math.round(ratingData.averageRating) ? 'text-yellow-400' : 'text-slate-700'}>★</span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {ratingData.totalRatings} {ratingData.totalRatings === 1 ? 'rating' : 'ratings'}
              </p>
            </div>
          </div>

          {/* Star Rating Input */}
          <div>
            {isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  {ratingData.userRating ? 'Your rating (click to change):' : 'Tap a star to rate:'}
                </p>
                <StarRating
                  rating={ratingData.userRating || 0}
                  hoverRating={hoverRating}
                  onHover={setHoverRating}
                  onLeave={() => setHoverRating(0)}
                  onClick={handleRate}
                  disabled={submitting}
                />
                {/* Confirmation message */}
                <div className={`text-sm transition-all duration-300 ${justRated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
                  {ratingData.userRating && (
                    <span className="text-yellow-400">
                      You rated this {ratingData.userRating} {'★'.repeat(ratingData.userRating)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Log in to rate this movie</p>
            )}
          </div>
        </div>

        {/* Right: Distribution Graph */}
        <div>
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Rating Distribution</p>
          <RatingDistribution
            distribution={ratingData.distribution}
            totalRatings={ratingData.totalRatings}
          />
        </div>
      </div>
    </section>
  );
};

export default MovieRatingSection;
