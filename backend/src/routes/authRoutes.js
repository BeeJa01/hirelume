const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  refresh,
  logout,
  currentUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', rateLimit({ limit: 20 }), register);
router.post('/login', rateLimit({ limit: 20 }), login);
router.post('/refresh', rateLimit({ limit: 30 }), refresh);
router.post('/logout', logout);
router.get('/me', authenticate, currentUser);

// Forgot-password and password-reset endpoints
router.post('/forgot-password', rateLimit({ limit: 20 }), forgotPassword);
router.post('/reset-password', rateLimit({ limit: 20 }), resetPassword);

module.exports = router;