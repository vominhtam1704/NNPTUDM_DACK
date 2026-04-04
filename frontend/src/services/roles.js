// ============================================
// ROLES SERVICE - API CALLS
// ============================================
import apiClient from './api';

export const getRoles = async () => {
  const response = await apiClient.get('/roles');
  return response.data;
};

export const getRoleById = async (id) => {
  const response = await apiClient.get(`/roles/${id}`);
  return response.data;
};

export const createRole = async (payload) => {
  const response = await apiClient.post('/roles', payload);
  return response.data;
};

export const updateRole = async (id, payload) => {
  const response = await apiClient.put(`/roles/${id}`, payload);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await apiClient.delete(`/roles/${id}`);
  return response.data;
};
