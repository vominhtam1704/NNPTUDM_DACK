// ============================================
// MESSAGECONTROLLER.JS - MESSAGE/NOTIFICATION MANAGEMENT
// ============================================
const mongoose = require('mongoose');
const Message = require('../models/Message');
const { formatSuccess, formatError, formatPaginated } = require('../utils/response');

/**
 * Get User Messages - GET /messages
 * Get current user's messages/notifications with pagination and filters
 */
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, read } = req.query;
    const skip = (page - 1) * limit;

    console.log('Fetching messages for user:', req.user.userId);
    const filter = { receiver: new mongoose.Types.ObjectId(req.user.userId) };
    if (type) filter.type = type;
    if (read !== undefined) filter.isRead = read === 'true';

    const messages = await Message.find(filter)
      .populate('sender', 'name avatar')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Message.countDocuments(filter);

    res.status(200).json(
      formatPaginated(messages, page, limit, total)
    );
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json(
      formatError('Failed to fetch messages: ' + error.message)
    );
  }
};

/**
 * Get Message by ID - GET /messages/:id
 */
exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name avatar');

    if (!message) {
      return res.status(404).json(
        formatError('Message not found')
      );
    }

    // Mark as read if it's for the current user
    if (!message.isRead && message.receiver.toString() === req.user.userId) {
      message.isRead = true;
      await message.save();
    }

    res.status(200).json(
      formatSuccess(message, 'Message retrieved')
    );
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json(
      formatError('Failed to fetch message: ' + error.message)
    );
  }
};

/**
 * Mark Message as Read - POST /messages/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, receiver: req.user.userId },
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json(
        formatError('Message not found or unauthorized')
      );
    }

    res.status(200).json(
      formatSuccess(message, 'Message marked as read')
    );
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json(
      formatError('Failed to mark message: ' + error.message)
    );
  }
};

/**
 * Delete Message - DELETE /messages/:id
 */
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.id,
      receiver: req.user.userId
    });

    if (!message) {
      return res.status(404).json(
        formatError('Message not found or unauthorized')
      );
    }

    res.status(200).json(
      formatSuccess(null, 'Message deleted')
    );
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json(
      formatError('Failed to delete message: ' + error.message)
    );
  }
};
