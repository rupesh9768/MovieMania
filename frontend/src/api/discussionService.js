// ====================================
// Discussion API Service
// Handles all discussion/comment endpoints
//
// TODO: Add pagination params to getDiscussion
// TODO: Add report comment endpoint
// ====================================
import api from './axios';

// ====================================
// Fetch discussion thread for a content item
// ====================================
export const getDiscussion = async (contentType, contentId) => {
  const response = await api.get(`/discussion/${contentType}/${contentId}`);
  return response.data;
};

// ====================================
// Create a new top-level comment
// ====================================
export const createComment = async ({ contentId, contentType, text }) => {
  const response = await api.post('/discussion', {
    contentId,
    contentType,
    text
  });
  return response.data;
};

// ====================================
// Reply to an existing comment
// ====================================
export const replyToComment = async (commentId, text) => {
  const response = await api.post(`/discussion/${commentId}/reply`, { text });
  return response.data;
};

// ====================================
// Toggle like on a comment
// ====================================
export const toggleLike = async (commentId) => {
  const response = await api.put(`/discussion/${commentId}/like`);
  return response.data;
};

// ====================================
// Toggle dislike on a comment
// ====================================
export const toggleDislike = async (commentId) => {
  const response = await api.put(`/discussion/${commentId}/dislike`);
  return response.data;
};

// ====================================
// Edit a comment (owner only)
// ====================================
export const editComment = async (commentId, text) => {
  const response = await api.put(`/discussion/${commentId}/edit`, { text });
  return response.data;
};

// ====================================
// Delete a comment (owner or admin)
// ====================================
export const deleteComment = async (commentId) => {
  const response = await api.delete(`/discussion/${commentId}`);
  return response.data;
};

export default {
  getDiscussion,
  createComment,
  replyToComment,
  toggleLike,
  toggleDislike,
  editComment,
  deleteComment
};
