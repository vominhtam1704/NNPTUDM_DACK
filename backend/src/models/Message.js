// ============================================
// MESSAGE.JS - MESSAGE/NOTIFICATION MODEL
// ============================================
const mongoose = require('mongoose');
const { MESSAGE_TYPE } = require('../config/constants');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  receiverId: {
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

messageSchema.index({ receiverId: 1, isRead: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ reservationId: 1 });

module.exports = mongoose.model('Message', messageSchema);
