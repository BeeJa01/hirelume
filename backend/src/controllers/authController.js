const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createHash, randomBytes } = require('node:crypto');
const { z } = require('zod');
const { User, RefreshToken } = require('../models');
const { secretKey, accessTokenExpireMinutes, refreshTokenExpireDays } = require('../config');
const { asyncRoute, publicUser, validate } = require('../utils');
const { sendPasswordResetEmail } = require('../services/emailService');

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'password must be no longer than 72 bytes'
  ),
  role: z.enum(['recruiter', 'job_seeker']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(32),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'password must be no longer than 72 bytes'
  ),
});

const hashToken = (value) =>
  createHash('sha256').update(value).digest('hex');

async function authResponse(user) {
  const refreshToken = randomBytes(48).toString('base64url');

  await RefreshToken.create({
    user_id: user._id,
    token_hash: hashToken(refreshToken),
    expires_at: new Date(
      Date.now() + refreshTokenExpireDays * 24 * 60 * 60 * 1000
    ),
  });

  return {
    access_token: jwt.sign({}, secretKey, {
      subject: String(user._id),
      algorithm: 'HS256',
      expiresIn: `${accessTokenExpireMinutes}m`,
    }),
    token_type: 'bearer',
    expires_in: accessTokenExpireMinutes * 60,
    refresh_token: refreshToken,
    user: publicUser(user),
  };
}

const register = asyncRoute(async (req, res) => {
  const input = validate(registerSchema, req.body);

  try {
    const user = await User.create({
      ...input,
      email: input.email.toLowerCase(),
      password_hash: await bcrypt.hash(input.password, 12),
    });

    res.json(await authResponse(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ detail: 'ACCOUNT_ALREADY_EXISTS' });
    }
    throw error;
  }
});

const login = asyncRoute(async (req, res) => {
  const input = validate(loginSchema, req.body);

  const user = await User.findOne({
    email: input.email.toLowerCase(),
  });

  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    return res.status(401).json({ detail: 'INVALID_CREDENTIALS' });
  }

  res.json(await authResponse(user));
});

const refresh = asyncRoute(async (req, res) => {
  const input = validate(refreshSchema, req.body);

  const stored = await RefreshToken.findOne({
    token_hash: hashToken(input.refresh_token),
    revoked_at: null,
    expires_at: { $gt: new Date() },
  });

  if (!stored) {
    return res.status(401).json({ detail: 'INVALID_REFRESH_TOKEN' });
  }

  stored.revoked_at = new Date();
  await stored.save();

  const user = await User.findById(stored.user_id);

  if (!user) {
    return res.status(401).json({ detail: 'INVALID_REFRESH_TOKEN' });
  }

  return res.json(await authResponse(user));
});

const logout = asyncRoute(async (req, res) => {
  const input = validate(refreshSchema, req.body);

  await RefreshToken.updateOne(
    {
      token_hash: hashToken(input.refresh_token),
      revoked_at: null,
    },
    { $set: { revoked_at: new Date() } }
  );

  return res.status(204).end();
});

// Request a password-reset email.
const forgotPassword = asyncRoute(async (req, res) => {
  const { email } = validate(forgotPasswordSchema, req.body);

  const response = {
    message: 'If an account exists with that email, a reset link will be sent.',
  };

  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select('+password_reset_token_hash +password_reset_expires_at');

  // Do not reveal whether an email is registered.
  if (!user) {
    return res.status(200).json(response);
  }

  const resetToken = randomBytes(32).toString('hex');

  user.password_reset_token_hash = hashToken(resetToken);
  user.password_reset_expires_at = new Date(Date.now() + 60 * 1000);

  await user.save();

  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL is not configured');
  }

  const resetUrl =
    `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

  await sendPasswordResetEmail({
    email: user.email,
    resetUrl,
  });

  return res.status(200).json(response);
});

// Validate the token and save the new password.
const resetPassword = asyncRoute(async (req, res) => {
  const { token, password } = validate(resetPasswordSchema, req.body);

  const user = await User.findOne({
    password_reset_token_hash: hashToken(token),
    password_reset_expires_at: { $gt: new Date() },
  }).select('+password_reset_token_hash +password_reset_expires_at');

  if (!user) {
    return res.status(400).json({
      detail: 'INVALID_OR_EXPIRED_RESET_TOKEN',
    });
  }

  user.password_hash = await bcrypt.hash(password, 12);
  user.password_reset_token_hash = null;
  user.password_reset_expires_at = null;

  await user.save();

  // Invalidate existing refresh tokens after the password changes.
  await RefreshToken.updateMany(
    { user_id: user._id, revoked_at: null },
    { $set: { revoked_at: new Date() } }
  );

  return res.status(200).json({
    message: 'Password reset successful. Please log in again.',
  });
});

function currentUser(req, res) {
  res.json(publicUser(req.user));
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  currentUser,
  forgotPassword,
  resetPassword,
};
