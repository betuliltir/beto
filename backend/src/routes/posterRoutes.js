const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const posterController = require('../controllers/posterController');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp
    cb(null, Date.now() + '-' + file.originalname);
  },
});

// Configure upload options
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: JPEG, PNG, GIF, PDF'), false);
    }
  }
});

// Routes
router.post('/', protect, upload.single('poster'), posterController.uploadPoster);
router.get('/', protect, posterController.getPosters);
router.patch('/:id', protect, posterController.updatePoster);

module.exports = router;