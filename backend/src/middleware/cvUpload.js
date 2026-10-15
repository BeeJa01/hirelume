const multer = require('multer');
const { maxFileSizeMb } = require('../config');

const uploadCv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const allowed = new Set([
      'pdf',
      'docx',
      'jpg',
      'jpeg',
      'png',
      'webp',
    ]);
    if (!allowed.has(extension)) {
      const error = new Error('Upload a PDF, DOCX, JPEG, PNG, or WebP CV.');
      error.code = 'UNSUPPORTED_FILE_TYPE';
      return callback(error);
    }
    return callback(null, true);
  },
});

module.exports = { uploadCv };
