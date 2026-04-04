// ============================================
// PAYMENT.JS - PAYMENT MODEL 💳
// ============================================
const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_METHOD } = require('../config/constants');

const paymentSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: [true, 'Reservation is required'],
    unique: true
  },
  
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  
  referenceCode: {
    type: String,
    required: [true, 'Reference code is required'],
    unique: true
  },
  
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  
  method: {
    type: String,
    enum: Object.values(PAYMENT_METHOD),
    required: [true, 'Payment method is required']
  },
  
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  
  transactionId: {
    type: String, // SePay transaction ID
    unique: true,
    sparse: true
  },
  
  qrCode: String, // QR image URL for SePay
  
  webhookData: mongoose.Schema.Types.Mixed, // Store full webhook response
  
  paidAt: Date,
  
  failureReason: String, // If payment failed
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.index({ reservationId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
