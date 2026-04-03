// ============================================
// CARTS.JS - SHOPPING CART ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @route   GET /api/carts/me
 * @desc    Get current user's cart
 * @access  Protected
 */
router.get('/me', authenticateToken, cartController.getMyCart);

/**
 * @route   GET /api/carts/total
 * @desc    Get cart total amount
 * @access  Protected
 */
router.get('/total', authenticateToken, cartController.getCartTotal);

/**
 * @route   POST /api/carts/items
 * @desc    Add item to cart
 * @access  Protected
 */
router.post('/items', authenticateToken, cartController.addToCart);

/**
 * @route   PUT /api/carts/items/:itemId
 * @desc    Update cart item quantity
 * @access  Protected
 */
router.put('/items/:itemId', authenticateToken, cartController.updateCartItem);

/**
 * @route   DELETE /api/carts/items/:itemId
 * @desc    Remove item from cart
 * @access  Protected
 */
router.delete('/items/:itemId', authenticateToken, cartController.removeFromCart);

/**
 * @route   DELETE /api/carts
 * @desc    Clear entire cart
 * @access  Protected
 */
router.delete('/', authenticateToken, cartController.clearCart);

module.exports = router;
