import axios from 'axios';

// Get backend URL from environment variables
const getBaseURL = () => {
  const envUrl = (process.env.REACT_APP_BACKEND_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '') + '/api/';
  }
  // Fallback to relative path if no URL is provided
  return '/api/';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000, // 10s timeout
});

// Request Interceptor
api.interceptors.request.use((config) => {
  // 1. Ensure URL doesn't have double slashes when joining with baseURL
  if (config.url && config.url.startsWith('/')) {
    config.url = config.url.substring(1);
  }

  // 2. Attach Token
  const token = localStorage.getItem('token');
  // Only attach if token exists AND it's not an auth route
  const isAuthRoute = config.url && (config.url.includes('auth/') || config.url.includes('login') || config.url.includes('register'));
  
  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors for debugging
    console.error(`API Error [${error.config?.url}]:`, error.response?.status, error.message);

    const isAuthRoute = error.config?.url && (error.config.url.includes('auth/') || error.config.url.includes('login'));
    
    // Auto-logout on 401 Unauthorized, UNLESS it's the login attempt itself
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('subscription');
      localStorage.removeItem('userData');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
