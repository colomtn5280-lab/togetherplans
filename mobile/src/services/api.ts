import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants';

const TOKEN_KEY = 'datenight_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token helpers
export const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token);
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);
export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

// Auth
export const authAPI = {
  register: (email: string, password: string, displayName: string) =>
    api.post('/api/auth/register', { email, password, displayName }),
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
  deleteAccount: () => api.delete('/api/auth/me'),
};

// Groups
export const groupsAPI = {
  list: () => api.get('/api/groups'),
  create: (name: string, description?: string) =>
    api.post('/api/groups', { name, description }),
  get: (id: string) => api.get(`/api/groups/${id}`),
};

// Invitations
export const invitationsAPI = {
  create: (groupId: string, method: string, target?: string) =>
    api.post('/api/invitations', { groupId, method, target }),
  accept: (token: string) => api.post(`/api/invitations/accept/${token}`),
};

// Proposals
export const proposalsAPI = {
  create: (groupId: string, title: string, description?: string, scheduledFor?: string) =>
    api.post('/api/proposals', { groupId, title, description, scheduledFor }),
  get: (id: string) => api.get(`/api/proposals/${id}`),
  vote: (proposalId: string, optionId: string) =>
    api.post(`/api/proposals/${proposalId}/vote`, { optionId }),
  counter: (proposalId: string, title: string, description?: string) =>
    api.post(`/api/proposals/${proposalId}/counter`, { title, description }),
  suggestions: (lat?: number, lng?: number, category?: string) =>
    api.get('/api/proposals/suggestions/list', { params: { lat, lng, category } }),
};
