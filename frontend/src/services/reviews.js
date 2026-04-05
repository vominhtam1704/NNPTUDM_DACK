import apiClient from './api';

export const createReview = async (payload) => {
  const response = await apiClient.post('/reviews', payload);
  return response;
};
