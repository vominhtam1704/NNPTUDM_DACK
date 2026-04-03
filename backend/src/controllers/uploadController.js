// ============================================
// UPLOADCONTROLLER.JS - FILE UPLOAD HANDLING
// ============================================
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { formatSuccess, formatError } = require('../utils/response');

/**
 * Upload Product Images - POST /uploads/products
 * Upload multiple images for a product
 */
exports.uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(
        formatError('No files uploaded')
      );
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    res.status(200).json(
      formatSuccess(
        { images: imageUrls },
        'Product images uploaded successfully'
      )
    );
  } catch (error) {
    console.error('Upload product images error:', error);
    if (req.files) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, `../uploads/${file.filename}`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }
    res.status(500).json(
      formatError('Failed to upload images: ' + error.message)
    );
  }
};

/**
 * Upload User Avatar - POST /uploads/avatar
 * Upload single image for user avatar
 */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        formatError('No file uploaded')
      );
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const userId = req.user._id;
    
    // Delete old avatar if exists
    const user = await User.findById(userId);
    if (user && user.avatar) {
      const oldAvatarPath = path.join(__dirname, `../uploads/${path.basename(user.avatar)}`);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json(
      formatSuccess(
        { avatar: avatarUrl, user: updatedUser },
        'Avatar uploaded successfully'
      )
    );
  } catch (error) {
    console.error('Upload avatar error:', error);
    if (req.file) {
      const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.status(500).json(
      formatError('Failed to upload avatar: ' + error.message)
    );
  }
};

/**
 * Upload Category Image - POST /uploads/categories
 * Upload single image for category
 */
exports.uploadCategoryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        formatError('No file uploaded')
      );
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(200).json(
      formatSuccess(
        { image: imageUrl },
        'Category image uploaded successfully'
      )
    );
  } catch (error) {
    console.error('Upload category image error:', error);
    if (req.file) {
      const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.status(500).json(
      formatError('Failed to upload category image: ' + error.message)
    );
  }
};

/**
 * Delete Image - DELETE /uploads/:filename
 * Delete an uploaded image
 */
exports.deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json(
        formatError('Invalid filename')
      );
    }

    const filePath = path.join(__dirname, `../uploads/${filename}`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json(
        formatSuccess({ filename }, 'Image deleted successfully')
      );
    } else {
      res.status(404).json(
        formatError('Image not found')
      );
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json(
      formatError('Failed to delete image: ' + error.message)
    );
  }
};

/**
 * Get Image Info - GET /uploads/info/:filename
 * Get information about an uploaded image
 */
exports.getImageInfo = async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json(
        formatError('Invalid filename')
      );
    }

    const filePath = path.join(__dirname, `../uploads/${filename}`);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.status(200).json(
        formatSuccess(
          {
            filename,
            size: stats.size,
            url: `/uploads/${filename}`,
            uploadedAt: stats.birthtime
          },
          'Image info retrieved successfully'
        )
      );
    } else {
      res.status(404).json(
        formatError('Image not found')
      );
    }
  } catch (error) {
    console.error('Get image info error:', error);
    res.status(500).json(
      formatError('Failed to get image info: ' + error.message)
    );
  }
};
