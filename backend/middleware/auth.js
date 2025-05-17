const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(decoded.id).then(user => {
      if (!user) return res.sendStatus(401);

      req.user = user;
      next();
    }).catch(err => {
      console.error('Authentication error:', err.message);
      res.sendStatus(401);
    });
  } catch (err) {
    console.error('Authentication error:', err.message);
    res.sendStatus(401);
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: Requires role ${roles.join(', ')}` });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireAdmin,
  requireRole,
};
