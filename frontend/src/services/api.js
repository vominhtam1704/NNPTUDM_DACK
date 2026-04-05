// ============================================
// API SERVICE - AXIOS CONFIGURATION
// ============================================
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Don't auto-redirect on 401, let AuthContext handle it
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
