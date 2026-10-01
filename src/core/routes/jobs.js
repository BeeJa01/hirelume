const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const { Job, Application } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncRoute, token, validate } = require('../utils');

const router = express.Router();
const requirementSchema = z.object({
  text: z.string().trim().min(1).max(500),
  requirement_type: z.enum(['required', 'nice_to_have']).default('required'),
});
const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().min(1),
  requirements: z.array(requirementSchema).min(1),
  feedback_enabled: z.boolean().default(true),
  blind_mode: z.boolean().default(false),
});
const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().optional(),
  requirements: z.array(requirementSchema).optional(),
  feedback_enabled: z.boolean().optional(),
  blind_mode: z.boolean().optional(),
});

async function ownedJob(jobId, recruiterId) {
  if (!mongoose.isValidObjectId(jobId)) return null;
  return Job.findOne({ _id: jobId, recruiter_id: recruiterId });
}

function serializeJob(job) {
  return {
    id: String(job._id),
    title: job.title,
    description: job.description,
    status: job.status,
    public_token: job.public_token,
    feedback_enabled: job.feedback_enabled,
    blind_mode: job.blind_mode,
    requirements_locked: job.requirements_locked,
    requirements: job.requirements.map((requirement) => ({
      id: String(requirement._id),
      text: requirement.text,
      type: requirement.requirement_type,
    })),
    created_at: job.created_at,
    updated_at: job.updated_at,
  };
}

router.use(authenticate, requireRole('recruiter'));

router.post('/', asyncRoute(async (req, res) => {
  const input = validate(createSchema, req.body);
  const job = await Job.create({
    ...input,
    recruiter_id: req.user._id,
    public_token: token(24),
    requirements: input.requirements.map((requirement, position) => ({
      ...requirement,
      position,
    })),
  });
  res.json(serializeJob(job));
}));

router.get('/', asyncRoute(async (req, res) => {
  const jobs = await Job.find({ recruiter_id: req.user._id }).sort({ created_at: -1 }).lean();
  res.json(await Promise.all(jobs.map(async (job) => ({
    id: String(job._id),
    title: job.title,
    status: job.status,
    public_token: job.public_token,
    feedback_enabled: job.feedback_enabled,
    blind_mode: job.blind_mode,
    applicants: await Application.countDocuments({ job_id: job._id }),
  }))));
}));

router.get('/:jobId/applications', asyncRoute(async (req, res) => {
  const job = await ownedJob(req.params.jobId, req.user._id);
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  const sort = req.query.sort === 'date' ? { applied_at: -1 } : { analysis_score: -1, applied_at: -1 };
  const applicants = await Application.find({ job_id: job._id }).sort(sort).lean();
  res.json({
    total: applicants.length,
    applicants: applicants.map((application) => ({
      id: String(application._id),
      name: application.name,
      score: application.analysis_score,
      level: application.match_level,
      reason: application.reason,
      needs_review: application.needs_review,
      status: application.status,
      analysis_status: application.analysis_status,
      applied_at: application.applied_at,
    })),
  });
}));

router.get('/:jobId', asyncRoute(async (req, res) => {
  const job = await ownedJob(req.params.jobId, req.user._id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  res.json(serializeJob(job));
}));

router.patch('/:jobId', asyncRoute(async (req, res) => {
  const input = validate(updateSchema, req.body);
  const job = await ownedJob(req.params.jobId, req.user._id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  if (input.requirements && job.requirements_locked) {
    return res.status(409).json({ detail: 'Job requirements are locked after the first application' });
  }
  const { requirements, ...updates } = input;
  Object.assign(job, updates);
  if (requirements) job.requirements = requirements.map((requirement, position) => ({ ...requirement, position }));
  await job.save();
  res.json(serializeJob(job));
}));

router.post('/:jobId/close', asyncRoute(async (req, res) => {
  const job = await ownedJob(req.params.jobId, req.user._id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  job.status = 'closed';
  job.closed_at = new Date();
  await job.save();
  res.json({ id: String(job._id), status: job.status });
}));

router.post('/:jobId/reopen', asyncRoute(async (req, res) => {
  const job = await ownedJob(req.params.jobId, req.user._id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  job.status = 'open';
  job.closed_at = null;
  await job.save();
  res.json({ id: String(job._id), status: job.status });
}));

module.exports = router;
