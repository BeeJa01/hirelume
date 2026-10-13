const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadCv, uploadFlow2 } = require('../middleware/upload');
const { rateLimit } = require('../middleware/rateLimit');
const { createAnalysis, confirmAnalysis, uploadAnalysisCv, retryAnalysis, getAnalysis } = require('../controllers/flow2Controller');

const router = express.Router();
router.use(authenticate, authorize('job_seeker'));
router.post('/analyses', rateLimit({ limit: 10 }), uploadFlow2.fields([
  { name: 'screenshots', maxCount: 3 },
  { name: 'cv', maxCount: 1 },
]), createAnalysis);
router.post('/analyses/:id/confirm', confirmAnalysis);
router.post('/analyses/:id/cv', uploadCv.single('cv'), uploadAnalysisCv);
router.post('/analyses/:id/retry', retryAnalysis);
router.get('/analyses/:id', getAnalysis);

module.exports = router;
