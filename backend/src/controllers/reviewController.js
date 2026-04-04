// ============================================
// REVIEWCONTROLLER.JS - REVIEW/RATING MANAGEMENT
// ============================================
const Review = require('../models/Review');
const Reservation = require('../models/Reservation');
const { formatSuccess, formatError, formatPaginated } = require('../utils/response');
const { ROLES } = require('../config/constants');

/**
 * Get All Reviews - GET /reviews
 * Public access - get all reviews with pagination and filters
 */
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, productId, barberId, minRating } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (productId) filter.productId = productId;
    if (barberId) filter.barberId = barberId;
    if (minRating) filter.rating = { $gte: parseInt(minRating) };

    const reviews = await Review.find(filter)
      .populate('reservationId', 'appointmentDate')
      .populate('customerId', 'name avatar')
      .populate('barberId', 'name avatar')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(filter);

    res.status(200).json(
      formatPaginated(reviews, page, limit, total)
    );
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json(
      formatError('Failed to fetch reviews: ' + error.message)
    );
  }
};

/**
 * Get Review by ID - GET /reviews/:id
 */
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reservationId')
      .populate('customerId', 'name avatar')
      .populate('barberId', 'name avatar');

    if (!review) {
      return res.status(404).json(
        formatError('Review not found')
      );
    }

    res.status(200).json(
      formatSuccess(review, 'Review retrieved')
    );
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json(
      formatError('Failed to fetch review: ' + error.message)
    );
  }
};

/**
 * Create Review - POST /reviews
 * Customer only - create review for completed appointment
 */
exports.createReview = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { reservationId, rating, comment, images } = req.body;

    // ===== VALIDATION =====
    if (!reservationId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json(
        formatError('Invalid reservationId or rating (1-5)')
      );
    }

    // ===== VALIDATE RESERVATION =====
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json(
        formatError('Reservation not found')
      );
    }

    if (reservation.customerId.toString() !== customerId) {
      return res.status(403).json(
        formatError('You cannot review this appointment')
      );
    }

    const existingReview = await Review.findOne({ reservationId });
    if (existingReview) {
      return res.status(409).json(
        formatError('You have already reviewed this appointment')
      );
    }

    // ===== CREATE REVIEW =====
    const review = new Review({
      reservationId,
      customerId,
      barberId: reservation.barberId,
      productId: reservation.serviceId,
      rating,
      comment: comment || '',
      images: images || []
    });

    await review.save();
    await review.populate([
      { path: 'reservationId', select: 'appointmentDate' },
      { path: 'customerId', select: 'name avatar' },
      { path: 'barberId', select: 'name avatar' }
    ]);

    res.status(201).json(
      formatSuccess(review, 'Review created successfully')
    );
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json(
      formatError('Failed to create review: ' + error.message)
    );
  }
};

/**
 * Update Review - PUT /reviews/:id
 * Owner only
 */
exports.updateReview = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { rating, comment, images } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json(
        formatError('Review not found')
      );
    }

    if (review.customerId.toString() !== customerId) {
      return res.status(403).json(
        formatError('You can only update your own review')
      );
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images) review.images = images;

    await review.save();
    await review.populate([
      { path: 'reservationId', select: 'appointmentDate' },
      { path: 'customerId', select: 'name avatar' }
    ]);

    res.status(200).json(
      formatSuccess(review, 'Review updated successfully')
    );
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json(
      formatError('Failed to update review: ' + error.message)
    );
  }
};

/**
 * Delete Review - DELETE /reviews/:id
 * Owner or Admin
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json(
        formatError('Review not found')
      );
    }

    if (
      review.customerId.toString() !== req.user.userId &&
      req.user.role !== ROLES.ADMIN
    ) {
      return res.status(403).json(
        formatError('You cannot delete this review')
      );
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json(
      formatSuccess(null, 'Review deleted successfully')
    );
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json(
      formatError('Failed to delete review: ' + error.message)
    );
  }
};
