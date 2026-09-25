import axios from 'axios';

const api = axios.create({
  baseURL: (() => {
    let raw = import.meta.env.VITE_API_URL;
    if (!raw) {
      if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
        raw = 'https://studio-crm-backend-4ybn.onrender.com/api';
      } else if (import.meta.env.PROD) {
        raw = 'https://studio-crm-backend-4ybn.onrender.com/api';
      } else {
        raw = 'http://localhost:5001/api';
      }
    }
    if (!raw.startsWith('http')) return raw;
    return raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;
  })(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isAlreadyOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      if (!isLoginRequest && !isAlreadyOnLoginPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
