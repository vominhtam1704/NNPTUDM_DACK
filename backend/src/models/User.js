// ============================================
// USER.JS - USER MODEL SCHEMA
// ============================================
const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return password by default
  },
  
  phone: {
    type: String,
    trim: true
  },

  address: {
    type: String,
    trim: true,
    default: ''
  },

  birthDate: {
    type: Date,
    default: null
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  
  avatar: {
    type: String, // URL to avatar image
    default: null
  },
  
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.CUSTOMER
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  bio: {
    type: String, // For barbers
    default: null
  },

  loyaltyPoints: {
    type: Number,
    default: 0
  },

  membershipTier: {
    type: String,
    default: 'Standard'
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

// Index for frequently queried fields
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
