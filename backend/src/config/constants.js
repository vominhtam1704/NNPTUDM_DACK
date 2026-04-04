// ============================================
// CONSTANTS.JS - SYSTEM CONSTANTS
// ============================================

const ROLES = {
  ADMIN: 'admin',
  BARBER: 'barber',
  CUSTOMER: 'customer'
};

const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DONE: 'done',
  CANCELLED: 'cancelled'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

const PAYMENT_METHOD = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  QR: 'qr',
  EPAY: 'epay'
};

const MESSAGE_TYPE = {
  NOTIFICATION: 'notification',
  CHAT: 'chat'
};

const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_SERVICES: 'manage_services',
  MANAGE_APPOINTMENTS: 'manage_appointments',
  MANAGE_PAYMENTS: 'manage_payments',
  VIEW_REPORTS: 'view_reports',
  BOOK_APPOINTMENT: 'book_appointment',
  UPDATE_PROFILE: 'update_profile'
};

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

module.exports = {
  ROLES,
  APPOINTMENT_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  MESSAGE_TYPE,
  PERMISSIONS,
  TIME_SLOTS
};
