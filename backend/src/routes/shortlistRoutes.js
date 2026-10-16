
const express = require('express');
const router = express.Router();

const { shortlistApplication } = require('../controllers/shortlistController');
const { authenticate } = require('../middleware/auth');

router.patch(
  '/:applicationId/shortlist',
  authenticate,
  shortlistApplication
);

module.exports = router;
