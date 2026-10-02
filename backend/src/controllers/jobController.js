const mongoose = require('mongoose');
const { z } = require('zod');
const { Job, Application } = require('../models');
const { asyncRoute, token, validate } = require('../utils');

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
    requirements: job.requirements.map((item) => ({ id: String(item._id), text: item.text, type: item.requirement_type })),
    created_at: job.created_at,
    updated_at: job.updated_at,
  };
}

async function ownedJob(id, recruiterId) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Job.findOne({ _id: id, recruiter_id: recruiterId });
}

const createJob = asyncRoute(async (req, res) => {
  const input = validate(createSchema, req.body);
  const job = await Job.create({
    ...input,
    recruiter_id: req.user._id,
    public_token: token(24),
    requirements: input.requirements.map((item, position) => ({ ...item, position })),
  });
  res.json(serializeJob(job));
});

const listJobs = asyncRoute(async (req, res) => {
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
});

const listApplicants = asyncRoute(async (req, res) => {
  const job = await ownedJob(req.params.id, req.user._id);
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  const sort = req.query.sort === 'date' ? { applied_at: -1 } : { analysis_score: -1, applied_at: -1 };
  const applications = await Application.find({ job_id: job._id }).sort(sort).lean();
  res.json({
    total: applications.length,
    applicants: applications.map((item) => ({
      id: String(item._id), name: item.name, score: item.analysis_score, level: item.match_level,
      reason: item.reason, needs_review: item.needs_review, status: item.status,
      analysis_status: item.analysis_status, applied_at: item.applied_at,
    })),
  });
});

const getJob = asyncRoute(async (req, res) => {
  const job = await ownedJob(req.params.id, req.user._id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  res.json(serializeJob(job));
});

const updateJob = asyncRoute(async (req, res) => {
  const input = validate(updateSchema, req.body);
  const job = await ownedJob(req.params.id, req.user._id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  if (input.requirements && job.requirements_locked) {
    return res.status(409).json({ detail: 'Job requirements are locked after the first application' });
  }
  const { requirements, ...fields } = input;
  Object.assign(job, fields);
  if (requirements) job.requirements = requirements.map((item, position) => ({ ...item, position }));
  await job.save();
  res.json(serializeJob(job));
});

async function setJobStatus(req, res, status) {
  const job = await ownedJob(req.params.id, req.user._id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  job.status = status;
  job.closed_at = status === 'closed' ? new Date() : null;
  await job.save();
  res.json({ id: String(job._id), status });
}

const closeJob = asyncRoute((req, res) => setJobStatus(req, res, 'closed'));
const reopenJob = asyncRoute((req, res) => setJobStatus(req, res, 'open'));

module.exports = { createJob, listJobs, listApplicants, getJob, updateJob, closeJob, reopenJob };
