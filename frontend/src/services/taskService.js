import api from './api';

// ==================== Auth ====================

export const getProfile = () => api.get('/profile');

// ==================== Manager APIs ====================

export const getEmployees = () => api.get('/employees');

export const getDashboardStats = () => api.get('/dashboard/stats');

export const createTask = (taskData) => api.post('/tasks', taskData);

export const getAllTasks = (params = {}) => api.get('/tasks', { params });

export const updateTask = (taskId, taskData) => api.put(`/tasks/${taskId}`, taskData);

export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);

// ==================== Employee APIs ====================

export const getMyTasks = () => api.get('/mytasks');

export const updateMyTask = (taskId, taskData) => api.put(`/mytasks/${taskId}`, taskData);

export const getMyTaskStats = () => api.get('/mytasks/stats');
