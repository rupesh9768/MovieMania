// Auth API Service
// Handles authentication API calls
import api from './axios';

const TOKEN_KEY = 'moviemania_token';

// Token Management
export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// Set auth header on axios instance
export const setAuthHeader = () => {
  const token = getToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize auth header on import
setAuthHeader();

// Auth API Functions

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data?.token) {
    setToken(response.data.token);
    setAuthHeader();
  }
  return response.data;
};

/**
 * Register user
 * POST /api/auth/register
 */
export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  if (response.data?.token) {
    setToken(response.data.token);
    setAuthHeader();
  }
  return response.data;
};

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset password
 * PUT /api/auth/reset-password/:token
 */
export const resetPassword = async (token, password) => {
  const response = await api.put(`/auth/reset-password/${token}`, { password });
  if (response.data?.token) {
    setToken(response.data.token);
    setAuthHeader();
  }
  return response.data;
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getProfile = async () => {
  setAuthHeader();
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Logout - clear token
 */
export const logout = () => {
  removeToken();
  setAuthHeader();
};

export default {
  login,
  register,
  forgotPassword,
  resetPassword,
  getProfile,
  logout,
  getToken,
  setToken,
  removeToken,
  setAuthHeader
};
