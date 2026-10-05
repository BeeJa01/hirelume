const multer = require('multer');
const { maxFileSizeMb } = require('../config');

const uploadCv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSizeMb * 1024 * 1024, files: 1 },
});

module.exports = { uploadCv };
