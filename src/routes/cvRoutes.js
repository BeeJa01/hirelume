const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadCv } = require('../middleware/upload');
const { getPublicJob, submitApplication, downloadCv, getResult } = require('../controllers/cvController');

const router = express.Router();
router.get('/public/jobs/:token', getPublicJob);
router.post('/public/jobs/:token/applications', uploadCv.single('cv'), submitApplication);
router.get('/applications/:id/cv', authenticate, authorize('recruiter'), downloadCv);
router.get('/results/:token', getResult);

module.exports = router;
