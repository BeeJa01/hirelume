const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const controller = require('../controllers/jobController');

const router = express.Router();
router.use(authenticate, authorize('recruiter'));
router.post('/', controller.createJob);
router.get('/', controller.listJobs);
router.get('/:id/applications', controller.listApplicants);
router.get('/:id', controller.getJob);
router.patch('/:id', controller.updateJob);
router.post('/:id/close', controller.closeJob);
router.post('/:id/reopen', controller.reopenJob);

module.exports = router;
