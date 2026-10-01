const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { secretKey } = require('../config');

async function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ detail: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
