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
  deleteComment
} from '../api/discussionService';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `${BACKEND_URL}${avatar}`;
};

// ============================================
// Time ago helper
// ============================================
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

// ============================================
// Single Comment Component (recursive for replies)
// ============================================
const Comment = ({ comment, user, onReply, onLike, onDislike, onDelete, onEdit, depth = 0 }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [saving, setSaving] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const replyInputRef = useRef(null);

  const isOwner = user && comment.user?._id === user._id;
  const isAdmin = user?.role === 'admin';
  const userLiked = user && comment.likes?.includes(user._id);
  const userDisliked = user && comment.dislikes?.includes(user._id);
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Check if the comment contains spoiler tags
  const renderText = (text) => {
    // Support ||spoiler|| syntax
    const parts = text.split(/\|\|(.+?)\|\|/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        // This is a spoiler
        return (
          <span
            key={i}
            onClick={(e) => { e.stopPropagation(); setShowSpoiler(!showSpoiler); }}
            className={`cursor-pointer rounded px-1 transition-all ${
              showSpoiler
                ? 'bg-slate-700/50 text-white'
                : 'bg-slate-600 text-transparent hover:bg-slate-500 select-none'
            }`}
            title={showSpoiler ? 'Click to hide spoiler' : 'Click to reveal spoiler'}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await onReply(comment._id, replyText.trim());
      setReplyText('');
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
    if (showReplyBox && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyBox]);

  // Avatar colors based on username
  const getAvatarColor = (name) => {
    const colors = [
      'from-cyan-500 to-blue-600',
      'from-purple-500 to-pink-600',
      'from-emerald-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-yellow-500 to-amber-600',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-violet-600',
    ];
    const idx = (name || '').charCodeAt(0) % colors.length;
    return colors[idx];
  };

  const maxDepthReached = depth >= 4;

  return (
    <div className={`group ${depth > 0 ? 'ml-4 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-slate-800/60 hover:border-slate-700/80 transition-colors' : ''}`}>
      <div className="py-3">
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
              <p className="text-sm text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap wrap-break-word">
                {renderText(comment.text)}
              </p>
            )}

            {/* Action Bar */}
            {!isEditing && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {/* Like */}
                <button
                  onClick={() => user ? onLike(comment._id) : null}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all ${
                    userLiked
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-800/60'
                  } ${!user ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                  title={user ? (userLiked ? 'Remove like' : 'Like') : 'Login to like'}
                >
                  <span>{userLiked ? '▲' : '△'}</span>
                  <span>{comment.likes?.length || 0}</span>
                </button>

                {/* Dislike */}
                <button
                  onClick={() => user ? onDislike(comment._id) : null}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all ${
                    userDisliked
                      ? 'text-red-400 bg-red-500/10'
                      : 'text-slate-500 hover:text-red-400 hover:bg-slate-800/60'
                  } ${!user ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
                  title={user ? (userDisliked ? 'Remove dislike' : 'Dislike') : 'Login to dislike'}
                >
                  <span>{userDisliked ? '▼' : '▽'}</span>
                  <span>{comment.dislikes?.length || 0}</span>
                </button>

                {/* Reply button */}
                {user && !maxDepthReached && (
                  <button
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800/60 transition-all"
                  >
                    💬 Reply
                  </button>
                )}

                {/* Edit button (owner only) */}
                {isOwner && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-slate-500 hover:text-amber-400 px-2 py-1 rounded-md hover:bg-slate-800/60 transition-all"
                  >
                    ✏️ Edit
                  </button>
                )}

                {/* Delete button (owner or admin) */}
                {(isOwner || isAdmin) && (
                  <>
                    {confirmDelete ? (
                      <div className="flex items-center gap-1 ml-1">
                        <span className="text-xs text-red-400">Delete?</span>
                        <button
                          onClick={handleDelete}
                          className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-md font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded-md hover:bg-slate-800/60 transition-all"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Reply Input */}
            {showReplyBox && (
              <div className="mt-3 flex gap-2">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                  placeholder={`Reply to ${comment.user?.name}...`}
                  className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40"
                  maxLength={2000}
                />
                <button
                  onClick={handleReply}
                  disabled={replying || !replyText.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
                >
                  {replying ? '...' : 'Reply'}
                </button>
              </div>
            )}
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
              <span>▶</span> Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {showReplies && (
            <>
              {comment.replies.length > 2 && (
                <button
                  onClick={() => setShowReplies(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 mb-1 ml-10 flex items-center gap-1 transition-colors"
                >
                  <span>▼</span> Hide replies
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
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

// ============================================
// Sort Options
// ============================================
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Liked' },
  { value: 'controversial', label: 'Most Discussed' },
];

// ============================================
// Main CommentSection Component
// ============================================
const CommentSection = ({ contentId, contentType, contentTitle }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);

  // ============================================
  // Fetch comments
  // ============================================
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

  // ============================================
  // Sort comments
  // ============================================
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

  // ============================================
  // Count total comments including replies
  // ============================================
  const countAll = (list) => {
    let total = 0;
    for (const c of list) {
      total += 1;
      if (c.replies) total += countAll(c.replies);
    }
    return total;
  };
  const totalCount = countAll(comments);

  // ============================================
  // Post a new comment
  // ============================================
  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await createComment({ contentId, contentType, text: newComment.trim() });
      setNewComment('');
      setCharCount(0);
      await fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setPosting(false);
    }
  };

  // ============================================
  // Reply handler
  // ============================================
  const handleReply = async (parentId, text) => {
    await replyToComment(parentId, text);
    await fetchComments();
  };

  // ============================================
  // Like handler
  // ============================================
  const handleLike = async (commentId) => {
    try {
      await toggleLike(commentId);
      await fetchComments();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  // ============================================
  // Dislike handler
  // ============================================
  const handleDislike = async (commentId) => {
    try {
      await toggleDislike(commentId);
      await fetchComments();
    } catch (err) {
      console.error('Failed to toggle dislike:', err);
    }
  };

  // ============================================
  // Edit handler
  // ============================================
  const handleEdit = async (commentId, text) => {
    try {
      await editComment(commentId, text);
      await fetchComments();
    } catch (err) {
      console.error('Failed to edit comment:', err);
    }
  };

  // ============================================
  // Delete handler
  // ============================================
  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      await fetchComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Auto-resize textarea
  const handleTextChange = (e) => {
    const val = e.target.value;
    setNewComment(val);
    setCharCount(val.length);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // ============================================
  // Render
  // ============================================
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
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleTextChange}
                placeholder={`Share your thoughts about ${contentTitle || 'this'}... (Wrap text in || for spoilers)`}
                className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500/40 min-h-12 transition-all"
                rows={1}
                maxLength={2000}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handlePost();
                }}
              />

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] text-slate-600">
                    Ctrl+Enter to post • Use ||text|| for spoilers
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
              <div className="text-4xl mb-3">💬</div>
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
