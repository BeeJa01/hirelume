const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { getApplication, linkApplication, deleteApplication, updateStatus, getStatusHistory } = require('../controllers/applicationController');

const router = express.Router();
router.post('/link', authenticate, authorize('job_seeker'), linkApplication);
router.delete('/:id', authenticate, deleteApplication);
router.get('/:id', authenticate, authorize('recruiter'), getApplication);
router.patch('/:id/status', authenticate, authorize('recruiter'), updateStatus);
router.get('/:id/status-history', authenticate, authorize('recruiter'), getStatusHistory);

module.exports = router;
