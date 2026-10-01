const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { z } = require('zod');
const { Job, Application, AnalysisResult } = require('../core/db');
const { authenticate, requireRole } = require('../core/middleware/auth');
const { asyncRoute, validate } = require('../core/utils');
const { storedFilePath } = require('../privacy-files/storage');

const router = express.Router();
const statusSchema = z.object({ status: z.enum(['shortlisted', 'rejected', 'undecided']) });

async function ownedApplication(applicationId, recruiterId) {
  if (!mongoose.isValidObjectId(applicationId)) return null;
  const application = await Application.findById(applicationId).lean();
  if (!application) return null;
  const job = await Job.findOne({ _id: application.job_id, recruiter_id: recruiterId }).select('_id').lean();
  return job ? application : null;
}

router.use(authenticate, requireRole('recruiter'));

router.get('/:applicationId', asyncRoute(async (req, res) => {
  const application = await ownedApplication(req.params.applicationId, req.user._id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const result = await AnalysisResult.findOne({ application_id: application._id }).sort({ created_at: -1 }).lean();
  res.json({
    id: String(application._id),
    name: application.name,
    email: application.email,
    phone: application.phone,
    status: application.status,
    analysis_status: application.analysis_status,
    analysis_attempts: application.analysis_attempts,
    score: application.analysis_score,
    match_level: application.match_level,
    reason: application.reason,
    needs_review: application.needs_review,
    cv_locked: application.cv_locked,
    applied_at: application.applied_at,
    analysis_updated_at: application.analysis_updated_at,
    analysis: result ? JSON.parse(result.result_json) : null,
  });
}));

router.get('/:applicationId/cv', asyncRoute(async (req, res) => {
  const application = await ownedApplication(req.params.applicationId, req.user._id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const cvPath = storedFilePath(application.cv_path);
  if (!cvPath || !fs.existsSync(cvPath)) return res.status(404).json({ detail: 'CV_NOT_FOUND' });
  res.type('application/octet-stream').download(cvPath, path.basename(application.cv_filename));
}));

router.patch('/:applicationId/status', asyncRoute(async (req, res) => {
  const { status } = validate(statusSchema, req.body);
  const application = await ownedApplication(req.params.applicationId, req.user._id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  if (application.status !== status) {
    await Application.updateOne(
      { _id: application._id, status: application.status },
      {
        $set: { status },
        $push: { status_history: { actor_user_id: req.user._id, old_status: application.status, new_status: status } },
      },
    );
  }
  res.json({ id: String(application._id), status });
}));

router.get('/:applicationId/status-history', asyncRoute(async (req, res) => {
  const application = await ownedApplication(req.params.applicationId, req.user._id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const history = [...application.status_history].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(history.map((entry) => ({
    old_status: entry.old_status,
    new_status: entry.new_status,
    actor_user_id: String(entry.actor_user_id),
    created_at: entry.created_at,
  })));
}));

module.exports = { router };
