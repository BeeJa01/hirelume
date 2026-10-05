const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { secretKey } = require('../config');

async function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ detail: 'NOT_AUTHENTICATED' });
  }
  try {
    const payload = jwt.verify(token, secretKey, { algorithms: ['HS256'] });
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ detail: 'USER_NOT_FOUND' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ detail: 'INVALID_ACCESS_TOKEN' });
  }
}

async function optionalAuthenticate(req, res, next) {
  if (!req.get('authorization')) return next();
  return authenticate(req, res, next);
}

module.exports = { authenticate, optionalAuthenticate };
