const Poster = require('../models/Poster');
const path = require('path');

exports.uploadPoster = async (req, res) => {
  try {
    const { clubName } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;
    const poster = new Poster({
      clubName,
      fileUrl,
      submittedBy: req.user._id,
    });
    await poster.save();
    res.status(201).json(poster);
  } catch (err) {
    res.status(500).json({ message: 'Poster upload failed', error: err.message });
  }
};

exports.getPosters = async (req, res) => {
  try {
    let posters;
    if (req.user.role === 'clubAdmin') {
      posters = await Poster.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'universityAdmin') {
      posters = await Poster.find().sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(posters);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posters', error: err.message });
  }
};

exports.updatePoster = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const poster = await Poster.findById(req.params.id);
    if (!poster) return res.status(404).json({ message: 'Poster not found' });
    if (status) poster.status = status;
    if (feedback !== undefined) poster.feedback = feedback;
    await poster.save();
    res.json(poster);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update poster', error: err.message });
  }
}; 