// ============================================
// RESERVATIONS.JS - APPOINTMENT ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

/**
 * @route   GET /api/reservations
 * @desc    Get all reservations (admin only)
 * @access  Protected (Admin)
 */
router.get(
  '/',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  reservationController.getAllReservations
);

/**
 * @route   GET /api/reservations/available-slots
 * @desc    Get available time slots for barber on date
 * @access  Public
 */
router.get('/available-slots/:barberId', reservationController.getAvailableSlots);

/**
 * @route   GET /api/reservations/my-bookings
 * @desc    Get customer's own reservations
 * @access  Protected
 */
router.get(
  '/my-bookings',
  authenticateToken,
  reservationController.getMyReservations
);

/**
 * @route   GET /api/reservations/:id
 * @desc    Get reservation by ID
 * @access  Protected
 */
router.get('/:id', authenticateToken, reservationController.getReservationById);

/**
 * @route   POST /api/reservations
 * @desc    Create new reservation (book appointment)
 * @access  Protected
 */
router.post(
  '/',
  authenticateToken,
  reservationController.createReservation
);

/**
 * @route   PUT /api/reservations/:id/confirm
 * @desc    Confirm reservation (after payment)
 * @access  Protected (Admin/Barber)
 */
router.put(
  '/:id/confirm',
  authenticateToken,
  authorizeRole([ROLES.ADMIN, ROLES.BARBER]),
  reservationController.confirmReservation
);

/**
 * @route   PUT /api/reservations/:id/complete
 * @desc    Complete reservation
 * @access  Protected (Admin/Barber)
 */
router.put(
  '/:id/complete',
  authenticateToken,
  authorizeRole([ROLES.ADMIN, ROLES.BARBER]),
  reservationController.completeReservation
);

/**
 * @route   PUT /api/reservations/:id
 * @desc    Update reservation
 * @access  Protected
 */
router.put('/:id', authenticateToken, reservationController.updateReservation);

/**
 * @route   PUT /api/reservations/:id/cancel
 * @desc    Cancel reservation
 * @access  Protected
 */
router.put('/:id/cancel', authenticateToken, reservationController.cancelReservation);

module.exports = router;
