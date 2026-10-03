const express = require('express');
const authenticate = require('../middleware/auth');
const { register, login, currentUser } = require('../controllers/authController');

const router = express.Router();
router.post('/register', (req, res, next) => {
  console.log('AUTH REGISTER BODY:', req.body);
  next();
}, register);
router.post('/login', (req, res, next) => {
  console.log('AUTH LOGIN BODY:', req.body);
  next();
}, login);
router.get('/me', authenticate, currentUser);

module.exports = router;
