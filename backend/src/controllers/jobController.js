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
  description: z.string().min(1).optional(),
  requirements: z.array(requirementSchema).min(1).optional(),
  feedback_enabled: z.boolean().optional(),
  blind_mode: z.boolean().optional(),
});
const listApplicantsSchema = z.object({
  status: z.enum(['shortlisted', 'rejected', 'undecided']).optional(),
  analysis_status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  sort: z.enum(['score', 'date']).default('score'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
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
  const query = validate(listApplicantsSchema, req.query);
  const job = await ownedJob(req.params.id, req.user._id);
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  const direction = query.order === 'asc' ? 1 : -1;
  const sort = query.sort === 'date' ? { applied_at: direction } : { analysis_score: direction, applied_at: -1 };
  const filter = { job_id: job._id };
  if (query.status) filter.status = query.status;
  if (query.analysis_status) filter.analysis_status = query.analysis_status;
  const total = await Application.countDocuments(filter);
  const applications = await Application.find(filter).sort(sort).skip((query.page - 1) * query.page_size).limit(query.page_size).lean();
  res.json({
    total, page: query.page, page_size: query.page_size, pages: Math.ceil(total / query.page_size),
    applicants: applications.map((item) => ({
      id: String(item._id), name: item.name, score: item.analysis_score, level: item.match_level,
      reason: item.reason, skills: item.skills, experience: item.experience,
      needs_review: item.needs_review, status: item.status,
      analysis_status: item.analysis_status, applied_at: item.applied_at,
    })),
  });
});

const getJob = asyncRoute(async (req, res) => {
  const job = await ownedJob(req.params.id, req.user._id);
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  res.json(serializeJob(job));
});

const updateJob = asyncRoute(async (req, res) => {
  const input = validate(updateSchema, req.body);
  const job = await ownedJob(req.params.id, req.user._id);
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  if (input.requirements && job.requirements_locked) {
    return res.status(409).json({ detail: 'JOB_REQUIREMENTS_LOCKED' });
  }
  const { requirements, ...fields } = input;
  Object.assign(job, fields);
  if (requirements) job.requirements = requirements.map((item, position) => ({ ...item, position }));
  await job.save();
  res.json(serializeJob(job));
});

async function setJobStatus(req, res, status) {
  const job = await ownedJob(req.params.id, req.user._id);
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  job.status = status;
  job.closed_at = status === 'closed' ? new Date() : null;
  await job.save();
  res.json({ id: String(job._id), status });
}

const closeJob = asyncRoute((req, res) => setJobStatus(req, res, 'closed'));
const reopenJob = asyncRoute((req, res) => setJobStatus(req, res, 'open'));

module.exports = { createJob, listJobs, listApplicants, getJob, updateJob, closeJob, reopenJob };
