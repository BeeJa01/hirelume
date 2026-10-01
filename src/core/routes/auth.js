const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { knex } = require('../db');
const { config } = require('../config');
const { authenticate } = require('../middleware/auth');
const { asyncRoute, now, publicUser, validate } = require('../utils');

const router = express.Router();
const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'password must be no longer than 72 bytes'),
  role: z.enum(['recruiter', 'job_seeker']),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string() });

function authResponse(user) {
  const accessToken = jwt.sign({}, config.secretKey, {
    subject: String(user.id),
    algorithm: 'HS256',
    expiresIn: `${config.accessTokenExpireMinutes}m`,
  });
  return { access_token: accessToken, token_type: 'bearer', user: publicUser(user) };
}

router.post('/register', asyncRoute(async (req, res) => {
  const input = validate(registerSchema, req.body);
  const email = input.email.toLowerCase();
  if (await knex('users').where({ email }).first()) return res.status(409).json({ detail: 'Account already exists' });
  let user;
  try {
    [user] = await knex('users').insert({
      name: input.name,
      email,
      password_hash: await bcrypt.hash(input.password, 12),
      role: input.role,
      created_at: now(),
    }).returning('*');
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
      return res.status(409).json({ detail: 'Account already exists' });
    }
    throw error;
  }
  return res.json(authResponse(user));
}));

router.post('/login', asyncRoute(async (req, res) => {
  const input = validate(loginSchema, req.body);
  const user = await knex('users').where({ email: input.email.toLowerCase() }).first();
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    return res.status(401).json({ detail: 'Unable to sign in with those details' });
  }
  return res.json(authResponse(user));
}));

router.get('/me', authenticate, (req, res) => res.json(publicUser(req.user)));

module.exports = router;
