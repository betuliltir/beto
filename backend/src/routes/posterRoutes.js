const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const posterController = require('../controllers/posterController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

router.post('/', protect, upload.single('poster'), posterController.uploadPoster);
router.get('/', protect, posterController.getPosters);
router.patch('/:id', protect, posterController.updatePoster);

module.exports = router; 