// ============================================
// MULTER.JS - FILE UPLOAD MIDDLEWARE
// ============================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== CREATE UPLOADS DIRECTORY IF NOT EXISTS ==========
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ========== STORAGE CONFIGURATION ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Format: timestamp-fieldname-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// ========== FILE FILTER ==========
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
  }
};

// ========== MULTER INSTANCE - SINGLE IMAGE ==========
const uploadSingle = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB max
  }
});

// ========== MULTER INSTANCE - MULTIPLE IMAGES ==========
const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB per file
    files: 10  // Max 10 files
  }
});

module.exports = {
  uploadSingle,
  uploadMultiple
};
