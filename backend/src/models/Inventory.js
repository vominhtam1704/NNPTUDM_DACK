// ============================================
// INVENTORY.JS - INVENTORY MODEL
// ============================================
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true
  },
  
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Quantity cannot be negative']
  },
  
  unit: {
    type: String, // e.g., "bottle", "box", "jar"
    default: 'piece'
  },
  
  minStock: {
    type: Number, // Alert when quantity drops below this
    default: 10
  },
  
  supplier: String,
  
  purchasePrice: Number, // Cost price for accounting
  
  images: {
    type: [String],
    default: []
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

inventorySchema.index({ sku: 1 });

inventorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
