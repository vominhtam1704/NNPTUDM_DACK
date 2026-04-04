// ============================================
// CATEGORIES SERVICE - API CALLS
// ============================================
import apiClient from './api';

export const getCategories = async (params = {}) => {
  const response = await apiClient.get('/categories', { params });
  return response;
};

export const getCategoryById = async (id) => {
  const response = await apiClient.get(`/categories/${id}`);
  return response;
};

export const createCategory = async (payload) => {
  const response = await apiClient.post('/categories', payload);
  return response;
};

export const updateCategory = async (id, payload) => {
  const response = await apiClient.put(`/categories/${id}`, payload);
  return response;
};

export const deleteCategory = async (id) => {
  const response = await apiClient.delete(`/categories/${id}`);
  return response;
};
