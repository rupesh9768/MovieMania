import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrendingDiscussions } from '../api/discussionService';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w200';
const JIKAN_BASE = 'https://api.jikan.moe/v4';

const TYPE_LABELS = { movie: 'Movie', tv: 'TV Show', anime: 'Anime', theater: 'Theater' };

const TrendingDiscussions = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrendingDiscussions();
        if (data.success && data.trending?.length > 0) {
          const enriched = await Promise.all(
            data.trending.slice(0, 5).map(async (item) => {
              try {
                if (item.contentType === 'anime') {
                  const res = await fetch(`${JIKAN_BASE}/anime/${item.contentId}`);
                  if (res.ok) {
                    const d = await res.json();
                    return { ...item, title: d.data?.title, poster: d.data?.images?.jpg?.small_image_url };
                  }
                } else {
                  const endpoint = item.contentType === 'tv' ? 'tv' : 'movie';
                  const res = await fetch(`${TMDB_BASE}/${endpoint}/${item.contentId}?api_key=${TMDB_API_KEY}`);
                  if (res.ok) {
                    const d = await res.json();
                    return { ...item, title: d.title || d.name, poster: d.poster_path ? `${IMG_BASE}${d.poster_path}` : null };
                  }
                }
              } catch { /* skip enrichment errors */ }
              return item;
            })
          );
          setTrending(enriched);
        }
      } catch (err) {
        console.error('Failed to fetch trending discussions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading || trending.length === 0) return null;

  return (
    <section className="mb-14">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-1 h-8 bg-linear-to-b from-orange-400 to-red-500 rounded-full"></span>
        <h2 className="text-2xl font-bold">Trending Discussions</h2>
        <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
          🔥 Hot
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {trending.map((item) => (
          <div
            key={`${item.contentType}-${item.contentId}`}
            onClick={() => navigate(`/discussion/${item.contentType}/${item.contentId}`)}
            className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-cyan-500/30 hover:bg-slate-800/40 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-12 h-18 rounded-lg object-cover border border-slate-700/50 shrink-0 group-hover:border-cyan-500/30 transition-colors"
                />
              ) : (
                <div className="w-12 h-18 rounded-lg bg-slate-800 border border-slate-700/50 shrink-0 flex items-center justify-center text-slate-600 text-xs">
                  N/A
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                  {item.title || `#${item.contentId}`}
                </p>
                <p className="text-xs text-slate-500 capitalize mt-0.5">
                  {TYPE_LABELS[item.contentType] || item.contentType}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-cyan-400 font-medium">{item.commentCount} comments</span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-400">{item.totalUpvotes} upvotes</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingDiscussions;
