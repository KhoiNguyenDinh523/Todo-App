import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Add JWT token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

export const tasks = {
  getAll: (params = {}) => {
    const { status, sortBy, search } = params;
    const queryParams = new URLSearchParams();
    
    if (status && status !== 'all') {
      queryParams.append('status', status);
    }
    
    if (sortBy) {
      queryParams.append('sort_by', sortBy.replace('Desc', '_desc').replace('Asc', '_asc'));
    }
    
    if (search) {
      queryParams.append('search', search);
    }
    
    return api.get(`/tasks?${queryParams.toString()}`);
  },
  create: (task) => api.post('/tasks', task),
  update: (id, task) => api.put(`/tasks/${id}`, task),
  delete: (id) => api.delete(`/tasks/${id}`),
  toggleComplete: (id, completed) => api.put(`/tasks/${id}`, { completed }),
};

export default api; 