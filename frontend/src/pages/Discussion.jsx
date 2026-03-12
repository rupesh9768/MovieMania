import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getDiscussion,
  createComment,
  replyToComment,
  toggleLike,
  toggleDislike,
  editComment,
  deleteComment,
  getTrendingDiscussions
} from '../api/discussionService';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const JIKAN_BASE = 'https://api.jikan.moe/v4';
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const TYPE_LABELS = {
  movie: 'Movie',
  tv: 'TV Show',
  anime: 'Anime',
  theater: 'Theater'
};

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/avatars/') || !avatar.startsWith('/')) {
    return avatar.startsWith('/') ? avatar : `/avatars/${encodeURIComponent(avatar)}`;
  }
  return `${BACKEND_URL}${avatar}`;
};

const timeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const getAvatarColor = (name) => {
  const colors = [
    'from-cyan-500 to-blue-600',
    'from-cyan-400 to-teal-600',
    'from-teal-500 to-cyan-600',
    'from-sky-500 to-cyan-600',
    'from-cyan-500 to-sky-600',
    'from-blue-500 to-cyan-600',
    'from-cyan-600 to-blue-500',
  ];
  return colors[(name || '').charCodeAt(0) % colors.length];
};

// Spoiler text rendering
const renderText = (text) => {
  const parts = text.split(/\|\|(.+?)\|\|/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <SpoilerTag key={i} text={part} />;
    }
    return <span key={i}>{part}</span>;
  });
};

const SpoilerTag = ({ text }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={(e) => { e.stopPropagation(); setRevealed(!revealed); }}
      className={`cursor-pointer rounded px-1 transition-all ${
        revealed ? 'bg-slate-700/50 text-white' : 'bg-slate-600 text-transparent hover:bg-slate-500 select-none'
      }`}
      title={revealed ? 'Click to hide spoiler' : 'Click to reveal spoiler'}
    >
      {text}
    </span>
  );
};

// ========== COMMENT COMPONENT ==========
const CommentItem = ({ comment, user, depth = 0, onReply, onLike, onDislike, onDelete, onEdit }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const [replying, setReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [saving, setSaving] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const replyInputRef = useRef(null);
  const replyFileRef = useRef(null);

  const isOwner = user && comment.user?._id === user._id;
  const isAdmin = user?.role === 'admin';
  const userLiked = user && comment.likes?.includes(user._id);
  const userDisliked = user && comment.dislikes?.includes(user._id);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepthReached = depth >= 3;

  const handleReplyImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReplyImage(file);
      setReplyImagePreview(URL.createObjectURL(file));
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await onReply(comment._id, replyText.trim(), replyImage);
      setReplyText('');
      setReplyImage(null);
      setReplyImagePreview(null);
      setShowReplyBox(false);
    } finally {
      setReplying(false);
    }
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText.trim() === comment.text) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onEdit(comment._id, editText.trim());
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(comment._id);
    setConfirmDelete(false);
  };

  useEffect(() => {
    if (showReplyBox && replyInputRef.current) replyInputRef.current.focus();
  }, [showReplyBox]);

  return (
    <div className={`group ${depth > 0 ? 'ml-4 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-slate-800/60 hover:border-slate-700/80 transition-colors' : ''}`}>
      <div className="py-3">
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <div className="shrink-0">
            {comment.user?.avatar ? (
              <img src={getAvatarUrl(comment.user.avatar)} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700/50 shadow-md" />
            ) : (
              <div className={`w-8 h-8 rounded-full bg-linear-to-br ${getAvatarColor(comment.user?.name)} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                {comment.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name & Meta */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-white">
                {comment.user?.name || 'Unknown'}
              </span>
              {comment.user?.role === 'admin' && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">Admin</span>
              )}
              {isOwner && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">You</span>
              )}
              <span className="text-xs text-slate-500">{timeAgo(comment.createdAt)}</span>
              {comment.isEdited && <span className="text-[10px] text-slate-600 italic">(edited)</span>}
            </div>

            {/* Comment Body */}
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={handleEdit} disabled={saving || !editText.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setIsEditing(false); setEditText(comment.text); }} className="text-slate-400 hover:text-white text-xs px-3 py-1.5 transition-colors">
                    Cancel
                  </button>
                  <span className="text-xs text-slate-600 ml-auto">{editText.length}/2000</span>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {renderText(comment.text)}
                </p>
                {comment.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={comment.imageUrl}
                      alt="Comment attachment"
                      className="max-w-xs max-h-64 rounded-lg border border-slate-700/50 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(comment.imageUrl, '_blank')}
                    />
                  </div>
                )}
              </>
            )}

            {/* Action Bar */}
            {!isEditing && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                <button
                  onClick={() => user ? onLike(comment._id) : null}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all ${
                    userLiked ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-800/60'
                  } ${!user ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                >
                  <svg className="w-3.5 h-3.5" fill={userLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                  <span>{comment.likes?.length || 0}</span>
                </button>

                <button
                  onClick={() => user ? onDislike(comment._id) : null}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all ${
                    userDisliked ? 'text-red-400 bg-red-500/10' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800/60'
                  } ${!user ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                >
                  <svg className="w-3.5 h-3.5" fill={userDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  <span>{comment.dislikes?.length || 0}</span>
                </button>

                {user && !maxDepthReached && (
                  <button onClick={() => setShowReplyBox(!showReplyBox)} className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800/60 transition-all">
                    Reply
                  </button>
                )}

                {isOwner && (
                  <button onClick={() => setIsEditing(true)} className="text-xs text-slate-500 hover:text-cyan-400 px-2 py-1 rounded-md hover:bg-slate-800/60 transition-all">
                    Edit
                  </button>
                )}

                {(isOwner || isAdmin) && (
                  <>
                    {confirmDelete ? (
                      <div className="flex items-center gap-1 ml-1">
                        <span className="text-xs text-red-400">Delete?</span>
                        <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-md font-medium">Yes</button>
                        <button onClick={() => setConfirmDelete(false)} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(true)} className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded-md hover:bg-slate-800/60 transition-all">
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Reply Input */}
            {showReplyBox && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                    placeholder={`Reply to ${comment.user?.name}...`}
                    className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                    maxLength={2000}
                  />
                  <button
                    onClick={() => replyFileRef.current?.click()}
                    className="text-slate-500 hover:text-cyan-400 px-2 transition-colors"
                    title="Attach image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </button>
                  <input ref={replyFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleReplyImageChange} />
                  <button onClick={handleReply} disabled={replying || !replyText.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shrink-0">
                    {replying ? '...' : 'Reply'}
                  </button>
                </div>
                {replyImagePreview && (
                  <div className="relative inline-block">
                    <img src={replyImagePreview} alt="Preview" className="max-h-24 rounded-lg border border-slate-700" />
                    <button onClick={() => { setReplyImage(null); setReplyImagePreview(null); }} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-400">×</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && (
        <>
          {!showReplies && (
            <button onClick={() => setShowReplies(true)} className="text-xs text-cyan-400 hover:text-cyan-300 mb-2 ml-10 flex items-center gap-1 transition-colors">
              + Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {showReplies && (
            <>
              {comment.replies.length > 2 && (
                <button onClick={() => setShowReplies(false)} className="text-xs text-slate-500 hover:text-slate-300 mb-1 ml-10 flex items-center gap-1 transition-colors">
                  − Hide replies
                </button>
              )}
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  user={user}
                  onReply={onReply}
                  onLike={onLike}
                  onDislike={onDislike}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  depth={depth + 1}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

// ========== TRENDING SIDEBAR WIDGET ==========
const TrendingSidebar = ({ trending, currentType, currentId }) => {
  if (!trending || trending.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5">
      <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
        <span className="text-orange-400">🔥</span> Trending Discussions
      </h3>
      <div className="space-y-3">
        {trending.map((item, i) => (
          <Link
            key={`${item.contentType}-${item.contentId}`}
            to={`/discussion/${item.contentType}/${item.contentId}`}
            className={`block p-3 rounded-lg transition-all ${
              item.contentType === currentType && item.contentId === currentId
                ? 'bg-cyan-500/10 border border-cyan-500/30'
                : 'hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.poster && (
                <img src={item.poster} alt="" className="w-10 h-14 rounded object-cover border border-slate-700/50 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{item.title || `${item.contentType} #${item.contentId}`}</p>
                <p className="text-xs text-slate-500 capitalize">{item.contentType}</p>
                <p className="text-xs text-cyan-400 mt-0.5">{item.commentCount} comments • {item.totalUpvotes} upvotes</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// ========== SORT OPTIONS ==========
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Liked' },
  { value: 'controversial', label: 'Most Discussed' },
];

// ========== MAIN DISCUSSION PAGE ==========
const Discussion = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  // Content metadata
  const [contentTitle, setContentTitle] = useState('');
  const [contentPoster, setContentPoster] = useState('');
  const [contentYear, setContentYear] = useState('');
  const [contentImages, setContentImages] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  // Trending
  const [trending, setTrending] = useState([]);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch content metadata (title + poster) and images from TMDB/Jikan
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
          // Fetch anime pictures
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
          // Fetch images (backdrops + posters)
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

  // Fetch trending discussions with metadata
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrendingDiscussions();
        if (data.success && data.trending?.length > 0) {
          // Enrich trending items with title/poster from TMDB/Jikan
          const enriched = await Promise.all(
            data.trending.slice(0, 6).map(async (item) => {
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
              } catch { /* skip metadata enrichment errors */ }
              return item;
            })
          );
          setTrending(enriched);
        }
      } catch (err) {
        console.error('Failed to fetch trending:', err);
      }
    };
    fetchTrending();
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      setError(null);
      const data = await getDiscussion(type, id);
      if (data.success) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Failed to fetch discussion:', err);
      setError('Failed to load discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'popular': return (b.likes?.length || 0) - (a.likes?.length || 0);
      case 'controversial': return ((b.replies?.length || 0) + (b.likes?.length || 0) + (b.dislikes?.length || 0)) - ((a.replies?.length || 0) + (a.likes?.length || 0) + (a.dislikes?.length || 0));
      default: return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Count total including nested
  const countAll = (list) => {
    let total = 0;
    for (const c of list) {
      total += 1;
      if (c.replies) total += countAll(c.replies);
    }
    return total;
  };
  const totalCount = countAll(comments);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCommentImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setCommentImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createComment({
        contentId: id,
        contentType: type,
        text: newComment.trim(),
        image: commentImage
      });
      setNewComment('');
      removeImage();
      await fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId, text, image) => {
    await replyToComment(parentId, text, image);
    await fetchComments();
  };

  const handleLike = async (commentId) => {
    try { await toggleLike(commentId); await fetchComments(); } catch (err) { console.error('Like failed:', err); }
  };

  const handleDislike = async (commentId) => {
    try { await toggleDislike(commentId); await fetchComments(); } catch (err) { console.error('Dislike failed:', err); }
  };

  const handleEdit = async (commentId, text) => {
    try { await editComment(commentId, text); await fetchComments(); } catch (err) { console.error('Edit failed:', err); }
  };

  const handleDelete = async (commentId) => {
    try { await deleteComment(commentId); await fetchComments(); } catch (err) { console.error('Delete failed:', err); alert(err.response?.data?.message || 'Failed to delete comment'); }
  };

  const handleTextChange = (e) => {
    setNewComment(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Loading discussion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">

      {/* Header Bar */}
      <div className="sticky top-16 z-40 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-slate-800/30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              const detailPath = type === 'anime' ? `/details/anime/${id}` : type === 'theater' ? `/theater/${id}` : `/${type}/${id}`;
              navigate(detailPath);
            }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            Back to {TYPE_LABELS[type] || 'Details'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full border bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {TYPE_LABELS[type] || type}
            </span>
          </div>
        </div>
      </div>

      {/* Content Header - Poster + Title + Photos */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row items-start gap-6 mb-8">
          {/* Left: Poster + Info */}
          <div className="flex items-start gap-5 flex-1 min-w-0">
            {contentPoster && (
              <img
                src={contentPoster}
                alt={contentTitle}
                className="w-24 sm:w-32 rounded-xl shadow-2xl border border-slate-700/30 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-black mb-1">{contentTitle || 'Discussion'}</h1>
              {contentYear && <p className="text-slate-500 text-sm mb-3">{contentYear}</p>}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-slate-400">{totalCount} {totalCount === 1 ? 'comment' : 'comments'}</span>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-sm text-slate-400 capitalize">{TYPE_LABELS[type] || type} Discussion</span>
              </div>
              <p className="text-slate-500 text-sm mt-2">
                Share your thoughts, theories, and reviews. Be respectful. Use ||text|| for spoilers.
              </p>
            </div>
          </div>

          {/* Right: Photos */}
          {contentImages.length > 0 && (
            <div className="w-full lg:w-auto lg:max-w-sm xl:max-w-md shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-300">Photos</h3>
                {contentImages.length > 4 && (
                  <button
                    onClick={() => setShowAllImages(!showAllImages)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {showAllImages ? 'Show less' : `All ${contentImages.length}`}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {contentImages.slice(0, showAllImages ? contentImages.length : 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setLightboxIndex(i); setLightboxImage(img.full); }}
                    className="aspect-video rounded-lg overflow-hidden border border-slate-700/40 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  >
                    <img src={img.thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Two-column Layout: Main + Sidebar */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">

          {/* Main Content */}
          <div>
            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={fetchComments} className="text-red-300 hover:text-white text-xs mt-2 underline cursor-pointer">Try again</button>
              </div>
            )}

            {/* New Comment Box */}
            {user ? (
              <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {user.avatar ? (
                    <img src={getAvatarUrl(user.avatar)} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700/50" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-linear-to-br ${getAvatarColor(user.name)} flex items-center justify-center text-white text-sm font-bold`}>
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-300">
                    Commenting as <span className="text-cyan-400">{user.name}</span>
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={handleTextChange}
                  placeholder="What are your thoughts?"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none min-h-15"
                  disabled={submitting}
                  maxLength={2000}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleCreateComment(); }}
                />

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border border-slate-700" />
                    <button onClick={removeImage} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-400">×</button>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 text-xs"
                      title="Attach image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Image
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImageChange} />
                    <span className="text-[11px] text-slate-600">Ctrl+Enter to post • Use ||text|| for spoilers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${newComment.length > 1800 ? 'text-amber-400' : 'text-slate-500'}`}>{newComment.length}/2000</span>
                    <button
                      onClick={handleCreateComment}
                      disabled={submitting || !newComment.trim() || newComment.length > 2000}
                      className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-6 mb-6 text-center">
                <p className="text-slate-400 text-sm mb-3">You must be logged in to join the discussion.</p>
                <button onClick={() => navigate('/login')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors cursor-pointer">
                  Login to Comment
                </button>
              </div>
            )}

            {/* Sort & Count Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-200">
                {totalCount} {totalCount === 1 ? 'Comment' : 'Comments'}
              </h2>
              {comments.length > 1 && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800/80 border border-slate-700/50 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 cursor-pointer"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Comments List */}
            {sortedComments.length > 0 ? (
              <div className="divide-y divide-slate-800/40">
                {sortedComments.map(comment => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    user={user}
                    depth={0}
                    onReply={handleReply}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-lg font-bold text-slate-400 mb-2">No comments yet</h3>
                <p className="text-slate-500 text-sm">Be the first to start the conversation!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TrendingSidebar trending={trending} currentType={type} currentId={id} />
          </div>
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

// Lightbox overlay with navigation arrows
const ImageLightbox = ({ src, onClose, images, currentIndex, onNavigate }) => {
  if (!src) return null;
  const hasMultiple = images && images.length > 1;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (hasMultiple && e.key === 'ArrowRight') onNavigate(1);
    if (hasMultiple && e.key === 'ArrowLeft') onNavigate(-1);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={(el) => el?.focus()}
    >
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl cursor-pointer z-10 backdrop-blur-sm transition-colors">✕</button>

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-4 text-sm text-white/60 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {hasMultiple && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl cursor-pointer z-10 backdrop-blur-sm transition-colors"
        >
          ‹
        </button>
      )}

      {/* Image */}
      <img
        src={src}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {hasMultiple && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl cursor-pointer z-10 backdrop-blur-sm transition-colors"
        >
          ›
        </button>
      )}
    </div>
  );
};

export default Discussion;
