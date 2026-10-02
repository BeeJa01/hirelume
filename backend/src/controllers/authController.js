const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { User } = require('../models');
const { secretKey, accessTokenExpireMinutes } = require('../config');
const { asyncRoute, publicUser, validate } = require('../utils');

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'password must be no longer than 72 bytes'),
  role: z.enum(['recruiter', 'job_seeker']),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string() });

function authResponse(user) {
  return {
    access_token: jwt.sign({}, secretKey, {
      subject: String(user._id),
      algorithm: 'HS256',
      expiresIn: `${accessTokenExpireMinutes}m`,
    }),
    token_type: 'bearer',
    user: publicUser(user),
  };
}

const register = asyncRoute(async (req, res) => {
  const input = validate(registerSchema, req.body);
  try {
    const user = await User.create({ ...input, email: input.email.toLowerCase(), password_hash: await bcrypt.hash(input.password, 12) });
    res.json(authResponse(user));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ detail: 'Account already exists' });
    throw error;
  }
});

const login = asyncRoute(async (req, res) => {
  const input = validate(loginSchema, req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    return res.status(401).json({ detail: 'Unable to sign in with those details' });
  }
  res.json(authResponse(user));
});

function currentUser(req, res) {
  res.json(publicUser(req.user));
}

module.exports = { register, login, currentUser };
