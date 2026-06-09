import axios from 'axios';

// ALL API calls live in this file — check here before adding new ones.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('amp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Auth ----
export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);
export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/password', { currentPassword, newPassword }).then((r) => r.data);

// ---- Settings ----
export const getPublicSettings = () => api.get('/settings/public').then((r) => r.data);
export const getSettings = () => api.get('/settings').then((r) => r.data);
export const updateSettings = (values) => api.put('/settings', values).then((r) => r.data);

export default api;
