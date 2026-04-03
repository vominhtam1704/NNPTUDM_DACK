// ============================================
// CART.JS - CART MODEL
// ============================================
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true // Price captured at time of add
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  items: {
    type: [cartItemSchema],
    default: []
  },
  
  totalAmount: {
    type: Number,
    default: 0
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

cartSchema.index({ userId: 1 });

cartSchema.pre('save', function(next) {
  // Recalculate total on save
  this.totalAmount = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
