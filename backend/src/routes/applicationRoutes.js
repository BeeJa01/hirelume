const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { getApplication, updateStatus, getStatusHistory } = require('../controllers/applicationController');

const router = express.Router();
router.use(authenticate, authorize('recruiter'));
router.get('/:id', getApplication);
router.patch('/:id/status', updateStatus);
router.get('/:id/status-history', getStatusHistory);

module.exports = router;
