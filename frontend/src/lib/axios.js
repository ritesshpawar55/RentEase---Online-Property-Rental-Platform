/**
 * Centralized Axios client instance for RentEase Application.
 * Configures base URL, timeout, request authorization headers injection,
 * and response interceptors for global error handling and forced sign-outs.
 */

import axios from 'axios';

// Create the Axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Injects JWT Bearer token into requests if available in localStorage.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rentease_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Intercepts responses to handle authentication failures (401)
 * and normalize backend validation/general error formats.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    if (response) {
      // Clear token and trigger global logout state if unauthorized
      if (response.status === 401) {
        console.warn('[Axios Session Expired]: Clearing local tokens.');
        localStorage.removeItem('rentease_token');
        localStorage.removeItem('rentease_user');
        
        // Dispatch custom logout event to notify Zustand state
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-logout'));
        }
      }
    } else {
      console.error('[Axios Network/Timeout Error]:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
