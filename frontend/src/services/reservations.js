// ============================================
// RESERVATIONS SERVICE - API CALLS (FULL)
// ============================================
import apiClient from './api';

// Customer
export const getMyReservations = async (params = {}) => {
  const response = await apiClient.get('/reservations/my-bookings', { params });
  return response;
};

export const getReservationById = async (reservationId) => {
  const response = await apiClient.get(`/reservations/${reservationId}`);
  return response;
};

export const getAvailableSlots = async (barberId, date) => {
  const response = await apiClient.get(`/reservations/available-slots/${barberId}`, {
    params: { barberId, date },
  });
  return response;
};

export const createReservation = async (payload) => {
  const response = await apiClient.post('/reservations', payload);
  return response;
};

export const cancelReservation = async (reservationId, payload = {}) => {
  const response = await apiClient.put(`/reservations/${reservationId}/cancel`, payload);
  return response;
};

// Admin
export const getAllReservations = async (params = {}) => {
  const response = await apiClient.get('/reservations', { params });
  return response;
};

export const updateReservation = async (id, payload) => {
  const response = await apiClient.put(`/reservations/${id}`, payload);
  return response;
};

export const confirmReservation = async (id) => {
  const response = await apiClient.put(`/reservations/${id}/confirm`);
  return response;
};

export const completeReservation = async (id) => {
  const response = await apiClient.put(`/reservations/${id}/complete`);
  return response;
};
