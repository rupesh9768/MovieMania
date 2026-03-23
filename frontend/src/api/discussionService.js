// Discussion API Service
// Handles all discussion/comment endpoints
import api from './axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Fetch discussion thread for a content item
export const getDiscussion = async (contentType, contentId) => {
  const response = await api.get(`/discussion/${contentType}/${contentId}`);
  return response.data;
};

// Create a new top-level comment (with optional image)
export const createComment = async ({ contentId, contentType, text, image, mentions = [] }) => {
  if (image) {
    const formData = new FormData();
    formData.append('contentId', contentId);
    formData.append('contentType', contentType);
    formData.append('text', text);
    formData.append('mentions', JSON.stringify(mentions));
    formData.append('image', image);
    const response = await api.post('/discussion', formData);
    return response.data;
  }
  const response = await api.post('/discussion', { contentId, contentType, text, mentions });
  return response.data;
};

// Reply to an existing comment (with optional image)
export const replyToComment = async (commentId, text, image, mentions = []) => {
  if (image) {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('mentions', JSON.stringify(mentions));
    formData.append('image', image);
    const response = await api.post(`/discussion/${commentId}/reply`, formData);
    return response.data;
  }
  const response = await api.post(`/discussion/${commentId}/reply`, { text, mentions });
  return response.data;
};

// Toggle like on a comment
export const toggleLike = async (commentId) => {
  const response = await api.put(`/discussion/${commentId}/like`);
  return response.data;
};

// Toggle dislike on a comment
export const toggleDislike = async (commentId) => {
  const response = await api.put(`/discussion/${commentId}/dislike`);
  return response.data;
};

// Edit a comment (owner only, with optional image)
export const editComment = async (commentId, text, image, mentions = []) => {
  if (image) {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('mentions', JSON.stringify(mentions));
    formData.append('image', image);
    const response = await api.put(`/discussion/${commentId}/edit`, formData);
    return response.data;
  }
  const response = await api.put(`/discussion/${commentId}/edit`, { text, mentions });
  return response.data;
};

// Delete a comment (owner or admin)
export const deleteComment = async (commentId) => {
  const response = await api.delete(`/discussion/${commentId}`);
  return response.data;
};

// Fetch trending discussions
export const getTrendingDiscussions = async () => {
  const response = await api.get('/discussion/trending');
  return response.data;
};

// Search users for @mention suggestions
export const searchUsersForMentions = async (query) => {
  const response = await api.get('/users/search', {
    params: { query: String(query || '').trim() }
  });
  return response.data;
};

// Search TMDB people for @mention suggestions
export const searchTmdbPeopleForMentions = async (query) => {
  const q = String(query || '').trim();
  if (!q || !TMDB_API_KEY) return { results: [] };

  const res = await fetch(
    `${TMDB_BASE}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&include_adult=false&page=1`
  );

  if (!res.ok) {
    return { results: [] };
  }

  const data = await res.json();
  return { results: Array.isArray(data.results) ? data.results : [] };
};

export default {
  getDiscussion,
  createComment,
  replyToComment,
  toggleLike,
  toggleDislike,
  editComment,
  deleteComment,
  getTrendingDiscussions,
  searchUsersForMentions,
  searchTmdbPeopleForMentions
};
