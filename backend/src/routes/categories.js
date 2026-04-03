// ============================================
// CATEGORIES.JS - CATEGORY MANAGEMENT ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

/**
 * @route   GET /api/categories?parentId=id&search=name
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route   GET /api/categories/tree/all
 * @desc    Get categories in tree structure (nested)
 * @access  Public
 */
router.get('/tree/all', categoryController.getCategoryTree);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Protected (Admin)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  categoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Protected (Admin)
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Protected (Admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  categoryController.deleteCategory
);

module.exports = router;
