// ============================================
// ROLE.JS - ROLE MODEL SCHEMA
// ============================================
const mongoose = require('mongoose');
const { ROLES, PERMISSIONS } = require('../config/constants');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: Object.values(ROLES),
    required: true,
    unique: true
  },
  
  permissions: {
    type: [String],
    enum: Object.values(PERMISSIONS),
    default: []
  },
  
  description: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Role', roleSchema);
