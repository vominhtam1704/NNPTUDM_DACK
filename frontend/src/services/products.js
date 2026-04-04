import apiClient from './api';

export const getProducts = async (params = {}) => {
  const response = await apiClient.get('/products', { params });
  return response.data;
};
