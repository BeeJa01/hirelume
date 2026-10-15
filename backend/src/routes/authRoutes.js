const express = require('express');
const { rateLimit } = require('express-rate-limit');
const authenticate = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/avatarUpload');
const { register, login, currentUser } = require('../controllers/authController');
const {
  avatarUploadError,
  deleteOwnAvatar,
  getOwnAvatar,
  uploadOwnAvatar,
} = require('../controllers/avatarController');

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please try again later.' },
    });
  },
});

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.get('/me/avatar', authenticate, getOwnAvatar);
router.post('/me/avatar', authenticate, uploadAvatar.single('file'), uploadOwnAvatar, avatarUploadError);
router.delete('/me/avatar', authenticate, deleteOwnAvatar);
router.get('/me', authenticate, currentUser);

module.exports = router;
