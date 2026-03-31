import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDiscussion } from '../api/discussionService';
import CommentSection from '../components/CommentSection';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const JIKAN_BASE = 'https://api.jikan.moe/v4';

const TYPE_LABELS = {
  movie: 'Movie',
  tv: 'TV Show',
  anime: 'Anime',
  theater: 'Theater'
};

const TYPE_COLORS = {
  movie: 'bg-red-500/20 text-red-400 border-red-500/30',
  tv: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  anime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  theater: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const Discussion = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const targetCommentId = new URLSearchParams(location.search).get('commentId') || null;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Content metadata
  const [contentTitle, setContentTitle] = useState('');
  const [contentPoster, setContentPoster] = useState('');
  const [contentYear, setContentYear] = useState('');
  const [contentImages, setContentImages] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  // Fetch content metadata from TMDB/Jikan
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        if (type === 'anime') {
          const res = await fetch(`${JIKAN_BASE}/anime/${id}`);
          if (res.ok) {
            const data = await res.json();
            setContentTitle(data.data?.title || data.data?.title_english || 'Anime');
            setContentPoster(data.data?.images?.jpg?.large_image_url || '');
            const year = data.data?.aired?.from?.split('-')[0];
            setContentYear(year || '');
          }
          try {
            const picRes = await fetch(`${JIKAN_BASE}/anime/${id}/pictures`);
            if (picRes.ok) {
              const picData = await picRes.json();
              const pics = (picData.data || []).slice(0, 12).map(p => ({
                thumb: p.jpg?.small_image_url || p.jpg?.image_url,
                full: p.jpg?.large_image_url || p.jpg?.image_url
              })).filter(p => p.thumb);
              setContentImages(pics);
            }
          } catch (_) {}
        } else if (type === 'movie' || type === 'tv') {
          const endpoint = type === 'tv' ? 'tv' : 'movie';
          const res = await fetch(`${TMDB_BASE}/${endpoint}/${id}?api_key=${TMDB_API_KEY}`);
          if (res.ok) {
            const data = await res.json();
            setContentTitle(data.title || data.name || '');
            setContentPoster(data.poster_path ? `${IMG_BASE}${data.poster_path}` : '');
            setContentYear((data.release_date || data.first_air_date || '').split('-')[0]);
          }
          try {
            const imgRes = await fetch(`${TMDB_BASE}/${endpoint}/${id}/images?api_key=${TMDB_API_KEY}`);
            if (imgRes.ok) {
              const imgData = await imgRes.json();
              const backdrops = (imgData.backdrops || []).slice(0, 8).map(b => ({
                thumb: `${IMG_BASE}${b.file_path}`,
                full: `${IMG_ORIGINAL}${b.file_path}`
              }));
              const posters = (imgData.posters || []).slice(0, 4).map(p => ({
                thumb: `${IMG_BASE}${p.file_path}`,
                full: `${IMG_ORIGINAL}${p.file_path}`
              }));
              setContentImages([...backdrops, ...posters]);
            }
          } catch (_) {}
        }
      } catch (err) {
        console.error('Failed to fetch content meta:', err);
      }
    };
    fetchMeta();
  }, [type, id]);

  const fetchComments = useCallback(async () => {
    try {
      setError(null);
      const data = await getDiscussion(type, id);
      if (data.success) setComments(data.comments);
    } catch (err) {
      console.error('Failed to fetch discussion:', err);
      setError('Failed to load discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const countAll = (list) => {
    let total = 0;
    for (const c of list) {
      total += 1;
      if (c.replies) total += countAll(c.replies);
    }
    return total;
  };
  const totalCount = countAll(comments);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-red-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm">Loading discussion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Sticky Header Bar */}
      <div className="sticky top-16 z-40 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-slate-800/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              const detailPath = type === 'anime' ? `/details/anime/${id}` : type === 'theater' ? `/theater/${id}` : `/${type}/${id}`;
              navigate(detailPath);
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to {TYPE_LABELS[type] || 'Details'}
          </button>
          <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg border ${TYPE_COLORS[type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
            {TYPE_LABELS[type] || type}
          </span>
        </div>
      </div>

      {/* Content Header */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start gap-6 mb-8">
          {/* Left: Poster + Info */}
          <div className="flex items-start gap-5 flex-1 min-w-0">
            {contentPoster && (
              <img src={contentPoster} alt={contentTitle}
                className="w-24 sm:w-32 rounded-xl shadow-2xl border border-slate-700/30 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-black mb-1.5">{contentTitle || 'Discussion'}</h1>
              {contentYear && <p className="text-slate-500 text-sm mb-3">{contentYear}</p>}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="text-sm text-slate-400">{totalCount} {totalCount === 1 ? 'comment' : 'comments'}</span>
                </div>
                <span className="text-xs text-slate-700">|</span>
                <span className="text-sm text-slate-400 capitalize">{TYPE_LABELS[type] || type} Discussion</span>
              </div>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Share your thoughts, theories, and reviews. Be respectful. Use the spoiler toggle for hidden spoilers.
              </p>
            </div>
          </div>

          {/* Right: Photos */}
          {contentImages.length > 0 && (
            <div className="w-full lg:w-auto lg:max-w-sm xl:max-w-md shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Photos
                </h3>
                {contentImages.length > 4 && (
                  <button onClick={() => setShowAllImages(!showAllImages)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                    {showAllImages ? 'Show less' : `All ${contentImages.length}`}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {contentImages.slice(0, showAllImages ? contentImages.length : 4).map((img, i) => (
                  <button key={i} onClick={() => { setLightboxIndex(i); setLightboxImage(img.full); }}
                    className="aspect-video rounded-lg overflow-hidden border border-slate-700/40 hover:border-red-500/40 transition-all cursor-pointer group">
                    <img src={img.thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={fetchComments} className="text-red-300 hover:text-white text-xs mt-2 underline cursor-pointer">Try again</button>
            </div>
          )}

          <CommentSection
            contentId={String(id)}
            contentType={type}
            contentTitle={contentTitle || 'this'}
            targetCommentId={targetCommentId}
          />
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        src={lightboxImage}
        onClose={() => setLightboxImage(null)}
        images={contentImages}
        currentIndex={lightboxIndex}
        onNavigate={(dir) => {
          const newIdx = (lightboxIndex + dir + contentImages.length) % contentImages.length;
          setLightboxIndex(newIdx);
          setLightboxImage(contentImages[newIdx].full);
        }}
      />
    </div>
  );
};

// Lightbox overlay with navigation
const ImageLightbox = ({ src, onClose, images, currentIndex, onNavigate }) => {
  if (!src) return null;
  const hasMultiple = images && images.length > 1;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (hasMultiple && e.key === 'ArrowRight') onNavigate(1);
    if (hasMultiple && e.key === 'ArrowLeft') onNavigate(-1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose} onKeyDown={handleKeyDown} tabIndex={0} ref={(el) => el?.focus()}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white cursor-pointer z-10 backdrop-blur-sm transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {hasMultiple && (
        <div className="absolute top-4 left-4 text-sm text-white/60 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {hasMultiple && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white cursor-pointer z-10 backdrop-blur-sm transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}

      <img src={src} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />

      {hasMultiple && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white cursor-pointer z-10 backdrop-blur-sm transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
    </div>
  );
};

export default Discussion;
