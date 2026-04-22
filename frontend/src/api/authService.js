import api from './axios';

const TOKEN_KEY = 'moviemania_token';

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

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data?.token) {
    setToken(response.data.token);
    setAuthHeader();
  }
  return response.data;
};

export const register = async (data) => {
  const response = await api.post('/auth/register', data);
  if (response.data?.token) {
    setToken(response.data.token);
    setAuthHeader();
  }
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.put(`/auth/reset-password/${token}`, { password });
  if (response.data?.token) {
    setToken(response.data.token);
    setAuthHeader();
  }
  return response.data;
};

export const getProfile = async () => {
  setAuthHeader();
  const response = await api.get('/auth/me');
  return response.data;
};

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
