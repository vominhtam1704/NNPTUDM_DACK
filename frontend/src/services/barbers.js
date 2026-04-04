import apiClient from './api';

export const getPublicBarbers = async (params = {}) => {
  const response = await apiClient.get('/users/barbers/public', { params });
  return response.data.data || response.data;
};

export const getPublicBarberProfile = async (barberId) => {
  const response = await apiClient.get(`/users/barbers/${barberId}/profile`);
  return response.data.data || response.data;
};
