import apiClient from './api';

export const getAllVouchers = async (params = {}) => {
  const response = await apiClient.get('/vouchers', { params });
  return response;
};

export const getVoucherById = async (id) => {
  const response = await apiClient.get(`/vouchers/${id}`);
  return response;
};

export const createVoucher = async (data) => {
  const response = await apiClient.post('/vouchers', data);
  return response;
};

export const updateVoucher = async (id, data) => {
  const response = await apiClient.put(`/vouchers/${id}`, data);
  return response;
};

export const deleteVoucher = async (id) => {
  const response = await apiClient.delete(`/vouchers/${id}`);
  return response;
};

export const validateVoucher = async (code, amount) => {
  const response = await apiClient.post('/vouchers/validate', { code, amount });
  return response;
};
