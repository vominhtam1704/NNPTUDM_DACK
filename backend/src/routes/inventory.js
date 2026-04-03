const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items (admin only)
 * @access  Protected (Admin)
 */
router.get(
  '/',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  inventoryController.getAllInventory
);

/**
 * @route   GET /api/inventory/:id
 * @desc    Get inventory item by ID
 * @access  Protected (Admin)
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  inventoryController.getInventoryById
);

/**
 * @route   POST /api/inventory
 * @desc    Create new inventory item
 * @access  Protected (Admin)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  inventoryController.createInventoryItem
);

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update inventory item
 * @access  Protected (Admin)
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  inventoryController.updateInventoryItem
);

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete inventory item
 * @access  Protected (Admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  inventoryController.deleteInventoryItem
);

/**
 * @route   PUT /api/inventory/:id/adjust-stock
 * @desc    Adjust inventory quantity
 * @access  Protected (Admin)
 */
router.put(
  '/:id/adjust-stock',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  inventoryController.adjustStock
);

module.exports = router;
