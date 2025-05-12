const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    console.log('Headers:', req.headers);

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted from header:', token ? token.substring(0, 20) + '...' : null);
    }

    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        console.log('User not found for ID:', decoded.id);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      console.log('User found:', {
        id: user._id,
        role: user.role,
        email: user.email
      });

      req.user = user;
      next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };