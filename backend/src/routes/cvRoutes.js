const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadCv } = require('../middleware/upload');
const { getPublicJob, submitApplication, downloadCv, getResult } = require('../controllers/cvController');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();
router.get('/public/jobs/:token', getPublicJob);
router.post('/public/jobs/:token/applications', rateLimit({ limit: 10 }), uploadCv.single('cv'), submitApplication);
router.get('/applications/:id/cv', authenticate, authorize('recruiter'), downloadCv);
router.get('/results/:token', optionalAuthenticate, getResult);

module.exports = router;
