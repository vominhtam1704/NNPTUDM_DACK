// ============================================
// CATEGORY.JS - CATEGORY MODEL
// ============================================
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  description: String,
  
  image: String, // Category image URL
  
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null // For nested categories
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

categorySchema.index({ slug: 1 });
categorySchema.index({ parentId: 1 });

module.exports = mongoose.model('Category', categorySchema);
