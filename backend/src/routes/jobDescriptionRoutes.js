const express = require('express');
const authenticate = require('../middleware/auth');
const {
  createJobDescription,
  extractJobDescriptionImages,
  extractJobDescriptionLink,
} = require('../controllers/jobDescriptionController');
const { uploadJobDescriptionImages } = require('../middleware/jobDescriptionImageUpload');

const router = express.Router();
router.post('/', authenticate, createJobDescription);
router.post(
  '/images/extract',
  authenticate,
  uploadJobDescriptionImages.array('images', 5),
  extractJobDescriptionImages,
);
router.post('/links/extract', authenticate, extractJobDescriptionLink);
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'Each screenshot must be 5 MB or smaller.' },
    });
  }
  if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(422).json({
      success: false,
      error: { code: 'TOO_MANY_IMAGES', message: 'Upload up to five screenshots.' },
    });
  }
  if (error.code === 'UNSUPPORTED_FILE_TYPE') {
    return res.status(415).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
  }
  console.error('Job description request failed:', error);
  return res.status(500).json({
    success: false,
    error: { code: 'SERVER_ERROR', message: 'Could not save the job description. Please try again.' },
  });
});

module.exports = router;
