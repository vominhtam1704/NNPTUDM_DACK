import apiClient from './api';

export const getMyReservations = async (params = {}) => {
  const response = await apiClient.get('/reservations/my-bookings', { params });
  return response.data;
};

export const getReservationById = async (reservationId) => {
  const response = await apiClient.get(`/reservations/${reservationId}`);
  return response.data;
};

export const getAvailableSlots = async (barberId, date) => {
  const response = await apiClient.get(`/reservations/available-slots/${barberId}`, {
    params: { barberId, date },
  });
  return response.data;
};

export const createReservation = async (payload) => {
  const response = await apiClient.post('/reservations', payload);
  return response.data;
};

export const cancelReservation = async (reservationId, payload = {}) => {
  const response = await apiClient.put(`/reservations/${reservationId}/cancel`, payload);
  return response.data;
};
