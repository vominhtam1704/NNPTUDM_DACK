// ============================================
// REVIEW.JS - REVIEW MODEL
// ============================================
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product/Service is required']
  },
  
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true,
    unique: true // One review per reservation
  },
  
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  
  images: {
    type: [String],
    default: []
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for queries
reviewSchema.index({ barberId: 1 });
reviewSchema.index({ productId: 1 });
reviewSchema.index({ rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);
