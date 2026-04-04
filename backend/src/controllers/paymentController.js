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
 * Create E-Pay Payment - POST /payments/epay/checkout
 * Customer initiates payment via real E-Pay gateway
 */
exports.createEPayPayment = async (req, res) => {
  try {
    const { reservationId, returnUrl } = req.body;
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
    const referenceCode = `EPAY-${reservationId.substring(0, 8)}-${Date.now()}`;
    const payment = new Payment({
      reservationId,
      customerId,
      amount: reservation.totalPrice,
      status: PAYMENT_STATUS.PENDING,
      method: 'epay',
      referenceCode: referenceCode
    });

    await payment.save();

    // ===== BUILD EPAY CHECKOUT DATA =====
    // Populate these with actual ePay credentials from .env
    const ePayConfig = {
      merchantId: process.env.EPAY_MERCHANT_ID || 'demo',
      apiKey: process.env.EPAY_API_KEY || 'demo-key',
      secretKey: process.env.EPAY_SECRET_KEY || 'demo-secret',
      returnUrl: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${reservationId}/done`,
      notifyUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/epay/webhook`
    };

    // Return full payment info for frontend to build form
    res.status(201).json(
      formatSuccess(
        {
          _id: payment._id,
          amount: payment.amount,
          referenceCode: payment.referenceCode,
          merchantId: ePayConfig.merchantId,
          returnUrl: ePayConfig.returnUrl,
          notifyUrl: ePayConfig.notifyUrl,
          // Frontend will use these to build the E-Pay form
          ePayApiUrl: process.env.EPAY_CHECKOUT_URL || 'https://checkout.epay.vn/payment'
        },
        'E-Pay payment info generated'
      )
    );
  } catch (error) {
    console.error('Create E-Pay payment error:', error);
    res.status(500).json(
      formatError('Failed to create E-Pay payment: ' + error.message)
    );
  }
};

/**
 * E-Pay Webhook - POST /payments/epay/webhook
 * Receives payment confirmation from E-Pay
 * ⚠️ CRITICAL - Verify signature to prevent tampering
 */
exports.ePayWebhook = async (req, res) => {
  try {
    console.log('E-Pay Webhook received:', req.body);

    const {
      status,
      transaction_id,
      reference_code,
      amount,
      timestamp,
      signature
    } = req.body;

    // ===== VERIFY SIGNATURE (SECURITY CRITICAL) =====
    // In production: Verify the signature using ePay's public key
    // For now: Basic validation
    if (!status || !reference_code || !amount) {
      return res.status(400).json(
        formatError('Invalid webhook payload')
      );
    }

    // ===== FIND PAYMENT BY REFERENCE CODE =====
    const payment = await Payment.findOne({ referenceCode: reference_code });
    if (!payment) {
      return res.status(404).json(
        formatError('Payment not found')
      );
    }

    // ===== VALIDATE AMOUNT =====
    if (Number(amount) !== payment.amount) {
      console.error('Amount mismatch - potential fraud:', { webhookAmount: amount, paymentAmount: payment.amount });
      return res.status(400).json(
        formatError('Amount mismatch')
      );
    }

    // ===== UPDATE PAYMENT STATUS =====
    if (status === 'success' || status === 'completed') {
      // Check if already processed (idempotency)
      if (payment.status === PAYMENT_STATUS.PAID) {
        console.log('Payment already processed');
        return res.status(200).json(
          formatSuccess(null, 'Payment already processed')
        );
      }

      payment.status = PAYMENT_STATUS.PAID;
      payment.transactionId = transaction_id;
      payment.webhookData = req.body;
      await payment.save();

      // ===== CONFIRM RESERVATION =====
      const reservation = await Reservation.findById(payment.reservationId);
      if (reservation) {
        reservation.status = APPOINTMENT_STATUS.CONFIRMED;
        await reservation.save();

        // ===== SEND NOTIFICATIONS =====
        await Message.create({
          sender: null,
          receiver: payment.customerId,
          subject: 'Payment confirmed',
          content: `Your payment of ${payment.amount} VND for appointment has been confirmed. Appointment status: CONFIRMED`,
          type: 'notification'
        });

        await Message.create({
          sender: null,
          receiver: reservation.barberId,
          subject: 'Appointment payment received',
          content: `Payment received for appointment on ${reservation.appointmentDate}. Customer: ${payment.customerId}`,
          type: 'notification'
        });
      }

      return res.status(200).json(
        formatSuccess({ paymentId: payment._id }, 'Payment processed successfully')
      );
    } else if (status === 'failed' || status === 'cancelled') {
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save();

      // Keep reservation in PENDING status for retry
      return res.status(200).json(
        formatSuccess(null, 'Payment failed - reservation still pending')
      );
    }

    res.status(200).json(
      formatSuccess(null, 'Webhook received')
    );
  } catch (error) {
    console.error('E-Pay webhook error:', error);
    res.status(500).json(
      formatError('Webhook processing error: ' + error.message)
    );
  }
};

/**
 * Mock E-Pay Checkout Page - GET /payments/epay/mock-checkout
 * For development/testing only - simulates E-Pay checkout experience
 */
exports.mockEPayCheckout = async (req, res) => {
  try {
    // Handle both GET (req.query) and POST (req.body)
    const { 
      paymentId, 
      amount, 
      order_id, 
      ref_code, 
      return_url 
    } = { ...req.query, ...req.body };

    const transactionCode = ref_code || order_id || 'MOCK-TXN';
    const finalAmount = amount || 0;
    const finalPaymentId = paymentId || '';

    if (!finalAmount) {
      return res.status(400).send('Missing payment parameters (amount)');
    }

    // HTML form for mock E-Pay checkout
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Pay - Mock Checkout</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      color: #667eea;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 24px;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
      font-size: 14px;
    }
    .info-box {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      color: #555;
    }
    .info-row:last-child {
      margin-bottom: 0;
      font-weight: 600;
      color: #667eea;
      font-size: 16px;
      border-top: 1px solid #ddd;
      padding-top: 8px;
      margin-top: 8px;
    }
    .amount {
      color: #667eea;
      font-weight: 700;
    }
    .action-buttons {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .btn {
      flex: 1;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-success {
      background: #10b981;
      color: white;
    }
    .btn-success:hover {
      background: #059669;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
    }
    .btn-cancel {
      background: #ef4444;
      color: white;
    }
    .btn-cancel:hover {
      background: #dc2626;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
    }
    .warning {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 24px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">E-Pay</div>
      <p class="subtitle">Cổng thanh toán an toàn</p>
    </div>

    <div class="warning">
      ⚠️ Đây là trang thanh toán giả lập cho mục đích thử nghiệm. Hãy chọn "Thanh toán thành công" để ngee tục.
    </div>

    <div class="info-box">
      <div class="info-row">
        <span>Mã giao dịch:</span>
        <span>${transactionCode}</span>
      </div>
      <div class="info-row">
        <span>Số tiền thanh toán:</span>
        <span class="amount">${Number(finalAmount).toLocaleString('vi-VN')}đ</span>
      </div>
    </div>

    <div class="action-buttons">
      <button class="btn btn-success" onclick="confirmPayment()">✓ Thanh toán thành công</button>
      <button class="btn btn-cancel" onclick="cancelPayment()">✕ Hủy</button>
    </div>

    <div class="footer">
      <p>Chọn "Thanh toán thành công" để hoàn tất lịch hẹn</p>
    </div>
  </div>

  <script>
    function confirmPayment() {
      // In production, E-Pay would process real payment
      // For mock: just redirect back to return_url
      window.location.href = '${decodeURIComponent(return_url || 'http://localhost:3000/payment/done')}?status=success&paymentId=${finalPaymentId}';
    }

    function cancelPayment() {
      window.location.href = '${decodeURIComponent(return_url || 'http://localhost:3000')}?status=cancelled&paymentId=${finalPaymentId}';
    }
  </script>
</body>
</html>
    `;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Mock E-Pay checkout error:', error);
    res.status(500).send('Error loading checkout page');
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
