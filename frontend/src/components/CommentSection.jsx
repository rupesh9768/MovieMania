import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  getDiscussion,
  createComment,
  replyToComment,
  toggleLike,
  toggleDislike,
  editComment,
  deleteComment,
  searchUsersForMentions,
  searchTmdbPeopleForMentions
} from '../api/discussionService';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w92';

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  // Predefined avatars are served from frontend public/avatars/
  if (avatar.startsWith('/avatars/') || !avatar.startsWith('/')) {
    return avatar.startsWith('/') ? avatar : `/avatars/${encodeURIComponent(avatar)}`;
  }
  return `${BACKEND_URL}${avatar}`;
};

// Time ago helper
const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
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

const SpoilerText = ({ text }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setRevealed((prev) => !prev);
      }}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs border transition-all ${
        revealed
          ? 'bg-slate-700/40 text-slate-200 border-slate-600/60'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
      }`}
      title={revealed ? 'Hide spoiler' : 'Reveal spoiler'}
    >
      <span>{revealed ? 'Hide Spoiler' : 'Show Spoiler'}</span>
      {revealed && <span className="text-slate-300">{text}</span>}
    </button>
  );
};

const applySpoilerWrapper = (text, enabled) => {
  const value = String(text || '').trim();
  if (!value) return value;
  if (!enabled) return value;

  const hasSpoilerSyntax = /\|\|(.+?)\|\||\[spoiler\](.+?)\[\/spoiler\]/is.test(value);
  if (hasSpoilerSyntax) return value;

  return `[spoiler]${value}[/spoiler]`;
};

const sanitizeMentionsForText = (text, mentions) => {
  const lower = String(text || '').toLowerCase();
  return (mentions || []).filter((m) => {
    if (!m?.name || !m?.id || !m?.type) return false;
    return lower.includes(`@${String(m.name).toLowerCase()}`);
  }).filter(
    (m, index, arr) => arr.findIndex((x) => x.type === m.type && x.id === m.id) === index
  );
};

const getMentionContext = (text, caretPosition) => {
  const cursor = typeof caretPosition === 'number' ? caretPosition : text.length;
  const left = text.slice(0, cursor);
  const atIndex = left.lastIndexOf('@');

  if (atIndex === -1) return null;

  const prevChar = atIndex > 0 ? left[atIndex - 1] : ' ';
  if (atIndex > 0 && !/\s|\(|\[|\{/.test(prevChar)) return null;

  const query = left.slice(atIndex + 1);
  if (query.length > 30) return null;
  if (/\s/.test(query)) return null;

  return {
    query,
    start: atIndex,
    end: cursor
  };
};

const MentionSuggestions = ({ suggestions, activeIndex, onSelect }) => {
  if (!suggestions.length) return null;

  return (
    <div className="absolute z-50 left-0 right-0 mt-1 bg-[#0f172a] border border-slate-700/80 rounded-lg shadow-2xl overflow-hidden">
      <div className="max-h-56 overflow-y-auto">
        {suggestions.map((item, index) => {
          const isActive = index === activeIndex;
          const avatarUrl = item.type === 'user'
            ? getAvatarUrl(item.avatar)
            : item.profilePath
              ? `${TMDB_IMG_BASE}${item.profilePath}`
              : null;

          return (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition-colors ${
                isActive ? 'bg-cyan-500/15' : 'hover:bg-slate-800/80'
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700/60 shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">N/A</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{item.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{item.type === 'user' ? 'User' : (item.subtitle || 'Actor')}</p>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                item.type === 'user'
                  ? 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10'
                  : 'text-amber-300 border-amber-500/30 bg-amber-500/10'
              }`}>
                {item.type === 'user' ? 'USER' : 'TMDB'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return String(value._id || value.id || '');
  return String(value);
};

const listIncludesUser = (list, userId) => {
  if (!Array.isArray(list) || !userId) return false;
  const normalizedUserId = normalizeId(userId);
  return list.some((entry) => normalizeId(entry) === normalizedUserId);
};

const useMentionAutocomplete = ({ text, setText, inputRef, enabled, onMentionSelected }) => {
  const [mentionContext, setMentionContext] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!enabled || !mentionContext || mentionContext.query.length < 1) {
      setSuggestions([]);
      setActiveIndex(0);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const [usersRes, peopleRes] = await Promise.allSettled([
          searchUsersForMentions(mentionContext.query),
          searchTmdbPeopleForMentions(mentionContext.query)
        ]);

        if (cancelled) return;

        const userItems = usersRes.status === 'fulfilled'
          ? (usersRes.value.users || []).map((u) => ({
              type: 'user',
              id: String(u.id),
              name: u.name,
              avatar: u.avatar
            }))
          : [];

        const actorItems = peopleRes.status === 'fulfilled'
          ? (peopleRes.value.results || []).slice(0, 6).map((p) => ({
              type: 'actor',
              id: String(p.id),
              name: p.name,
              subtitle: p.known_for_department,
              profilePath: p.profile_path
            }))
          : [];

        const merged = [...userItems, ...actorItems];
        const unique = merged.filter((item, idx, arr) => arr.findIndex((x) => x.type === item.type && x.id === item.id) === idx);
        setSuggestions(unique.slice(0, 8));
        setActiveIndex(0);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, mentionContext]);

  const updateContextFrom = (value, caret) => {
    if (!enabled) {
      setMentionContext(null);
      return;
    }
    const ctx = getMentionContext(value, caret);
    setMentionContext(ctx);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    const caret = e.target.selectionStart;
    setText(value);
    updateContextFrom(value, caret);
  };

  const selectSuggestion = (item) => {
    if (!mentionContext) return;

    const mentionText = `@${item.name}`;
    const nextValue =
      text.slice(0, mentionContext.start) + mentionText + ' ' + text.slice(mentionContext.end);

    const nextCursor = mentionContext.start + mentionText.length + 1;
    setText(nextValue);
    if (onMentionSelected) {
      onMentionSelected({
        type: item.type === 'user' ? 'user' : 'actor',
        id: String(item.id),
        name: item.name
      });
    }
    setMentionContext(null);
    setSuggestions([]);

    setTimeout(() => {
      if (inputRef?.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return true;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      return true;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
      return true;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setSuggestions([]);
      setMentionContext(null);
      return true;
    }

    return false;
  };

  return {
    showSuggestions: suggestions.length > 0,
    suggestions,
    activeIndex,
    handleChange,
    handleKeyDown,
    selectSuggestion,
    updateContextFrom
  };
};

// Single comment component (recursive for replies)
const Comment = ({ comment, user, onReply, onLike, onDislike, onDelete, onEdit, depth = 0, targetCommentId = null }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const [replying, setReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [saving, setSaving] = useState(false);
  const [showReplies, setShowReplies] = useState(targetCommentId ? true : depth < 2);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [replyAsSpoiler, setReplyAsSpoiler] = useState(false);
  const [replyMentions, setReplyMentions] = useState([]);
  const replyInputRef = useRef(null);
  const replyFileRef = useRef(null);
  const mentionReply = useMentionAutocomplete({
    text: replyText,
    setText: setReplyText,
    inputRef: replyInputRef,
    enabled: Boolean(user),
    onMentionSelected: (mention) => {
      setReplyMentions((prev) => {
        if (prev.some((m) => m.type === mention.type && m.id === mention.id)) return prev;
        return [...prev, mention];
      });
    }
  });

  const currentUserId = user?._id || user?.id;
  const isOwner = Boolean(currentUserId) && normalizeId(comment.user?._id || comment.user?.id) === normalizeId(currentUserId);
  const isAdmin = user?.role === 'admin';
  const userLiked = listIncludesUser(comment.likes, currentUserId);
  const userDisliked = listIncludesUser(comment.dislikes, currentUserId);
  const userVote = userLiked ? 'upvote' : userDisliked ? 'downvote' : null;
  const isUpvoted = userVote === 'upvote';
  const isDownvoted = userVote === 'downvote';
  const likeCount = comment.likes?.length || 0;
  const dislikeCount = comment.dislikes?.length || 0;
  const voteCount = likeCount - dislikeCount;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isTargetComment = targetCommentId && String(comment._id) === String(targetCommentId);
  const [likePop, setLikePop] = useState(false);
  const [dislikePop, setDislikePop] = useState(false);
  const [upvotePressed, setUpvotePressed] = useState(false);
  const [downvotePressed, setDownvotePressed] = useState(false);
  const isFirstRenderRef = useRef(true);
  const prevLikeCountRef = useRef(likeCount);
  const prevDislikeCountRef = useRef(dislikeCount);

  // Render mentions and spoiler segments.
  const renderText = (text) => {
    const mentions = Array.isArray(comment.mentions) ? comment.mentions : [];

    const renderMentionsInSegment = (segment, segmentKey) => {
      if (!mentions.length || !segment) return segment;

      const tokens = [];
      let i = 0;
      let buffer = '';

      while (i < segment.length) {
        let matched = null;
        let matchedLabel = '';

        if (segment[i] === '@') {
          mentions.forEach((m) => {
            const label = `@${m.name}`;
            const candidate = segment.slice(i, i + label.length);
            const nextChar = segment[i + label.length] || '';
            const boundaryOk = !nextChar || /[\s.,!?;:)\]\}]/.test(nextChar);

            if (boundaryOk && candidate.toLowerCase() === label.toLowerCase() && label.length > matchedLabel.length) {
              matched = m;
              matchedLabel = label;
            }
          });
        }

        if (matched) {
          if (buffer) {
            tokens.push(buffer);
            buffer = '';
          }

          const to = matched.type === 'user' ? `/profile/${matched.id}` : `/person/${matched.id}`;
          const style = matched.type === 'user'
            ? 'text-cyan-300 bg-cyan-500/15 border-cyan-500/35 hover:bg-cyan-500/25'
            : 'text-amber-300 bg-amber-500/15 border-amber-500/35 hover:bg-amber-500/25';

          tokens.push(
            <Link
              key={`${segmentKey}-mention-${i}-${matched.type}-${matched.id}`}
              to={to}
              className={`inline-flex items-center rounded px-1 border transition-colors ${style}`}
            >
              {matchedLabel}
            </Link>
          );
          i += matchedLabel.length;
        } else {
          buffer += segment[i];
          i += 1;
        }
      }

      if (buffer) tokens.push(buffer);
      return tokens;
    };

    const parts = [];
    const spoilerRegex = /\[spoiler\]([\s\S]*?)\[\/spoiler\]|\|\|(.+?)\|\|/gi;
    let lastIndex = 0;
    let match;

    while ((match = spoilerRegex.exec(text)) !== null) {
      const normal = text.slice(lastIndex, match.index);
      if (normal) {
        parts.push(<span key={`normal-${lastIndex}`}>{renderMentionsInSegment(normal, `segment-${lastIndex}`)}</span>);
      }

      const spoilerBody = match[1] || match[2] || '';
      parts.push(<SpoilerText key={`spoiler-${match.index}`} text={spoilerBody} />);
      lastIndex = spoilerRegex.lastIndex;
    }

    const tail = text.slice(lastIndex);
    if (tail) {
      parts.push(<span key={`tail-${lastIndex}`}>{renderMentionsInSegment(tail, `segment-${lastIndex}`)}</span>);
    }

    return parts.length ? parts : text;
  };

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
      const payloadText = applySpoilerWrapper(replyText, replyAsSpoiler);
      const mentions = sanitizeMentionsForText(payloadText, replyMentions);
      await onReply(comment._id, payloadText, replyImage, mentions);
      setReplyText('');
      setReplyAsSpoiler(false);
      setReplyMentions([]);
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

  const handleUpvoteClick = () => {
    if (!user) return;
    setUpvotePressed(true);
    setTimeout(() => setUpvotePressed(false), 160);
    onLike(comment._id);
  };

  const handleDownvoteClick = () => {
    if (!user) return;
    setDownvotePressed(true);
    setTimeout(() => setDownvotePressed(false), 160);
    onDislike(comment._id);
  };

  const handleShare = async () => {
    try {
      const shareUrl = new URL(window.location.href);
      shareUrl.searchParams.set('comment', comment._id);
      await navigator.clipboard.writeText(shareUrl.toString());
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1400);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  useEffect(() => {
    if (showReplyBox && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyBox]);

  useEffect(() => {
    if (isFirstRenderRef.current) return;
    if (likeCount === prevLikeCountRef.current) return;

    setLikePop(true);
    prevLikeCountRef.current = likeCount;
    const t = setTimeout(() => setLikePop(false), 260);
    return () => clearTimeout(t);
  }, [likeCount]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      prevLikeCountRef.current = likeCount;
      prevDislikeCountRef.current = dislikeCount;
      isFirstRenderRef.current = false;
      return;
    }
    if (dislikeCount === prevDislikeCountRef.current) return;

    setDislikePop(true);
    prevDislikeCountRef.current = dislikeCount;
    const t = setTimeout(() => setDislikePop(false), 260);
    return () => clearTimeout(t);
  }, [dislikeCount, likeCount]);

  // Avatar colors based on username
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
    const idx = (name || '').charCodeAt(0) % colors.length;
    return colors[idx];
  };

  const maxDepthReached = depth >= 4;

  return (
    <div
      data-comment-id={comment._id}
      className={`group ${depth > 0 ? 'ml-4 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-slate-800/60 hover:border-slate-700/80 transition-colors' : ''}`}
    >
      <div className="py-3">
        <div className={`bg-slate-900/45 border rounded-xl p-3.5 transition-all comment-enter-card ${
          isTargetComment
            ? 'border-cyan-400/60 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_12px_30px_rgba(0,0,0,0.35)]'
            : 'border-slate-800/60 hover:border-slate-700/70'
        }`}>
        {/* Comment Header */}
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <Link to={`/profile/${comment.user?._id}`} className="shrink-0">
            {comment.user?.avatar ? (
              <img src={getAvatarUrl(comment.user.avatar)} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700/50 shadow-md" />
            ) : (
              <div className={`w-8 h-8 rounded-full bg-linear-to-br ${getAvatarColor(comment.user?.name)} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                {comment.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            {/* Name & Meta */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${comment.user?._id}`} className="font-semibold text-sm text-white hover:text-cyan-400 transition-colors">
                {comment.user?.name || 'Unknown'}
              </Link>
              {comment.user?.role === 'admin' && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  Admin
                </span>
              )}
              {isOwner && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                  You
                </span>
              )}
              <span className="text-xs text-slate-500">{timeAgo(comment.createdAt)}</span>
              {comment.isEdited && (
                <span className="text-[10px] text-slate-600 italic">(edited)</span>
              )}
            </div>

            {/* Comment Body */}
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleEdit}
                    disabled={saving || !editText.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditText(comment.text); }}
                    className="text-slate-400 hover:text-white text-xs px-3 py-1.5 transition-colors"
                  >
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
              <div className="mt-2 flex items-center gap-2 flex-wrap rounded-xl border border-slate-300/20 bg-slate-200/10 px-2 py-1.5">
                {/* Reddit-style vote rail */}
                <div className={`flex flex-col items-center justify-center rounded-lg border border-slate-300/25 bg-slate-100/10 px-2 py-1.5 ${!user ? 'opacity-70' : ''}`}>
                  <button
                    onClick={handleUpvoteClick}
                    className={`text-sm leading-none transition-all duration-200 ${
                      isUpvoted ? 'text-red-500 scale-110' : 'text-slate-400 hover:text-red-400'
                    } ${upvotePressed ? 'scale-125' : ''} ${
                      !user ? 'cursor-default' : 'cursor-pointer active:scale-95'
                    }`}
                    title={user ? (isUpvoted ? 'Remove upvote' : 'Upvote') : 'Login to vote'}
                    aria-label={user ? (isUpvoted ? 'Remove upvote' : 'Upvote') : 'Login to vote'}
                  >
                    ▲
                  </button>
                  <span className={`text-xs font-semibold transition-all duration-200 ${isUpvoted ? 'text-red-500' : isDownvoted ? 'text-blue-500' : 'text-slate-300'} ${likePop || dislikePop ? 'reaction-count-pop' : ''}`}>
                    {voteCount}
                  </span>
                  <button
                    onClick={handleDownvoteClick}
                    className={`text-sm leading-none transition-all duration-200 ${
                      isDownvoted ? 'text-blue-500 scale-110' : 'text-slate-400 hover:text-blue-400'
                    } ${downvotePressed ? 'scale-125' : ''} ${
                      !user ? 'cursor-default' : 'cursor-pointer active:scale-95'
                    }`}
                    title={user ? (isDownvoted ? 'Remove downvote' : 'Downvote') : 'Login to vote'}
                    aria-label={user ? (isDownvoted ? 'Remove downvote' : 'Downvote') : 'Login to vote'}
                  >
                    ▼
                  </button>
                </div>

                {/* Reply button */}
                {user && !maxDepthReached && (
                  <button
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100/10 transition-all duration-200 active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h11M3 6h18M3 14h7m8 0l3 3m0 0l-3 3m3-3H10" /></svg>
                    Reply
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100/10 transition-all duration-200 active:scale-95"
                  title="Copy link to this comment"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342a3 3 0 010-4.243l2.122-2.122a3 3 0 014.243 4.243l-.707.707M15.316 10.658a3 3 0 010 4.243l-2.122 2.122a3 3 0 11-4.243-4.243l.707-.707" /></svg>
                  {shareCopied ? 'Copied' : 'Share'}
                </button>

                {/* Edit button (owner only) */}
                {isOwner && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/10 transition-all duration-200 active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L12 14l-4 1 1-4 7.5-7.5z" /></svg>
                    Edit
                  </button>
                )}

                {/* Delete button (owner or admin) */}
                {(isOwner || isAdmin) && (
                  <>
                    {confirmDelete ? (
                      <div className="flex items-center gap-1 ml-1 rounded-lg bg-red-500/10 border border-red-500/20 px-1.5 py-1">
                        <span className="text-xs text-red-300">Delete?</span>
                        <button
                          onClick={handleDelete}
                          className="text-xs text-red-200 hover:text-white bg-red-500/20 px-2 py-1 rounded-md font-medium transition-all duration-200 active:scale-95"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded-md transition-all duration-200 active:scale-95"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/10 transition-all duration-200 active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" /></svg>
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
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      ref={replyInputRef}
                      type="text"
                      value={replyText}
                      onChange={mentionReply.handleChange}
                      onKeyDown={(e) => {
                        if (mentionReply.handleKeyDown(e)) return;
                        if (e.key === 'Enter' && !e.shiftKey) handleReply();
                      }}
                      onClick={(e) => mentionReply.updateContextFrom(e.target.value, e.target.selectionStart)}
                      placeholder={`Reply to ${comment.user?.name}... Use @ to mention`}
                      className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40"
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
                    <button
                      onClick={handleReply}
                      disabled={replying || !replyText.trim()}
                      className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
                    >
                      {replying ? '...' : 'Reply'}
                    </button>
                  </div>
                  {mentionReply.showSuggestions && (
                    <MentionSuggestions
                      suggestions={mentionReply.suggestions}
                      activeIndex={mentionReply.activeIndex}
                      onSelect={mentionReply.selectSuggestion}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyAsSpoiler((prev) => !prev)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      replyAsSpoiler
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                        : 'text-slate-500 border-slate-700/60 hover:text-amber-300 hover:border-amber-500/25'
                    }`}
                  >
                    Spoiler Reply
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
      </div>

      {/* Nested Replies */}
      {hasReplies && (
        <>
          {comment.replies.length > 0 && !showReplies && (
            <button
              onClick={() => setShowReplies(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 mb-2 ml-10 flex items-center gap-1 transition-colors"
            >
              <span>+</span> Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {showReplies && (
            <>
              {comment.replies.length > 2 && (
                <button
                  onClick={() => setShowReplies(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 mb-1 ml-10 flex items-center gap-1 transition-colors"
                >
                  <span>-</span> Hide replies
                </button>
              )}
              {comment.replies.map((reply) => (
                <Comment
                  key={reply._id}
                  comment={reply}
                  user={user}
                  onReply={onReply}
                  onLike={onLike}
                  onDislike={onDislike}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  depth={depth + 1}
                  targetCommentId={targetCommentId}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Liked' },
  { value: 'controversial', label: 'Most Discussed' },
];

// Main comment section component
const CommentSection = ({ contentId, contentType, contentTitle, targetCommentId = null }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [newCommentAsSpoiler, setNewCommentAsSpoiler] = useState(false);
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const [newCommentMentions, setNewCommentMentions] = useState([]);
  const [posting, setPosting] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mentionMain = useMentionAutocomplete({
    text: newComment,
    setText: setNewComment,
    inputRef: textareaRef,
    enabled: isAuthenticated,
    onMentionSelected: (mention) => {
      setNewCommentMentions((prev) => {
        if (prev.some((m) => m.type === mention.type && m.id === mention.id)) return prev;
        return [...prev, mention];
      });
    }
  });


  const fetchComments = async () => {
    try {
      setError(null);
      const data = await getDiscussion(contentType, contentId);
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contentId && contentType) {
      setLoading(true);
      fetchComments();
    }
  }, [contentId, contentType]);


  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'popular':
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      case 'controversial':
        return ((b.replies?.length || 0) + (b.likes?.length || 0) + (b.dislikes?.length || 0)) -
               ((a.replies?.length || 0) + (a.likes?.length || 0) + (a.dislikes?.length || 0));
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });


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
      setCommentImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const payloadText = applySpoilerWrapper(newComment, newCommentAsSpoiler);
      const mentions = sanitizeMentionsForText(payloadText, newCommentMentions);
      await createComment({ contentId, contentType, text: payloadText, image: commentImage, mentions });
      setNewComment('');
      setNewCommentAsSpoiler(false);
      setNewCommentMentions([]);
      setCharCount(0);
      removeImage();
      await fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setPosting(false);
    }
  };


  const handleReply = async (parentId, text, image, mentions = []) => {
    await replyToComment(parentId, text, image, mentions);
    await fetchComments();
  };


  const handleLike = async (commentId) => {
    try {
      await toggleLike(commentId);
      await fetchComments();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };


  const handleDislike = async (commentId) => {
    try {
      await toggleDislike(commentId);
      await fetchComments();
    } catch (err) {
      console.error('Failed to toggle dislike:', err);
    }
  };


  const handleEdit = async (commentId, text) => {
    try {
      await editComment(commentId, text);
      await fetchComments();
    } catch (err) {
      console.error('Failed to edit comment:', err);
    }
  };


  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      await fetchComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Auto-resize textarea
  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    setCharCount(newComment.length);
    resizeTextarea();
  }, [newComment]);

  useEffect(() => {
    if (!targetCommentId || loading || comments.length === 0) return;

    const run = () => {
      const selector = `[data-comment-id="${String(targetCommentId).replace(/"/g, '\\\"')}"]`;
      const targetEl = document.querySelector(selector);
      if (!targetEl) return;

      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add('comment-focus-pulse');
      setTimeout(() => targetEl.classList.remove('comment-focus-pulse'), 2200);
    };

    const t = setTimeout(run, 120);
    return () => clearTimeout(t);
  }, [targetCommentId, loading, comments]);

  return (
    <section className="mt-10 mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Comments</h2>
          <span className="bg-slate-800 text-slate-400 text-xs font-medium px-2.5 py-1 rounded-full">
            {totalCount}
          </span>
        </div>

        {/* Sort Dropdown */}
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

      {/* Comment Input */}
      {isAuthenticated ? (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            <div className="flex-1">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={mentionMain.handleChange}
                  placeholder={`Share your thoughts about ${contentTitle || 'this'}... Use @ to tag users or actors`}
                  className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 min-h-12 transition-all"
                  rows={1}
                  maxLength={2000}
                  onClick={(e) => mentionMain.updateContextFrom(e.target.value, e.target.selectionStart)}
                  onKeyDown={(e) => {
                    if (mentionMain.handleKeyDown(e)) return;
                    if (e.key === 'Enter' && e.ctrlKey) handlePost();
                  }}
                />
                {mentionMain.showSuggestions && (
                  <MentionSuggestions
                    suggestions={mentionMain.suggestions}
                    activeIndex={mentionMain.activeIndex}
                    onSelect={mentionMain.selectSuggestion}
                  />
                )}
              </div>

              {/* Image Preview */}
              {commentImagePreview && (
                <div className="mt-2 relative inline-block">
                  <img src={commentImagePreview} alt="Preview" className="max-h-32 rounded-lg border border-slate-700" />
                  <button onClick={removeImage} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-400">×</button>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 text-[11px]"
                    title="Attach image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCommentAsSpoiler((prev) => !prev)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      newCommentAsSpoiler
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                        : 'text-slate-500 border-slate-700/60 hover:text-amber-300 hover:border-amber-500/25'
                    }`}
                    title="Mark the whole comment as spoiler"
                  >
                    Spoiler
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImageChange} />
                  <p className="text-[11px] text-slate-600">
                    Ctrl+Enter to post • Use @ to mention • Use the Spoiler button for easy spoiler comments
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] ${charCount > 1800 ? 'text-amber-400' : 'text-slate-600'}`}>
                    {charCount}/2000
                  </span>
                  <button
                    onClick={handlePost}
                    disabled={posting || !newComment.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-5 py-2 rounded-lg transition-all shadow-md shadow-cyan-900/20"
                  >
                    {posting ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Posting...
                      </span>
                    ) : (
                      'Post Comment'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-6 mb-6 text-center">
          <p className="text-slate-400 text-sm mb-3">Sign in to join the conversation</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all shadow-md"
          >
            Login to Comment
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading comments...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchComments(); }}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Comments List */}
      {!loading && !error && (
        <>
          {sortedComments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-sm text-slate-500 mb-3">No comments</div>
              <p className="text-slate-400 text-sm">No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/40">
              {sortedComments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment}
                  user={user}
                  onReply={handleReply}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  targetCommentId={targetCommentId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default CommentSection;
