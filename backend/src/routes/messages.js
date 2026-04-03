const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @route   GET /api/messages
 * @desc    Get current user's messages/notifications
 * @access  Protected
 */
router.get('/', authenticateToken, messageController.getMessages);

/**
 * @route   GET /api/messages/:id
 * @desc    Get single message
 * @access  Protected
 */
router.get('/:id', authenticateToken, messageController.getMessageById);

/**
 * @route   POST /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Protected
 */
router.post('/:id/read', authenticateToken, messageController.markAsRead);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete message
 * @access  Protected
 */
router.delete('/:id', authenticateToken, messageController.deleteMessage);

module.exports = router;
