// ====================================
// Axios Instance Configuration
// ====================================
import axios from 'axios';

/**
 * Create Axios instance with default configuration
 * Base URL comes from environment variable VITE_API_BASE_URL
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ====================================
// Request Interceptor
// ====================================
api.interceptors.request.use(
  (config) => {
    // You can add auth token here later
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ====================================
// Response Interceptor - Global Error Handling
// ====================================
api.interceptors.response.use(
  (response) => {
    // Return successful response data
    return response;
  },
  (error) => {
    // Handle different error scenarios
    const { response } = error;

    if (!response) {
      // Network error or server not reachable
      console.error('❌ Network Error: Server is not reachable');
      return Promise.reject({
        message: 'Unable to connect to server. Please check your connection.',
        status: 0
      });
    }

    // Handle specific HTTP status codes
    switch (response.status) {
      case 400:
        console.error('❌ Bad Request:', response.data?.message);
        break;
      case 401:
        console.error('❌ Unauthorized: Please login again');
        // You can redirect to login or clear auth state here
        // localStorage.removeItem('token');
        // window.location.href = '/login';
        break;
      case 403:
        console.error('❌ Forbidden: Access denied');
        break;
      case 404:
        console.error('❌ Not Found:', response.data?.message);
        break;
      case 500:
        console.error('❌ Server Error:', response.data?.message);
        break;
      default:
        console.error(`❌ Error ${response.status}:`, response.data?.message);
    }

    // Return standardized error object
    return Promise.reject({
      message: response.data?.message || response.data?.error || 'Something went wrong',
      status: response.status,
      data: response.data
    });
  }
);

export default api;
