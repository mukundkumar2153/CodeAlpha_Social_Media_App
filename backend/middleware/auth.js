const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function authRequired(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = payload; // { id, username }
    next();
  });
}

// Optional auth: attaches req.user if token present, but doesn't block
function authOptional(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (!err) req.user = payload;
    next();
  });
}

module.exports = { authRequired, authOptional, JWT_SECRET };
