const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema({
  clubName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Requested Change'],
    default: 'Pending',
  },
  feedback: { type: String },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Poster', posterSchema);
