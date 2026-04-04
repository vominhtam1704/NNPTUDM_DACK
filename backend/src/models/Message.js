// ============================================
// MESSAGE.JS - MESSAGE/NOTIFICATION MODEL
// ============================================
const mongoose = require('mongoose');
const { MESSAGE_TYPE } = require('../config/constants');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  content: {
    type: String,
    required: [true, 'Message content is required']
  },
  
  type: {
    type: String,
    enum: Object.values(MESSAGE_TYPE),
    default: MESSAGE_TYPE.NOTIFICATION
  },
  
  isRead: {
    type: Boolean,
    default: false
  },
  
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ reservationId: 1 });

module.exports = mongoose.model('Message', messageSchema);
