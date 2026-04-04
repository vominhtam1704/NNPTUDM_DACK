// ============================================
// PAYMENTS.JS - PAYMENT ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

/**
 * @route   GET /api/payments
 * @desc    Get all payments (admin only)
 * @access  Protected (Admin)
 */
router.get(
  '/',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  paymentController.getAllPayments
);

/**
 * @route   GET /api/payments/epay/mock-checkout
 * @desc    Mock E-Pay checkout page for development/testing
 * @access  Public
 */
router.get('/epay/mock-checkout', paymentController.mockEPayCheckout);

/**
 * @route   POST /api/payments/epay/webhook
 * @desc    E-Pay webhook - receive payment confirmation
 * @access  Public (but signature verified)
 * ⚠️ CRITICAL - Signature verification required
 */
router.post('/epay/webhook', paymentController.ePayWebhook);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Protected
 */
router.get('/:id', authenticateToken, paymentController.getPaymentById);

/**
 * @route   GET /api/payments/:id/status
 * @desc    Check payment status
 * @access  Protected
 */
router.get('/:id/status', authenticateToken, paymentController.checkPaymentStatus);

/**
 * @route   POST /api/payments
 * @desc    Create payment (initiate SePay transfer)
 * @access  Protected
 */
router.post('/', authenticateToken, paymentController.createPayment);

/**
 * @route   POST /api/payments/epay/checkout
 * @desc    Create E-Pay payment and generate checkout URL
 * @access  Protected
 */
router.post('/epay/checkout', authenticateToken, paymentController.createEPayPayment);

/**
 * @route   POST /api/payments/webhook
 * @desc    SePay webhook - receive payment confirmation
 * @access  Public (but signature verified)
 * ⚠️ CRITICAL - HMAC-SHA256 signature verification
 */
router.post('/webhook', paymentController.sepayWebhook);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Refund payment
 * @access  Protected (Admin)
 */
router.post(
  '/:id/refund',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  paymentController.refundPayment
);

module.exports = router;
