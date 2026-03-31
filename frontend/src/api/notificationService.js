import api from './axios';

export const getNotifications = async (page = 1, limit = 20) => {
  const { data } = await api.get(`/notifications?page=${page}&limit=${limit}`);
  return data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count');
  return data;
};

export const markNotificationAsRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsAsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};

export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
};

export const clearAllNotifications = async () => {
  const { data } = await api.delete('/notifications');
  return data;
};
