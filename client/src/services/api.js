import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('agentflow-auth');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        if (token && token !== 'null' && token !== 'undefined' && typeof token === 'string' && token.trim()) {
          config.headers.Authorization = `Bearer ${token.trim()}`;
        }
      } catch {
        /* stale storage */
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('agentflow-auth');
      } catch (_) {}
      if (!['/login', '/register'].includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const unwrap = (response) => response.data;
export default api;
