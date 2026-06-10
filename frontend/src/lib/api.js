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

// ---- Galleries (public) ----
export const getGalleries = () => api.get('/galleries').then((r) => r.data);
export const getGallery = (slug) => api.get(`/galleries/${slug}`).then((r) => r.data);

// ---- Galleries (admin) ----
export const adminGetGalleries = () => api.get('/galleries/admin/list').then((r) => r.data);
export const adminCreateGallery = (data) => api.post('/galleries/admin', data).then((r) => r.data);
export const adminUpdateGallery = (id, data) => api.put(`/galleries/admin/${id}`, data).then((r) => r.data);
export const adminDeleteGallery = (id) => api.delete(`/galleries/admin/${id}`).then((r) => r.data);

// ---- Photos (admin) ----
export const signUpload = () => api.post('/galleries/admin/sign-upload').then((r) => r.data);
export const adminSavePhoto = (galleryId, data) =>
  api.post(`/galleries/admin/${galleryId}/photos`, data).then((r) => r.data);
export const adminUpdatePhoto = (id, data) =>
  api.put(`/galleries/admin/photos/${id}`, data).then((r) => r.data);
export const adminDeletePhoto = (id) =>
  api.delete(`/galleries/admin/photos/${id}`).then((r) => r.data);
export const adminReorderPhotos = (galleryId, order) =>
  api.put(`/galleries/admin/${galleryId}/photos/reorder`, { order }).then((r) => r.data);

export default api;
