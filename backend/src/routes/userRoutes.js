const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar, getAvatar, removeAvatar } = require('../controllers/userController');
const { userFileSizeMb } = require('../config');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: userFileSizeMb * 1024 * 1024, files: 1 },
});

router.use(authenticate);
router.post('/me/avatar', upload.single('avatar'), uploadAvatar);
router.get('/me/avatar', getAvatar);
router.delete('/me/avatar', removeAvatar);

module.exports = router;
