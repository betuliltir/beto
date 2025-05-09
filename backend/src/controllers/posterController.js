const Poster = require('../models/Poster');
const path = require('path');
const fs = require('fs');

exports.uploadPoster = async (req, res) => {
  try {
    const { clubName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      // Remove the file if it's too large
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File size exceeds the 5MB limit' });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Remove the file if it's not an allowed type
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'Invalid file type. Allowed types: JPEG, PNG, GIF, PDF' 
      });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    const poster = new Poster({
      clubName,
      fileUrl,
      submittedBy: req.user._id,
    });
    
    await poster.save();
    res.status(201).json(poster);
  } catch (err) {
    console.error('Poster upload failed:', err);
    // If there was a file uploaded but an error occurred, remove the file
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Poster upload failed', error: err.message });
  }
};

exports.getPosters = async (req, res) => {
  try {
    let posters;
    
    // Different queries based on user role
    if (req.user.role === 'clubAdmin') {
      // Club admins can only see their own submissions
      posters = await Poster.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'universityAdmin') {
      // University admins can see all posters
      posters = await Poster.find().sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Not authorized to view posters' });
    }
    
    res.json(posters);
  } catch (err) {
    console.error('Get posters failed:', err);
    res.status(500).json({ message: 'Failed to fetch posters', error: err.message });
  }
};

exports.updatePoster = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    
    // Validate user role
    if (req.user.role !== 'universityAdmin') {
      return res.status(403).json({ message: 'Only university admins can update poster status' });
    }
    
    // Validate poster status
    if (status && !['Pending', 'Approved', 'Requested Change'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // If status is 'Requested Change', feedback is required
    if (status === 'Requested Change' && (!feedback || feedback.trim() === '')) {
      return res.status(400).json({ message: 'Feedback is required when requesting changes' });
    }
    
    const poster = await Poster.findById(req.params.id);
    
    if (!poster) {
      return res.status(404).json({ message: 'Poster not found' });
    }
    
    // Update poster fields
    if (status) poster.status = status;
    if (feedback !== undefined) poster.feedback = feedback;
    
    await poster.save();
    res.json(poster);
  } catch (err) {
    console.error('Update poster failed:', err);
    res.status(500).json({ message: 'Failed to update poster', error: err.message });
  }
};