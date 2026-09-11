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
  (response) => {
    if (response.data && response.data.success === false) {
      const errMsg = response.data.error || response.data.detail || 'Operation failed';
      return Promise.reject({
        message: typeof errMsg === 'object' ? JSON.stringify(errMsg) : String(errMsg),
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    const rawDetail = error.response?.data?.detail || error.response?.data?.error || error.message || 'An unexpected error occurred';
    const customError = {
      message: typeof rawDetail === 'object' ? JSON.stringify(rawDetail) : String(rawDetail),
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

// Tutor & RAG Conversations API
export const tutorApi = {
  createConversation: async (projectId, title = null) => {
    const res = await post(`/projects/${projectId}/conversations`, { title });
    return res?.data || res;
  },
  listConversations: async (projectId) => {
    const res = await get(`/projects/${projectId}/conversations`);
    return Array.isArray(res?.data) ? res.data : (res?.data || []);
  },
  getConversation: async (projectId, conversationId) => {
    const res = await get(`/projects/${projectId}/conversations/${conversationId}`);
    return res?.data || res;
  },
  sendMessage: async (projectId, conversationId, content) => {
    const res = await post(`/projects/${projectId}/conversations/${conversationId}/messages`, { content });
    return res?.data || res;
  },
  deleteConversation: async (projectId, conversationId) => {
    const res = await del(`/projects/${projectId}/conversations/${conversationId}`);
    return res?.data || res;
  },
};

export const tutor = tutorApi;

// Adaptive Quiz & Assessment Engine API
export const quizApi = {
  start: async (projectId, settings = {}) => {
    const res = await post(`/projects/${projectId}/quizzes/start`, settings);
    return res?.data || res;
  },
  submitAnswer: async (projectId, quizId, questionId, answer) => {
    const res = await post(`/projects/${projectId}/quizzes/${quizId}/answer`, { question_id: questionId, answer });
    return res?.data || res;
  },
  getNext: async (projectId, quizId) => {
    const res = await get(`/projects/${projectId}/quizzes/${quizId}/next`);
    return res?.data || res;
  },
  complete: async (projectId, quizId) => {
    const res = await post(`/projects/${projectId}/quizzes/${quizId}/complete`);
    return res?.data || res;
  },
  getHistory: async (projectId) => {
    const res = await get(`/projects/${projectId}/quizzes`);
    return Array.isArray(res?.data) ? res.data : (res?.data || []);
  },
  getDetail: async (projectId, quizId) => {
    const res = await get(`/projects/${projectId}/quizzes/${quizId}`);
    return res?.data || res;
  },
};

export const quiz = quizApi;

// Mastery & Growth API
export const masteryApi = {
  getOverview: async (projectId) => {
    const res = await get(`/projects/${projectId}/mastery`);
    return res?.data || res;
  },
  getGrowth: async (projectId) => {
    const res = await get(`/projects/${projectId}/growth`);
    return res?.data || res;
  },
  getConcepts: async (projectId) => {
    const res = await get(`/projects/${projectId}/concepts`);
    return Array.isArray(res?.data) ? res.data : (res?.data || []);
  },
};

export const mastery = masteryApi;

// Recommendations API
export const recommendationsApi = {
  list: async (projectId) => {
    const res = await get(`/projects/${projectId}/recommendations`);
    return Array.isArray(res?.data) ? res.data : (res?.data || []);
  },
  generate: async (projectId) => {
    const res = await post(`/projects/${projectId}/recommendations/generate`);
    return Array.isArray(res?.data) ? res.data : (res?.data || []);
  },
  dismiss: async (recommendationId) => {
    const res = await put(`/recommendations/${recommendationId}/dismiss`);
    return res?.data || res;
  },
  complete: async (recommendationId) => {
    const res = await put(`/recommendations/${recommendationId}/complete`);
    return res?.data || res;
  },
};

export const recommendations = recommendationsApi;

// Analytics API
export const analyticsApi = {
  getProjectAnalytics: async (projectId) => {
    const res = await get(`/projects/${projectId}/analytics`);
    return res?.data || res;
  },
  getGlobalAnalytics: async () => {
    const res = await get('/analytics');
    return res?.data || res;
  },
  getAiUsageStats: async (params = {}) => {
    const res = await get('/analytics/ai-usage', params);
    return res?.data || res;
  },
};

export const analytics = analyticsApi;

// Admin Control Center API
export const adminApi = {
  getOverview: async () => {
    const res = await get('/admin/overview');
    return res?.data || res;
  },
  getUsers: async (params = {}) => {
    const res = await get('/admin/users', params);
    return res?.data || res;
  },
  getUserDetail: async (userId) => {
    const res = await get(`/admin/users/${userId}`);
    return res?.data || res;
  },
  getSpaces: async (params = {}) => {
    const res = await get('/admin/spaces', params);
    return res?.data || res;
  },
  getProjects: async (params = {}) => {
    const res = await get('/admin/projects', params);
    return res?.data || res;
  },
  getActivity: async (params = {}) => {
    const res = await get('/admin/activity', params);
    return res?.data || res;
  },
  getLearningAnalytics: async () => {
    const res = await get('/admin/learning-analytics');
    return res?.data || res;
  },
  getAiUsage: async () => {
    const res = await get('/admin/ai-usage');
    return res?.data || res;
  },
  getAiEvaluation: async () => {
    const res = await get('/admin/ai-evaluation');
    return res?.data || res;
  },
  getSystemHealth: async () => {
    const res = await get('/admin/system-health');
    return res?.data || res;
  },
};

export const homeApi = {
  getDashboard: async () => {
    const res = await get('/home/dashboard');
    return res?.data || res;
  },
};

export const admin = adminApi;

export default apiClient;

