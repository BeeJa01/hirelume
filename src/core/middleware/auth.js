const jwt = require('jsonwebtoken');
const { knex } = require('../db');
const { config } = require('../config');

async function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, config.secretKey, { algorithms: ['HS256'] });
    const user = await knex('users').where({ id: Number(payload.sub) }).first();
    if (!user) return res.status(401).json({ detail: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ detail: 'You do not have access to this resource' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };