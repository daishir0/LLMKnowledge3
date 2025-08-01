import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getApiKey: () => api.get('/auth/api-key'),
  regenerateApiKey: () => api.post('/auth/regenerate-api-key'),
};

export const groupsAPI = {
  list: (params?: { skip?: number; limit?: number; search?: string }) =>
    api.get('/groups/', { params }),
  create: (data: { name: string; description?: string }) =>
    api.post('/groups/', data),
  get: (id: number) => api.get(`/groups/${id}`),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put(`/groups/${id}`, data),
  delete: (id: number) => api.delete(`/groups/${id}`),
  addPrompt: (groupId: number, promptId: number) =>
    api.post(`/groups/${groupId}/prompts/${promptId}`),
  removePrompt: (groupId: number, promptId: number) =>
    api.delete(`/groups/${groupId}/prompts/${promptId}`),
  getPrompts: (groupId: number) =>
    api.get(`/groups/${groupId}/prompts`),
  getDetail: (groupId: number) =>
    api.get(`/groups/${groupId}/detail`),
};

export const promptsAPI = {
  list: (params?: { skip?: number; limit?: number; search?: string; category?: string }) =>
    api.get('/prompts/', { params }),
  create: (data: { name: string; content: string; category?: string }) =>
    api.post('/prompts/', data),
  get: (id: number) => api.get(`/prompts/${id}`),
  update: (id: number, data: { name?: string; content?: string; category?: string }) =>
    api.put(`/prompts/${id}`, data),
  delete: (id: number) => api.delete(`/prompts/${id}`),
};

export const recordsAPI = {
  list: (params?: { skip?: number; limit?: number; search?: string; group_id?: number }) =>
    api.get('/records/', { params }),
  create: (data: { title: string; content: string; group_id: number; file_path?: string; file_type?: string; parent_type?: string; parent_id?: number }) =>
    api.post('/records/', data),
  upload: (groupId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/records/upload?group_id=${groupId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get: (id: number) => api.get(`/records/${id}`),
  update: (id: number, data: { title?: string; content?: string }) =>
    api.put(`/records/${id}`, data),
  delete: (id: number) => api.delete(`/records/${id}`),
};

export const knowledgeAPI = {
  list: (params?: { skip?: number; limit?: number; search?: string; record_id?: number; prompt_id?: number }) =>
    api.get('/knowledge/', { params }),
  create: (data: { question: string; answer: string; record_id: number; prompt_id: number; parent_type?: string; parent_id?: number }) =>
    api.post('/knowledge/', data),
  get: (id: number) => api.get(`/knowledge/${id}`),
  update: (id: number, data: { question?: string; answer?: string }) =>
    api.put(`/knowledge/${id}`, data),
  delete: (id: number) => api.delete(`/knowledge/${id}`),
};

export const tasksAPI = {
  list: (params?: { skip?: number; limit?: number; status?: string }) =>
    api.get('/tasks/', { params }),
  create: (data: { type: string; record_id: number; prompt_id: number; ai_provider?: string; ai_model?: string }) =>
    api.post('/tasks/', data),
  createBulk: (groupId: number, force?: boolean) =>
    api.post(`/tasks/bulk/group/${groupId}?force=${force || false}`),
  getStatus: () => api.get('/tasks/status'),
  get: (id: number) => api.get(`/tasks/${id}`),
  update: (id: number, data: { status?: string }) =>
    api.put(`/tasks/${id}`, data),
  cancel: (id: number) => api.delete(`/tasks/${id}`),
};

export const matrixAPI = {
  // 既存のレガシーエンドポイント（後方互換性のため）
  get: (groupIds?: string) =>
    api.get('/matrix/legacy', { params: groupIds ? { group_ids: groupIds } : {} }),
  exportExcel: (groupIds?: string) =>
    api.get('/matrix/legacy/export/excel', {
      params: groupIds ? { group_ids: groupIds } : {},
      responseType: 'blob',
    }),
  
  // 新しいマトリックス定義機能
  getDefinitions: () => api.get('/matrix/definitions'),
  createDefinition: (data: { name: string; description?: string; group_ids: string }) =>
    api.post('/matrix/definitions', data),
  updateDefinition: (id: number, data: { name?: string; description?: string; group_ids?: string }) =>
    api.put(`/matrix/definitions/${id}`, data),
  deleteDefinition: (id: number) => api.delete(`/matrix/definitions/${id}`),
  
  // マトリックス表示・エクスポート
  viewMatrix: (matrixId: number, includePlainKnowledge?: boolean) =>
    api.get(`/matrix/view/${matrixId}`, {
      params: includePlainKnowledge ? { include_plain_knowledge: true } : {}
    }),
  exportMatrixExcel: (matrixId: number, includePlainKnowledge?: boolean) =>
    api.get(`/matrix/export/${matrixId}/excel`, {
      params: includePlainKnowledge ? { include_plain_knowledge: true } : {},
      responseType: 'blob',
    }),
};

export const adminAPI = {
  listUsers: (params?: { skip?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  deactivateUser: (id: number) => api.delete(`/admin/users/${id}`),
  resetUserUsage: (id: number) => api.post(`/admin/users/${id}/reset-usage`),
  getStats: () => api.get('/admin/stats'),
  getMatrix: (userId?: number, groupIds?: string) =>
    api.get('/matrix/admin/', {
      params: { user_id: userId, group_ids: groupIds },
    }),
  exportMatrix: (userId?: number, groupIds?: string) =>
    api.get('/matrix/admin/export/excel', {
      params: { user_id: userId, group_ids: groupIds },
      responseType: 'blob',
    }),
};

export default api;
