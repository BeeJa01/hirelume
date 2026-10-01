const express = require('express');
const { z } = require('zod');
const { knex } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncRoute, now, token, validate } = require('../utils');

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
  return knex('jobs').where({ id: jobId, recruiter_id: recruiterId }).first();
}

async function serializeJob(job) {
  const requirements = await knex('requirements').where({ job_id: job.id }).orderBy('position');
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    status: job.status,
    public_token: job.public_token,
    feedback_enabled: Boolean(job.feedback_enabled),
    blind_mode: Boolean(job.blind_mode),
    requirements_locked: Boolean(job.requirements_locked),
    requirements: requirements.map(({ id, text, requirement_type }) => ({ id, text, type: requirement_type })),
    created_at: job.created_at,
    updated_at: job.updated_at,
  };
}

router.use(authenticate, requireRole('recruiter'));

router.post('/', asyncRoute(async (req, res) => {
  const input = validate(createSchema, req.body);
  const job = await knex.transaction(async (trx) => {
    const [created] = await trx('jobs').insert({
      recruiter_id: req.user.id,
      title: input.title,
      description: input.description,
      feedback_enabled: input.feedback_enabled,
      blind_mode: input.blind_mode,
      public_token: token(24),
      created_at: now(),
      updated_at: now(),
    }).returning('*');
    await trx('requirements').insert(input.requirements.map((requirement, position) => ({
      job_id: created.id,
      text: requirement.text,
      requirement_type: requirement.requirement_type,
      position,
    })));
    return created;
  });
  res.json(await serializeJob(job));
}));

router.get('/', asyncRoute(async (req, res) => {
  const jobs = await knex('jobs').where({ recruiter_id: req.user.id }).orderBy('created_at', 'desc');
  res.json(await Promise.all(jobs.map(async (job) => ({
    id: job.id,
    title: job.title,
    status: job.status,
    public_token: job.public_token,
    feedback_enabled: Boolean(job.feedback_enabled),
    blind_mode: Boolean(job.blind_mode),
    applicants: Number((await knex('applications').where({ job_id: job.id }).count({ count: '*' }).first()).count),
  }))));
}));

router.get('/:jobId/applications', asyncRoute(async (req, res) => {
  const jobId = Number(req.params.jobId);
  if (!(await ownedJob(jobId, req.user.id))) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  const applicants = await knex('applications').where({ job_id: jobId });
  applicants.sort(req.query.sort === 'date'
    ? (a, b) => new Date(b.applied_at) - new Date(a.applied_at)
    : (a, b) => Number(b.analysis_score !== null) - Number(a.analysis_score !== null) || Number(b.analysis_score || -1) - Number(a.analysis_score || -1));
  res.json({
    total: applicants.length,
    applicants: applicants.map((application) => ({
      id: application.id,
      name: application.name,
      score: application.analysis_score,
      level: application.match_level,
      reason: application.reason,
      needs_review: Boolean(application.needs_review),
      status: application.status,
      analysis_status: application.analysis_status,
      applied_at: application.applied_at,
    })),
  });
}));

router.get('/:jobId', asyncRoute(async (req, res) => {
  const job = await ownedJob(Number(req.params.jobId), req.user.id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  res.json(await serializeJob(job));
}));

router.patch('/:jobId', asyncRoute(async (req, res) => {
  const input = validate(updateSchema, req.body);
  const job = await ownedJob(Number(req.params.jobId), req.user.id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  if (input.requirements && job.requirements_locked) {
    return res.status(409).json({ detail: 'Job requirements are locked after the first application' });
  }
  const { requirements, ...updates } = input;
  await knex.transaction(async (trx) => {
    if (Object.keys(updates).length) await trx('jobs').where({ id: job.id }).update({ ...updates, updated_at: now() });
    if (requirements) {
      await trx('requirements').where({ job_id: job.id }).delete();
      await trx('requirements').insert(requirements.map((requirement, position) => ({
        job_id: job.id, text: requirement.text, requirement_type: requirement.requirement_type, position,
      })));
    }
  });
  res.json(await serializeJob(await ownedJob(job.id, req.user.id)));
}));

router.post('/:jobId/close', asyncRoute(async (req, res) => {
  const job = await ownedJob(Number(req.params.jobId), req.user.id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  await knex('jobs').where({ id: job.id }).update({ status: 'closed', closed_at: now(), updated_at: now() });
  res.json({ id: job.id, status: 'closed' });
}));

router.post('/:jobId/reopen', asyncRoute(async (req, res) => {
  const job = await ownedJob(Number(req.params.jobId), req.user.id);
  if (!job) return res.status(404).json({ detail: 'Job not found' });
  await knex('jobs').where({ id: job.id }).update({ status: 'open', closed_at: null, updated_at: now() });
  res.json({ id: job.id, status: 'open' });
}));

module.exports = router;
