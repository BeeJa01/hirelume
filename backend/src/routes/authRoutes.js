const express = require('express');
const { authenticate } = require('../middleware/auth');
const { register, login, refresh, logout, currentUser } = require('../controllers/authController');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();
router.post('/register', rateLimit({ limit: 20 }), register);
router.post('/login', rateLimit({ limit: 20 }), login);
router.post('/refresh', rateLimit({ limit: 30 }), refresh);
router.post('/logout', logout);
router.get('/me', authenticate, currentUser);

module.exports = router;
