import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('moviemania_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect
      localStorage.removeItem('moviemania_token');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') && 
          !window.location.pathname.startsWith('/register')) {
        // Don't force redirect for public pages that make optional auth calls
        console.warn('Auth token invalid or expired');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
