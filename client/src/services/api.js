import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('agentflow-auth');
    if (token) {
      try { config.headers.Authorization = `Bearer ${JSON.parse(token).state.token}`; } catch { /* stale storage */ }
    }
  }
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('agentflow-auth');
    if (!['/login', '/register'].includes(window.location.pathname)) window.location.href = '/login';
  }
  return Promise.reject(error);
});

export const unwrap = (response) => response.data;
export default api;
