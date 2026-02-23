// Profile API Service
// Handles user profile operations
import api from './axios';

// Get public user profile
export const getUserProfile = async (userId) => {
  const response = await api.get(`/users/${userId}/profile`);
  return response.data;
};

// Update own profile
export const updateProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

// Upload avatar image
export const uploadAvatarImage = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Get user's comment history
export const getUserComments = async (userId) => {
  const response = await api.get(`/discussion/user/${userId}`);
  return response.data;
};

export default {
  getUserProfile,
  updateProfile,
  uploadAvatarImage,
  getUserComments
};
