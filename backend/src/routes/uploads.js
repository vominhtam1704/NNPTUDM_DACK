// ============================================
// UPLOADS.JS - FILE UPLOAD ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { authenticate } = require('../middlewares/auth');
const uploadCtrl = require('../controllers/uploadController');

// ===== MULTER CONFIGURATION =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
  }
};

const uploadSingle = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }
});

/**
 * [INFO] UPLOAD ROUTES - File Upload Management
 */

// ========== PRODUCT IMAGES ==========
router.post(
  '/products',
  authenticate,
  uploadMultiple.array('images', 10),
  uploadCtrl.uploadProductImages
);

// ========== USER AVATAR ==========
router.post(
  '/avatar',
  authenticate,
  uploadSingle.single('avatar'),
  uploadCtrl.uploadAvatar
);

// ========== CATEGORY IMAGE ==========
router.post(
  '/categories',
  authenticate,
  uploadSingle.single('image'),
  uploadCtrl.uploadCategoryImage
);

// ========== DELETE IMAGE ==========
router.delete(
  '/:filename',
  authenticate,
  uploadCtrl.deleteImage
);

// ========== GET IMAGE INFO ==========
router.get(
  '/info/:filename',
  uploadCtrl.getImageInfo
);

module.exports = router;
