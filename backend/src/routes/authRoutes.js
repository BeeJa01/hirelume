const express = require('express');
const authenticate = require('../middleware/auth');
const { register, login, currentUser } = require('../controllers/authController');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, currentUser);

module.exports = router;
