// ============================================
// USERCONTROLLER.JS - USER MANAGEMENT
// ============================================
const User = require('../models/User');
const { formatSuccess, formatError, formatPaginated } = require('../utils/response');
const { hashPassword } = require('../utils/password');

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
    const { name, phone, avatar, bio } = req.body;

    // ===== VALIDATION =====
    if (!name && !phone && !avatar && !bio) {
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

    // ===== DELETE OLD AVATAR FILE =====
    const path = require('path');
    const fs = require('fs');
    const user = await User.findById(userId);
    if (user && user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(__dirname, `..${user.avatar}`);
      if (fs.existsSync(oldAvatarPath)) {
        try {
          fs.unlinkSync(oldAvatarPath);
        } catch (err) {
          console.error('Error deleting old avatar:', err);
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json(
        formatError('User not found')
      );
    }

    res.status(200).json(
      formatSuccess(user, 'Avatar uploaded successfully')
    );
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json(
      formatError('Failed to upload avatar: ' + error.message)
    );
  }
};
