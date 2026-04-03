// ============================================
// USERS.JS - USER MANAGEMENT ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

/**
 * @route   GET /api/users?page=1&limit=10&role=barber&search=john
 * @desc    Get all users (admin only)
 * @access  Protected (Admin)
 */
router.get(
  '/',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Protected
 */
router.get('/:id', authenticateToken, userController.getUserById);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get all users by role (e.g., all barbers)
 * @access  Protected
 */
router.get(
  '/role/:role',
  authenticateToken,
  userController.getUsersByRole
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Protected (self or admin)
 */
router.put('/:id', authenticateToken, userController.updateUser);

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Change user password
 * @access  Protected
 */
router.put('/:id/change-password', authenticateToken, userController.changePassword);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Protected (Admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  userController.deleteUser
);

/**
 * @route   PUT /api/users/profile/avatar
 * @desc    Upload user avatar
 * @access  Protected
 */
const { uploadSingle } = require('../middlewares/multer');
router.put(
  '/profile/avatar',
  authenticateToken,
  uploadSingle.single('avatar'),
  userController.uploadAvatar
);

module.exports = router;
