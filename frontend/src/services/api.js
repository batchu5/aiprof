import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach Supabase session token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Error fetching Supabase session for API request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Standardize error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.detail || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

export const get = async (url, params = {}) => {
  const response = await apiClient.get(url, { params });
  return response.data;
};

export const post = async (url, data = {}) => {
  const response = await apiClient.post(url, data);
  return response.data;
};

export const put = async (url, data = {}) => {
  const response = await apiClient.put(url, data);
  return response.data;
};

export const del = async (url) => {
  const response = await apiClient.delete(url);
  return response.data;
};

export default apiClient;
