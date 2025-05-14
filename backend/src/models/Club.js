// backend/src/models/Club.js
const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    trim: true
  },
  clubImage: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Üyeleri tutmak için dizi ekleyin
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Enable virtuals in JSON and Object output
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for member count
clubSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

module.exports = mongoose.model('Club', clubSchema);