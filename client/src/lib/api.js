import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getCompany = () => api.get('/company');
export const updateCompany = (data) => api.put('/company', data);
export const uploadLogo = (formData) => api.post('/company/logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const createUser = (data) => api.post('/auth/create-user', data);
export const updateAuthUser = (uid, data) => api.put(`/auth/update-user/${uid}`, data);
export const deleteUser = (uid) => api.delete(`/auth/delete-user/${uid}`);
export const toggleUser = (uid) => api.patch(`/auth/toggle-user/${uid}`);
export const resetPassword = (uid, data) => api.patch(`/auth/reset-password/${uid}`, data);

export const getTasks = (params) => api.get('/tasks', { params });
export const getTask = (id) => api.get(`/tasks/${id}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const startTask = (id) => api.patch(`/tasks/${id}/start`);
export const submitReport = (id, data) => api.patch(`/tasks/${id}/submit`, data);
export const decideTask = (id, data) => api.patch(`/tasks/${id}/decide`, data);

export const getUsers = () => api.get('/users');
export const getUser = (uid) => api.get(`/users/${uid}`);
export const uploadAvatar = (uid, formData) => api.put(`/users/${uid}/avatar`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getRecentTasks = () => api.get('/dashboard/recent');

export default api;