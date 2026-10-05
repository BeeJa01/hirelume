const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { createRating, createEvent } = require('../controllers/engagementController');

const router = express.Router();
router.post('/ratings', authenticate, rateLimit({ limit: 20 }), createRating);
router.post('/events', optionalAuthenticate, rateLimit({ limit: 60 }), createEvent);

module.exports = router;
