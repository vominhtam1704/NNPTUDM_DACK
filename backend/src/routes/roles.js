// ============================================
// ROLES.JS - ROLE MANAGEMENT ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

/**
 * @route   GET /api/roles
 * @desc    Get all roles
 * @access  Protected (Admin)
 */
router.get(
  '/',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  roleController.getAllRoles
);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Protected (Admin)
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  roleController.getRoleById
);

/**
 * @route   POST /api/roles
 * @desc    Create new role
 * @access  Protected (Admin)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  roleController.createRole
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 * @access  Protected (Admin)
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  roleController.updateRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role
 * @access  Protected (Admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  roleController.deleteRole
);

/**
 * @route   POST /api/roles/:id/permissions
 * @desc    Add permission to role
 * @access  Protected (Admin)
 */
router.post(
  '/:id/permissions',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  roleController.addPermission
);

/**
 * @route   DELETE /api/roles/:id/permissions/:permission
 * @desc    Remove permission from role
 * @access  Protected (Admin)
 */
router.delete(
  '/:id/permissions/:permission',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  roleController.removePermission
);

module.exports = router;
