const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middlewares/auth');

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews with pagination
 * @access  Public
 */
router.get('/', reviewController.getAllReviews);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get single review
 * @access  Public
 */
router.get('/:id', reviewController.getReviewById);

/**
 * @route   POST /api/reviews
 * @desc    Create review for completed appointment
 * @access  Protected
 */
router.post('/', authenticateToken, reviewController.createReview);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update review
 * @access  Protected (owner only)
 */
router.put('/:id', authenticateToken, reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @access  Protected (owner or admin)
 */
router.delete('/:id', authenticateToken, reviewController.deleteReview);

module.exports = router;
