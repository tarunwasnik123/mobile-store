const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

async function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;

  // Prefer Authorization header, fall back to cookie
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }

  next();
}

module.exports = { requireAuth, requireAdmin };
