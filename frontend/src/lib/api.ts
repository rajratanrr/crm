import axios from 'axios';

const api = axios.create({
  baseURL: (() => {
    const raw = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5001/api");
    if (!raw.startsWith("http")) return raw;
    return raw.endsWith("/api") ? raw : `${raw.replace(/\/$/, "")}/api`;
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
