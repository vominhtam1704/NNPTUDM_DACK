// ============================================
// PRODUCTS SERVICE - API CALLS (FULL CRUD)
// ============================================
import apiClient from './api';

export const getProducts = async (params = {}) => {
  const response = await apiClient.get('/products', { params });
  return response;
};

export const getProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return response;
};

export const getProductsByCategory = async (categoryId) => {
  const response = await apiClient.get(`/products/category/${categoryId}`);
  return response;
};

// FormData for image upload
export const createProduct = async (formData) => {
  const response = await apiClient.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response;
};

export const updateProduct = async (id, formData) => {
  const response = await apiClient.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response;
};

export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/products/${id}`);
  return response;
};
