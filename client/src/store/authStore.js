import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(persist((set) => ({
  token: null, user: null, hydrated: false,
  setHydrated: () => set({ hydrated: true }),
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    set({ token: data.token, user: data.user });
    return data;
  },
  register: async (details) => {
    const { data } = await api.post('/auth/register', details);
    set({ token: data.token, user: data.user });
    return data;
  },
  loadProfile: async () => {
    const { data } = await api.get('/auth/me');
    set({ user: data.user });
    return data.user;
  },
  logout: () => set({ token: null, user: null }),
}), { name: 'agentflow-auth', onRehydrateStorage: () => (state) => state?.setHydrated() }));
