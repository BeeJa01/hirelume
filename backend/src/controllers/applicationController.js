const mongoose = require('mongoose');
const { Job, Application, AnalysisResult, CV } = require('../models');
const { removeCv } = require('../services/fileStorage');
const { asyncRoute, now, validate } = require('../utils');
const { z } = require('zod');

const statusSchema = z.object({ status: z.enum(['shortlisted', 'rejected', 'undecided']) });
const linkSchema = z.object({ result_token: z.string().min(32) });

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
    skills: application.skills,
    experience: application.experience,
    needs_review: application.needs_review,
    cv_locked: application.cv_locked,
    applied_at: application.applied_at,
    analysis_updated_at: application.analysis_updated_at,
    analysis: result ? JSON.parse(result.result_json) : null,
    cv_url: `/api/applications/${application._id}/cv`,
  });
});

const linkApplication = asyncRoute(async (req, res) => {
  const { result_token: resultToken } = validate(linkSchema, req.body);
  const application = await Application.findOne({ private_result_token: resultToken });
  if (!application) return res.status(404).json({ detail: 'INVALID_RESULT_TOKEN' });
  if (application.user_id && String(application.user_id) !== String(req.user._id)) {
    return res.status(409).json({ detail: 'APPLICATION_ALREADY_LINKED' });
  }
  if (application.email !== req.user.email) return res.status(403).json({ detail: 'APPLICATION_EMAIL_MISMATCH' });
  application.user_id = req.user._id;
  await application.save();
  return res.json({ application_id: String(application._id), linked: true });
});

const deleteApplication = asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const ownsApplication = String(application.user_id || '') === String(req.user._id);
  const ownsJob = req.user.role === 'recruiter' && await Job.exists({ _id: application.job_id, recruiter_id: req.user._id });
  if (!ownsApplication && !ownsJob) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const cv = await CV.findOne({ application_id: application._id }).lean();
  await Promise.all([
    CV.deleteOne({ application_id: application._id }),
    AnalysisResult.deleteMany({ application_id: application._id }),
    Application.deleteOne({ _id: application._id }),
  ]);
  if (cv?.storage_path) await removeCv(cv.storage_path);
  return res.status(204).end();
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

module.exports = { getApplication, linkApplication, deleteApplication, updateStatus, getStatusHistory };
