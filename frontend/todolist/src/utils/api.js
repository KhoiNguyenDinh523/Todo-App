import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance with proper config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error:', error.request);
      return Promise.reject({ message: 'Network error occurred' });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

export const auth = {
  register: (userData) => api.post('/auth/register', userData),
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  },
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

// Add health check endpoint
export const health = {
  check: () => api.get('/health'),
};

export default api; 