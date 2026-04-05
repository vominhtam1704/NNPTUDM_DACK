// ============================================
// USERCONTROLLER.JS - USER MANAGEMENT
// ============================================
const User = require('../models/User');
const Review = require('../models/Review');
const Reservation = require('../models/Reservation');
const Product = require('../models/Product');
const { formatSuccess, formatError, formatPaginated } = require('../utils/response');
const { hashPassword } = require('../utils/password');
const { ROLES, APPOINTMENT_STATUS, TIME_SLOTS } = require('../config/constants');

/**
 * Get All Users - GET /users
 * Admin only - list all users with pagination and filters
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    // ===== BUILD FILTER =====
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // ===== FETCH DATA =====
    const users = await User.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password')
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json(
      formatPaginated(users, page, limit, total)
    );
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json(
      formatError('Failed to fetch users: ' + error.message)
    );
  }
};

/**
 * Get User by ID - GET /users/:id
 * Get single user profile
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json(
        formatError('User not found')
      );
    }

    res.status(200).json(
      formatSuccess(user, 'User retrieved successfully')
    );
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json(
      formatError('Failed to fetch user: ' + error.message)
    );
  }
};

/**
 * Update User - PUT /users/:id
 * Update user profile (name, phone, avatar, bio)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, avatar, bio, address, birthDate, gender } = req.body;

    // ===== VALIDATION =====
    if (!name && !phone && !avatar && !bio && address === undefined && birthDate === undefined && gender === undefined) {
      return res.status(400).json(
        formatError('No fields to update')
      );
    }

    // ===== BUILD UPDATE OBJECT =====
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;
    if (bio) updateData.bio = bio;
    if (address !== undefined) updateData.address = address;
    if (birthDate !== undefined) updateData.birthDate = birthDate || null;
    if (gender !== undefined) updateData.gender = gender;

    // ===== UPDATE USER =====
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json(
        formatError('User not found')
      );
    }

    res.status(200).json(
      formatSuccess(user, 'User updated successfully')
    );
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json(
      formatError('Failed to update user: ' + error.message)
    );
  }
};

/**
 * Delete User - DELETE /users/:id
 * Admin only - soft delete user (set isActive = false)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (req.user.userId === id) {
      return res.status(400).json(
        formatError('Cannot delete your own account')
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json(
        formatError('User not found')
      );
    }

    res.status(200).json(
      formatSuccess(null, 'User deleted successfully')
    );
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json(
      formatError('Failed to delete user: ' + error.message)
    );
  }
};

/**
 * Change Password - PUT /users/:id/change-password
 * User can change their own password
 */
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ===== VALIDATION =====
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json(
        formatError('All password fields are required')
      );
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json(
        formatError('New passwords do not match')
      );
    }

    // ===== FIND USER =====
    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json(
        formatError('User not found')
      );
    }

    // ===== VERIFY CURRENT PASSWORD =====
    const { comparePassword } = require('../utils/password');
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(
        formatError('Current password is incorrect')
      );
    }

    // ===== UPDATE PASSWORD =====
    user.password = await hashPassword(newPassword);
    await user.save();

    res.status(200).json(
      formatSuccess(null, 'Password changed successfully')
    );
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(
      formatError('Failed to change password: ' + error.message)
    );
  }
};

/**
 * Get Users by Role - GET /users/role/:role
 * Get all users of specific role (e.g., all barbers)
 */
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find({ role, isActive: true })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password')
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ role, isActive: true });

    res.status(200).json(
      formatPaginated(users, page, limit, total)
    );
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json(
      formatError('Failed to fetch users: ' + error.message)
    );
  }
};

exports.getPublicBarbers = async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const barbers = await User.find({ role: ROLES.BARBER, isActive: true })
      .select('name avatar bio createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    const barberIds = barbers.map((barber) => barber._id);

    const [reviewStats, reservationStats, recentReviews] = await Promise.all([
      Review.aggregate([
        { $match: { barberId: { $in: barberIds } } },
        {
          $group: {
            _id: '$barberId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      Reservation.aggregate([
        { $match: { barberId: { $in: barberIds }, status: { $in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.DONE] } } },
        {
          $group: {
            _id: '$barberId',
            totalAppointments: { $sum: 1 },
          },
        },
      ]),
      Review.find({ barberId: { $in: barberIds } })
        .populate('customerId', 'name')
        .sort({ createdAt: -1 })
        .limit(Math.max(parseInt(limit, 10) * 2, 6))
        .lean(),
    ]);

    const reviewMap = new Map(reviewStats.map((item) => [item._id.toString(), item]));
    const reservationMap = new Map(reservationStats.map((item) => [item._id.toString(), item]));
    const reviewPreviewMap = recentReviews.reduce((map, review) => {
      const key = review.barberId?.toString();
      if (!key || map.has(key)) {
        return map;
      }
      map.set(key, {
        comment: review.comment || '',
        customerName: review.customerId?.name || 'Khach hang',
        rating: review.rating,
      });
      return map;
    }, new Map());

    const data = barbers.map((barber) => {
      const review = reviewMap.get(barber._id.toString());
      const reservations = reservationMap.get(barber._id.toString());
      const preview = reviewPreviewMap.get(barber._id.toString());
      const bio = barber.bio || 'Tho cat toc chuyen nghiep voi phong cach hien dai va tu van tan tam.';

      return {
        _id: barber._id,
        name: barber.name,
        avatar: barber.avatar,
        bio,
        rating: review ? Number(review.averageRating.toFixed(2)) : 5,
        totalReviews: review?.totalReviews || 0,
        totalAppointments: reservations?.totalAppointments || 0,
        reviewPreview: preview || null,
        tags: bio
          .split(/[,.]/)
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 2),
      };
    });

    res.status(200).json(formatSuccess(data, 'Public barbers retrieved successfully'));
  } catch (error) {
    console.error('Get public barbers error:', error);
    res.status(500).json(formatError('Failed to fetch barbers: ' + error.message));
  }
};

exports.getPublicBarberProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await User.findOne({ _id: id, role: ROLES.BARBER, isActive: true }).select('-password');
    if (!barber) {
      return res.status(404).json(formatError('Barber not found'));
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [reviews, reviewStats, reservations, services] = await Promise.all([
      Review.find({ barberId: id })
        .populate('customerId', 'name avatar')
        .populate('productId', 'name price duration')
        .sort({ createdAt: -1 })
        .limit(3),
      Review.aggregate([
        { $match: { barberId: barber._id } },
        {
          $group: {
            _id: '$barberId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      Reservation.find({ barberId: id }).populate('serviceId', 'name').sort({ appointmentDate: -1 }).limit(200),
      Product.find({ isActive: true }).select('name description price duration thumbnail').sort({ createdAt: -1 }).limit(6),
    ]);

    const statBlock = reviewStats[0] || null;
    const completedAppointments = reservations.filter(
      (item) => item.status === APPOINTMENT_STATUS.DONE || item.status === APPOINTMENT_STATUS.CONFIRMED
    ).length;
    const bookedToday = reservations.filter(
      (item) =>
        item.appointmentDate >= todayStart &&
        item.appointmentDate <= todayEnd &&
        [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED].includes(item.status)
    ).length;

    const specialties = Array.from(
      new Set(
        reservations
          .map((item) => item.serviceId?.name)
          .filter(Boolean)
      )
    ).slice(0, 3);

    const yearsActive = Math.max(1, new Date().getFullYear() - new Date(barber.createdAt).getFullYear() + 1);

    res.status(200).json(
      formatSuccess(
        {
          barber: {
            _id: barber._id,
            name: barber.name,
            avatar: barber.avatar,
            bio: barber.bio,
            phone: barber.phone,
            email: barber.email,
            role: barber.role,
            createdAt: barber.createdAt,
          },
          stats: {
            averageRating: statBlock && statBlock.length > 0 ? Number(statBlock[0].averageRating.toFixed(1)) : 5,
            totalReviews: statBlock && statBlock.length > 0 ? statBlock[0].totalReviews : 0,
            totalAppointments: reservations.length,
            completedAppointments,
            yearsActive,
            availableTodaySlots: Math.max(TIME_SLOTS.length - bookedToday, 0),
          },
          specialties,
          services,
          reviews,
          schedule: [
            { label: 'Thu Hai - Thu Sau', hours: '09:00 - 21:00', isOff: false },
            { label: 'Thu Bay', hours: '08:00 - 22:00', isOff: false },
            { label: 'Chu Nhat', hours: 'Nghi', isOff: true },
          ],
        },
        'Barber profile retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get public barber profile error:', error);
    res.status(500).json(formatError('Failed to fetch barber profile: ' + error.message));
  }
};

/**
 * Upload Avatar - PUT /users/profile/avatar
 * Handle profile picture upload
 */
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json(
        formatError('No file uploaded')
      );
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        formatError('User not found')
      );
    }

    // ===== FILE CLEANUP DISABLED (Tạm tắt để xử lý lỗi 404) =====
    /*
    const path = require('path');
    const fs = require('fs');
    if (user && user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(__dirname, `..${user.avatar}`);
      if (fs.existsSync(oldAvatarPath)) {
        try { fs.unlinkSync(oldAvatarPath); } catch (err) { console.error('Error deleting old avatar:', err); }
      }
    }
    */

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.status(200).json(
      formatSuccess(updatedUser, 'Avatar uploaded successfully')
    );
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json(
      formatError('Failed to upload avatar: ' + error.message)
    );
  }
};
