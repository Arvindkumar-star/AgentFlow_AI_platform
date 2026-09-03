const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Allow token via query param for OAuth redirect flows (browser can't send headers)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorised — no token' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden — insufficient role' });
    }
    next();
  };
}

module.exports = { protect, requireRole };
