import apiClient from './api';

export const getAnalyticsOverview = async (params = {}) => {
  const response = await apiClient.get('/analytics/overview', { params });
  return response.data;
};
