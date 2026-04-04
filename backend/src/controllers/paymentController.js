// ============================================
// PAYMENTCONTROLLER.JS - PAYMENT HANDLING + SEPAY
// ============================================
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const Message = require('../models/Message');
const crypto = require('crypto');
const axios = require('axios');
const { formatSuccess, formatError, formatPaginated } = require('../utils/response');
const { PAYMENT_STATUS, APPOINTMENT_STATUS } = require('../config/constants');

const SEPAY_API = process.env.SEPAY_API || 'https://api.sepay.vn';
const SEPAY_ACCOUNT = process.env.SEPAY_ACCOUNT_NUMBER;
const SEPAY_BANK_CODE = process.env.SEPAY_BANK_CODE;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Get All Payments - GET /payments
 * Admin only - list all payments
 */
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const payments = await Payment.find(filter)
      .populate('reservationId', 'appointmentDate appointmentTime totalPrice')
      .populate('customerId', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(filter);

    res.status(200).json(
      formatPaginated(payments, page, limit, total)
    );
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json(
      formatError('Failed to fetch payments: ' + error.message)
    );
  }
};

/**
 * Get Payment by ID - GET /payments/:id
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('reservationId')
      .populate('customerId', 'name email');

    if (!payment) {
      return res.status(404).json(
        formatError('Payment not found')
      );
    }

    res.status(200).json(
      formatSuccess(payment, 'Payment retrieved successfully')
    );
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json(
      formatError('Failed to fetch payment: ' + error.message)
    );
  }
};

/**
 * Create Payment - POST /payments
 * Customer initiates payment for reservation
 */
exports.createPayment = async (req, res) => {
  try {
    const { reservationId } = req.body;
    const customerId = req.user.userId;

    // ===== VALIDATION =====
    if (!reservationId) {
      return res.status(400).json(
        formatError('reservationId is required')
      );
    }

    // ===== FIND RESERVATION =====
    const reservation = await Reservation.findById(reservationId)
      .populate('serviceId');

    if (!reservation) {
      return res.status(404).json(
        formatError('Reservation not found')
      );
    }

    // Verify customer owns this reservation
    if (reservation.customerId.toString() !== customerId) {
      return res.status(403).json(
        formatError('You do not own this reservation')
      );
    }

    // ===== CREATE PAYMENT RECORD =====
    const payment = new Payment({
      reservationId,
      customerId,
      amount: reservation.totalPrice,
      status: PAYMENT_STATUS.PENDING,
      method: 'qr',
      referenceCode: `ORD-${reservationId}-${Date.now()}`
    });

    await payment.save();

    // ===== GENERATE SEPAY QR (MOCK for now) =====
    // In production, call SePay API
    const qrData = {
      paymentId: payment._id,
      amount: payment.amount,
      accountNumber: SEPAY_ACCOUNT,
      bankCode: SEPAY_BANK_CODE,
      description: payment.referenceCode,
      qrUrl: `https://qr.sepay.vn/img?acc=${SEPAY_ACCOUNT}&bank=${SEPAY_BANK_CODE}&amount=${payment.amount}&des=${payment.referenceCode}&template=compact`
    };

    payment.qrData = qrData;
    await payment.save();

    await payment.populate('reservationId');

    res.status(201).json(
      formatSuccess(
        {
          _id: payment._id,
          amount: payment.amount,
          referenceCode: payment.referenceCode,
          qrUrl: qrData.qrUrl,
          bankCode: SEPAY_BANK_CODE,
          accountNumber: SEPAY_ACCOUNT
        },
        'Payment created - please scan QR code to transfer'
      )
    );
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json(
      formatError('Failed to create payment: ' + error.message)
    );
  }
};

/**
 * SePay Webhook - POST /payments/webhook
 * Receives payment confirmation from SePay
 * ⚠️ CRITICAL - Verify signature to prevent tampering
 */
exports.sepayWebhook = async (req, res) => {
  try {
    console.log('SePay Webhook received:', req.body);

    const { signature } = req.headers;
    const body = JSON.stringify(req.body);

    // ===== VERIFY SIGNATURE (SECURITY CRITICAL) =====
    if (!signature || !WEBHOOK_SECRET) {
      return res.status(400).json(
        formatError('Missing webhook signature or secret')
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Webhook signature verification failed!');
      return res.status(403).json(
        formatError('Invalid webhook signature')
      );
    }

    const { transaction_id, amount, reference_code, status: txStatus } = req.body;

    // ===== IDEMPOTENCY CHECK (Prevent duplicate processing) =====
    const existingPayment = await Payment.findOne({ transactionId: transaction_id });
    if (existingPayment) {
      if (existingPayment.status === PAYMENT_STATUS.PAID) {
        console.log('Duplicate webhook - payment already processed');
        return res.status(200).json(
          formatSuccess(null, 'Payment already processed')
        );
      }
    }

    // ===== FIND PAYMENT BY REFERENCE CODE =====
    const payment = await Payment.findOne({ referenceCode: reference_code });
    if (!payment) {
      return res.status(404).json(
        formatError('Payment not found')
      );
    }

    // ===== VALIDATE AMOUNT =====
    if (amount !== payment.amount) {
      return res.status(400).json(
        formatError('Amount mismatch')
      );
    }

    // ===== UPDATE PAYMENT STATUS =====
    if (txStatus === 'completed') {
      payment.status = PAYMENT_STATUS.PAID;
      payment.transactionId = transaction_id;
      payment.webhookData = req.body;
      await payment.save();

      // ===== CONFIRM RESERVATION =====
      const reservation = await Reservation.findById(payment.reservationId);
      if (reservation) {
        reservation.status = APPOINTMENT_STATUS.CONFIRMED;
        await reservation.save();

        // ===== SEND NOTIFICATION TO CUSTOMER =====
        await Message.create({
          sender: null,
          receiver: payment.customerId,
          subject: 'Payment confirmed',
          content: `Your payment of ${payment.amount} VND has been received. Your appointment is confirmed.`,
          type: 'notification'
        });

        // ===== SEND NOTIFICATION TO BARBER =====
        await Message.create({
          sender: null,
          receiver: reservation.barberId,
          subject: 'Appointment payment received',
          content: `Payment received for customer appointment on ${reservation.appointmentDate}`,
          type: 'notification'
        });
      }

      return res.status(200).json(
        formatSuccess(null, 'Payment processed successfully')
      );
    } else if (txStatus === 'failed' || txStatus === 'cancelled') {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save();

      return res.status(200).json(
        formatSuccess(null, 'Payment failed or cancelled')
      );
    }

    res.status(200).json(
      formatSuccess(null, 'Webhook processed')
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json(
      formatError('Webhook processing failed: ' + error.message)
    );
  }
};

/**
 * Check Payment Status - GET /payments/:id/status
 * Check current payment status
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('reservationId', 'appointmentDate appointmentTime')
      .populate('customerId', 'name email');

    if (!payment) {
      return res.status(404).json(
        formatError('Payment not found')
      );
    }

    res.status(200).json(
      formatSuccess(
        {
          paymentId: payment._id,
          status: payment.status,
          amount: payment.amount,
          referenceCode: payment.referenceCode,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt
        },
        'Payment status retrieved'
      )
    );
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json(
      formatError('Failed to check payment status: ' + error.message)
    );
  }
};

/**
 * Refund Payment - POST /payments/:id/refund
 * Admin/System initiates refund
 */
exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json(
        formatError('Payment not found')
      );
    }

    // Only paid payments can be refunded
    if (payment.status !== PAYMENT_STATUS.PAID) {
      return res.status(400).json(
        formatError(`Can only refund paid payments`)
      );
    }

    payment.status = PAYMENT_STATUS.REFUNDED;
    payment.refundReason = reason || '';
    await payment.save();

    // ===== SEND NOTIFICATION =====
    await Message.create({
      sender: null,
      receiver: payment.customerId,
      subject: 'Refund processed',
      content: `Your refund of ${payment.amount} VND has been processed. Reason: ${reason}`,
      type: 'notification'
    });

    res.status(200).json(
      formatSuccess(payment, 'Payment refunded successfully')
    );
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json(
      formatError('Failed to refund payment: ' + error.message)
    );
  }
};
