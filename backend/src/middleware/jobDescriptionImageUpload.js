const multer = require('multer');
const { maxFileSizeMb } = require('../config');

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const uploadJobDescriptionImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024,
    files: 5,
  },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only JPEG, PNG, and WebP screenshots are supported.');
      error.code = 'UNSUPPORTED_FILE_TYPE';
      return callback(error);
    }
    return callback(null, true);
  },
});

module.exports = { uploadJobDescriptionImages };
