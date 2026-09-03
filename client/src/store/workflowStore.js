import { create } from 'zustand';
import api from '../services/api';

export const useWorkflowStore = create((set) => ({
  workflows: [], loading: false,
  fetchWorkflows: async (params = {}) => { set({ loading: true }); try { const { data } = await api.get('/workflows', { params }); set({ workflows: data.workflows || [], loading: false }); } catch (error) { set({ loading: false }); throw error; } },
  generate: async (prompt) => (await api.post('/workflows/generate', { prompt })).data,
  create: async (payload) => (await api.post('/workflows', payload)).data.workflow,
  update: async (id, payload) => (await api.put(`/workflows/${id}`, payload)).data.workflow,
  execute: async (id, inputs = {}) => (await api.post(`/workflows/${id}/execute`, { inputs })).data.execution,
}));
