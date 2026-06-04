const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

module.exports = function auth(req, res, next) {
  try {
    const rawHeader = req.headers.authorization || req.headers['x-access-token'];
    if (!rawHeader) return res.status(401).json({ error: 'Missing token' });
    const token = rawHeader.startsWith('Bearer ') ? rawHeader.slice(7) : rawHeader;
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports.JWT_SECRET = JWT_SECRET;
