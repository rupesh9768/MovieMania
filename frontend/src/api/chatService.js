import api from './axios';

// User endpoints
export const getMyChat = async () => {
  const res = await api.get('/chat/me');
  return res.data;
};

export const sendChatMessage = async (text) => {
  const res = await api.post('/chat/send', { text });
  return res.data;
};

export const deleteChatMessage = async (messageId) => {
  const res = await api.delete(`/chat/message/${messageId}`);
  return res.data;
};

// Admin endpoints
export const getAllChats = async () => {
  const res = await api.get('/chat/admin/all');
  return res.data;
};

export const getChatByUser = async (userId) => {
  const res = await api.get(`/chat/admin/${userId}`);
  return res.data;
};

export const adminSendMessage = async (userId, text) => {
  const res = await api.post(`/chat/admin/${userId}/send`, { text });
  return res.data;
};

export const adminDeleteChatMessage = async (userId, messageId) => {
  const res = await api.delete(`/chat/admin/${userId}/message/${messageId}`);
  return res.data;
};

export const getAdminChatUnreadCount = async () => {
  const res = await api.get('/chat/admin/unread-count');
  return res.data;
};
