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
    <section className="mt-8 mb-14">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-[1.85rem] font-bold tracking-tight">Trending Discussions</h2>
          <span className="text-xs font-semibold text-[#b3b3b3] bg-[#181818] px-3 py-1 rounded-full border border-[#2a2a2a]">
            Hot
          </span>
        </div>
        <div className="h-px bg-[#2a2a2a]"></div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {trending.map((item) => (
          <div
            key={`${item.contentType}-${item.contentId}`}
            onClick={() => navigate(`/discussion/${item.contentType}/${item.contentId}`)}
            className="bg-card-bg border border-[#2a2a2a] rounded-[14px] p-5 hover:bg-[#242424] hover:border-[#3a3a3a] transition-all duration-150 cursor-pointer group hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start gap-3">
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-14 h-20 rounded-lg object-cover border border-[#2a2a2a] shrink-0 transition-colors"
                />
              ) : (
                <div className="w-14 h-20 rounded-lg bg-[#181818] border border-[#2a2a2a] shrink-0 flex items-center justify-center text-[#8a8a8a] text-xs">
                  N/A
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate transition-colors">
                  {item.title || `#${item.contentId}`}
                </p>
                <p className="text-xs text-[#b3b3b3] capitalize mt-0.5">
                  {TYPE_LABELS[item.contentType] || item.contentType}
                </p>
                <div className="mt-3 pt-2 border-t border-[#2a2a2a]">
                  <p className="text-xs text-[#b3b3b3]">
                    {item.commentCount} comments <span className="text-[#6d6d6d]">•</span> {item.totalUpvotes} upvotes
                  </p>
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
