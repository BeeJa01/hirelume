const mongoose = require('mongoose');
const { Job, Application, AnalysisResult } = require('../models');
const { asyncRoute, now, validate } = require('../utils');
const { z } = require('zod');

const statusSchema = z.object({ status: z.enum(['shortlisted', 'rejected', 'undecided']) });

async function findRecruiterApplication(id, recruiterId) {
  if (!mongoose.isValidObjectId(id)) return null;
  const application = await Application.findById(id).lean();
  if (!application) return null;
  const job = await Job.exists({ _id: application.job_id, recruiter_id: recruiterId });
  return job ? application : null;
}

const getApplication = asyncRoute(async (req, res) => {
  const application = await findRecruiterApplication(req.params.id, req.user._id);
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
});

const updateStatus = asyncRoute(async (req, res) => {
  const { status } = validate(statusSchema, req.body);
  const application = await findRecruiterApplication(req.params.id, req.user._id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  if (application.status !== status) {
    await Application.updateOne(
      { _id: application._id, status: application.status },
      { $set: { status }, $push: { status_history: {
        actor_user_id: req.user._id,
        old_status: application.status,
        new_status: status,
        created_at: now(),
      } } },
    );
  }
  res.json({ id: String(application._id), status });
});

const getStatusHistory = asyncRoute(async (req, res) => {
  const application = await findRecruiterApplication(req.params.id, req.user._id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const history = [...application.status_history].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(history.map((entry) => ({
    old_status: entry.old_status,
    new_status: entry.new_status,
    actor_user_id: String(entry.actor_user_id),
    created_at: entry.created_at,
  })));
});

module.exports = { getApplication, updateStatus, getStatusHistory };
