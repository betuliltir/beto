const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const clubController = require('../controllers/clubController');
const Club = require('../models/Club'); // Import the Club model for the test route

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
router.get('/', protect, clubController.getClubs);
router.post('/', protect, upload.single('clubImage'), clubController.createClub);

// Test route for debugging deletion issues - place before other parameterized routes
router.get('/test-delete/:id', protect, async (req, res) => {
  try {
    console.log('Test delete route - User:', req.user);
    console.log('Test delete route - User role:', req.user.role);
    console.log('Test delete route - Club ID:', req.params.id);
    
    // Find the club
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Club not found in test route' });
    }
    
    console.log('Test delete route - Club found:', club);
    
    // Delete without additional checks
    await Club.findByIdAndDelete(req.params.id);
    console.log('Test delete route - Club deleted successfully');
    
    res.status(200).json({ message: 'Club deleted successfully via test route' });
  } catch (error) {
    console.error('Error in test-delete:', error);
    res.status(500).json({ message: 'Error in test route', error: error.message });
  }
});

router.get('/:id', protect, clubController.getClub);
router.patch('/:id', protect, upload.single('clubImage'), clubController.updateClub);
router.delete('/:id', protect, clubController.deleteClub);

module.exports = router;