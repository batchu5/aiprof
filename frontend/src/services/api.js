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
      message: error.response?.data?.detail || error.response?.data?.error || error.message || 'An unexpected error occurred',
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

export const post = async (url, data = {}, config = {}) => {
  const response = await apiClient.post(url, data, config);
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

// Spaces API
export const spacesApi = {
  list: async () => {
    const res = await get('/spaces');
    return res?.data?.spaces ? res.data : { spaces: res?.data || [], total: (res?.data || []).length };
  },
  create: async (data) => {
    const res = await post('/spaces', data);
    return res?.data || res;
  },
  get: async (id) => {
    const res = await get(`/spaces/${id}`);
    return res?.data || res;
  },
  update: async (id, data) => {
    const res = await put(`/spaces/${id}`, data);
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await del(`/spaces/${id}`);
    return res?.data || res;
  },
};

// Projects API
export const projectsApi = {
  list: async (spaceId = null) => {
    const res = await get('/projects', spaceId ? { space_id: spaceId } : {});
    return Array.isArray(res?.data) ? res.data : (res?.data?.projects || []);
  },
  create: async (data) => {
    const res = await post('/projects', data);
    return res?.data || res;
  },
  get: async (id) => {
    const res = await get(`/projects/${id}`);
    return res?.data || res;
  },
  getDashboard: async (id) => {
    const res = await get(`/projects/${id}/dashboard`);
    return res?.data || res;
  },
  update: async (id, data) => {
    const res = await put(`/projects/${id}`, data);
    return res?.data || res;
  },
  delete: async (id) => {
    const res = await del(`/projects/${id}`);
    return res?.data || res;
  },
};

// Materials API
export const materialsApi = {
  upload: async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await post(`/projects/${projectId}/materials/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res?.data || res;
  },
  list: async (projectId) => {
    const res = await get(`/projects/${projectId}/materials`);
    return Array.isArray(res?.data) ? res.data : (res?.data?.materials || []);
  },
  get: async (projectId, materialId) => {
    const res = await get(`/projects/${projectId}/materials/${materialId}`);
    return res?.data || res;
  },
  getStatus: async (projectId, materialId) => {
    const res = await get(`/projects/${projectId}/materials/${materialId}/status`);
    return res?.data || res;
  },
  delete: async (projectId, materialId) => {
    const res = await del(`/projects/${projectId}/materials/${materialId}`);
    return res?.data || res;
  },
};

export default apiClient;
