import apiClient from './api';

export const createPayment = async (payload) => {
  const response = await apiClient.post('/payments', payload);
  return response.data;
};

export const createEPayPayment = async (reservationId, returnUrl) => {
  const response = await apiClient.post('/payments/epay/checkout', {
    reservationId,
    returnUrl
  });
  return response.data;
};

export const getPaymentById = async (paymentId) => {
  const response = await apiClient.get(`/payments/${paymentId}`);
  return response.data;
};
