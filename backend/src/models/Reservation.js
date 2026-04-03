// ============================================
// RESERVATION.JS - RESERVATION (APPOINTMENT) MODEL ⭐
// ============================================
const mongoose = require('mongoose');
const { APPOINTMENT_STATUS } = require('../config/constants');

const reservationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Barber is required']
  },
  
  serviceIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Product',
    required: [true, 'At least one service is required']
  },
  
  date: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  
  timeSlot: {
    type: String, // e.g., "09:00-09:30"
    required: [true, 'Time slot is required']
  },
  
  status: {
    type: String,
    enum: Object.values(APPOINTMENT_STATUS),
    default: APPOINTMENT_STATUS.PENDING
  },
  
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  note: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// CRITICAL: Unique constraint to prevent double-booking
reservationSchema.index(
  { barberId: 1, date: 1, timeSlot: 1 },
  { unique: true, sparse: true }
);

// Indexes for common queries
reservationSchema.index({ customerId: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ date: 1 });

reservationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
