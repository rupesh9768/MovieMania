import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getDiscussion,
  createComment,
  replyToComment,
  toggleLike,
  toggleDislike,
  deleteComment
} from '../api/discussionService';

// ============================================
// Content type display helpers
// ============================================
const TYPE_LABELS = {
  movie: '🎬 Movie',
  tv: '📺 TV Show',
  anime: '🎌 Anime',
  theater: '🎭 Theater'
};

const TYPE_COLORS = {
  movie: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  tv: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  anime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  theater: 'bg-red-500/20 text-red-400 border-red-500/30'
};

// ============================================
// Single Comment Component (recursive for replies)
// ============================================
const Comment = ({ comment, user, depth = 0, onReply, onLike, onDislike, onDelete }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user && comment.user?._id === user._id;
  const isAdmin = user && user.role === 'admin';
  const canDelete = isOwner || isAdmin;

  const userLiked = user && comment.likes?.includes(user._id);
  const userDisliked = user && comment.dislikes?.includes(user._id);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment._id, replyText.trim());
      setReplyText('');
      setShowReplyBox(false);
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  // Limit visual nesting depth for readability
  const indentLevel = Math.min(depth, 4);

  return (
    <div
      className={`${indentLevel > 0 ? 'border-l-2 border-slate-700/50 pl-4 ml-2' : ''}`}
    >
      <div className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-4 mb-3 hover:border-slate-700/70 transition-colors">
        {/* Comment Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 uppercase">
            {comment.user?.name?.[0] || '?'}
          </div>
          <span className="font-semibold text-sm text-slate-200">
            {comment.user?.name || 'Unknown User'}
          </span>
          {comment.user?.role === 'admin' && (
            <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full">
              ADMIN
            </span>
          )}
          <span className="text-xs text-slate-500">
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Comment Text */}
        <p className="text-slate-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
          {comment.text}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Like */}
          <button
            onClick={() => user ? onLike(comment._id) : null}
            disabled={!user}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              userLiked
                ? 'text-green-400'
                : 'text-slate-500 hover:text-green-400'
            } ${!user ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            title={user ? 'Like' : 'Login to like'}
          >
            <svg className="w-4 h-4" fill={userLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
            <span>{comment.likes?.length || 0}</span>
          </button>

          {/* Dislike */}
          <button
            onClick={() => user ? onDislike(comment._id) : null}
            disabled={!user}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              userDisliked
                ? 'text-red-400'
                : 'text-slate-500 hover:text-red-400'
            } ${!user ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            title={user ? 'Dislike' : 'Login to dislike'}
          >
            <svg className="w-4 h-4" fill={userDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span>{comment.dislikes?.length || 0}</span>
          </button>

          {/* Reply */}
          {user && (
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="text-xs font-medium text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              💬 Reply
            </button>
          )}

          {/* Delete */}
          {canDelete && (
            <button
              onClick={() => {
                if (window.confirm('Delete this comment? This will also remove all replies.')) {
                  onDelete(comment._id);
                }
              }}
              className="text-xs font-medium text-slate-500 hover:text-red-400 transition-colors cursor-pointer ml-auto"
            >
              🗑 Delete
            </button>
          )}
        </div>

        {/* Reply Input Box */}
        {showReplyBox && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !submitting && handleReplySubmit()}
              placeholder="Write a reply..."
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              disabled={submitting}
              autoFocus
            />
            <button
              onClick={handleReplySubmit}
              disabled={submitting || !replyText.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? '...' : 'Reply'}
            </button>
            <button
              onClick={() => { setShowReplyBox(false); setReplyText(''); }}
              className="text-slate-500 hover:text-white text-sm px-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-1">
          {comment.replies.map(reply => (
            <Comment
              key={reply._id}
              comment={reply}
              user={user}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
              onDislike={onDislike}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Discussion Page
// Reddit-style threaded comments for content
//
// TODO: Add pagination (load more button)
// TODO: Add comment sorting (newest, oldest, top)
// TODO: Add reporting UI for comments
// TODO: Add moderation tools panel for admins
// ============================================
const Discussion = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // Fetch comments
  // ============================================
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

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ============================================
  // Create top-level comment
  // ============================================
  const handleCreateComment = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await createComment({
        contentId: id,
        contentType: type,
        text: newComment.trim()
      });
      setNewComment('');
      await fetchComments(); // Refresh
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
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
      console.error('Like failed:', err);
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
      console.error('Dislike failed:', err);
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
      console.error('Delete failed:', err);
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  // ============================================
  // Loading state
  // ============================================
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
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
          >
            <span>←</span>
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${TYPE_COLORS[type] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
              {TYPE_LABELS[type] || type}
            </span>
            <span className="text-slate-500 text-xs">ID: {id}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black mb-2">
            💬 Discussion
          </h1>
          <p className="text-slate-400 text-sm">
            Share your thoughts, theories, and reviews. Be respectful to others.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchComments}
              className="text-red-300 hover:text-white text-xs mt-2 underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* New Comment Box */}
        {user ? (
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-sm font-bold uppercase">
                {user.name?.[0] || '?'}
              </div>
              <span className="text-sm font-medium text-slate-300">
                Commenting as <span className="text-cyan-400">{user.name}</span>
              </span>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What are your thoughts?"
              rows={3}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              disabled={submitting}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-slate-500">
                {newComment.length}/2000
              </span>
              <button
                onClick={handleCreateComment}
                disabled={submitting || !newComment.trim() || newComment.length > 2000}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-6 mb-8 text-center">
            <p className="text-slate-400 text-sm mb-3">
              You must be logged in to join the discussion.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Login to Comment
            </button>
          </div>
        )}

        {/* Comments Count */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-200">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h2>
          {/* TODO: Add sorting dropdown (newest, oldest, top) */}
        </div>

        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-1">
            {comments.map(comment => (
              <Comment
                key={comment._id}
                comment={comment}
                user={user}
                depth={0}
                onReply={handleReply}
                onLike={handleLike}
                onDislike={handleDislike}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🦗</div>
            <h3 className="text-lg font-bold text-slate-400 mb-2">
              No comments yet
            </h3>
            <p className="text-slate-500 text-sm">
              Be the first to start the conversation!
            </p>
          </div>
        )}

        {/* TODO: Add "Load More" pagination button */}
      </div>
    </div>
  );
};

export default Discussion;
