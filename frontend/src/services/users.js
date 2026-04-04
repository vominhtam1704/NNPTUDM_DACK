// ============================================
// USERS SERVICE - API CALLS
// ============================================
import apiClient from './api';

export const getAllUsers = async (params = {}) => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id, payload) => {
  const response = await apiClient.put(`/users/${id}`, payload);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};

export const getUsersByRole = async (role) => {
  const response = await apiClient.get(`/users/role/${role}`);
  return response.data;
};
