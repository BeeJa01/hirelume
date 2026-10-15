const express = require('express');
const authenticate = require('../middleware/auth');
const {
  createResumeAnalysis,
  generateAnalysisQuestions,
  getResumeAnalysis,
  listResumeAnalyses,
} = require('../controllers/resumeAnalysisController');

const router = express.Router();
router.use(authenticate);
router.post('/', createResumeAnalysis);
router.get('/', listResumeAnalyses);
router.get('/:analysisId', getResumeAnalysis);
router.post('/:analysisId/questions', generateAnalysisQuestions);

module.exports = router;
