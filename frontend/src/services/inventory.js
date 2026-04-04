// ============================================
// INVENTORY SERVICE - API CALLS
// ============================================
import apiClient from './api';

export const getInventory = async (params = {}) => {
  const response = await apiClient.get('/inventory', { params });
  return response.data;
};

export const getLowStockInventory = async () => {
  const response = await apiClient.get('/inventory', { params: { lowStock: true } });
  return response.data;
};

export const getInventoryById = async (id) => {
  const response = await apiClient.get(`/inventory/${id}`);
  return response.data;
};

export const createInventoryItem = async (payload) => {
  const response = await apiClient.post('/inventory', payload);
  return response.data;
};

export const updateInventoryItem = async (id, payload) => {
  const response = await apiClient.put(`/inventory/${id}`, payload);
  return response.data;
};

export const deleteInventoryItem = async (id) => {
  const response = await apiClient.delete(`/inventory/${id}`);
  return response.data;
};

export const adjustStock = async (id, payload) => {
  const response = await apiClient.put(`/inventory/${id}/adjust-stock`, payload);
  return response.data;
};
