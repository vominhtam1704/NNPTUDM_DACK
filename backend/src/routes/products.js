// ============================================
// PRODUCTS.JS - PRODUCT MANAGEMENT ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/multer');
const { ROLES } = require('../config/constants');

/**
 * @route   GET /api/products?page=1&limit=10&category=id&search=name
 * @desc    Get all products
 * @access  Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route   GET /api/products/category/:categoryId
 * @desc    Get products by category
 * @access  Public
 */
router.get('/category/:categoryId', productController.getProductsByCategory);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Protected (Admin)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  uploadSingle.single('image'),
  productController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Protected (Admin)
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  uploadSingle.single('image'),
  productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Protected (Admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole([ROLES.ADMIN]),
  productController.deleteProduct
);

module.exports = router;
