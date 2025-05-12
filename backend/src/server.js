const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow your frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Import routes
const authRoutes = require('./routes/authRoutes');
const posterRoutes = require('./routes/posterRoutes');
const clubRoutes = require('./routes/clubRoutes');

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Simple test route (for debugging API connection)
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posters', posterRoutes);
app.use('/api/clubs', clubRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds the 5MB limit' });
    }
    return res.status(400).json({ message: err.message });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;