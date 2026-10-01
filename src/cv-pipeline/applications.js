const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { z } = require('zod');
const { knex } = require('../core/db');
const { authenticate, requireRole } = require('../core/middleware/auth');
const { asyncRoute, now, validate } = require('../core/utils');
const { storedFilePath } = require('../privacy-files/storage');

const router = express.Router();
const statusSchema = z.object({ status: z.enum(['shortlisted', 'rejected', 'undecided']) });

async function ownedApplication(applicationId, recruiterId) {
  return knex('applications')
    .join('jobs', 'applications.job_id', 'jobs.id')
    .select('applications.*')
    .where({ 'applications.id': applicationId, 'jobs.recruiter_id': recruiterId })
    .first();
}

router.use(authenticate, requireRole('recruiter'));

router.get('/:applicationId', asyncRoute(async (req, res) => {
  const application = await ownedApplication(Number(req.params.applicationId), req.user.id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const result = await knex('analysis_results').where({ application_id: application.id }).orderBy('id', 'desc').first();
  res.json({
    id: application.id,
    name: application.name,
    email: application.email,
    phone: application.phone,
    status: application.status,
    analysis_status: application.analysis_status,
    analysis_attempts: application.analysis_attempts,
    score: application.analysis_score,
    match_level: application.match_level,
    reason: application.reason,
    needs_review: Boolean(application.needs_review),
    cv_locked: Boolean(application.cv_locked),
    applied_at: application.applied_at,
    analysis_updated_at: application.analysis_updated_at,
    analysis: result ? JSON.parse(result.result_json) : null,
  });
}));

router.get('/:applicationId/cv', asyncRoute(async (req, res) => {
  const application = await ownedApplication(Number(req.params.applicationId), req.user.id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const cvPath = storedFilePath(application.cv_path);
  if (!cvPath || !fs.existsSync(cvPath)) return res.status(404).json({ detail: 'CV_NOT_FOUND' });
  res.type('application/octet-stream').download(cvPath, path.basename(application.cv_filename));
}));

router.patch('/:applicationId/status', asyncRoute(async (req, res) => {
  const input = validate(statusSchema, req.body);
  const application = await ownedApplication(Number(req.params.applicationId), req.user.id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  if (application.status !== input.status) {
    await knex.transaction(async (trx) => {
      await trx('status_audits').insert({
        application_id: application.id,
        actor_user_id: req.user.id,
        old_status: application.status,
        new_status: input.status,
        created_at: now(),
      });
      await trx('applications').where({ id: application.id }).update({ status: input.status });
    });
  }
  res.json({ id: application.id, status: input.status });
}));

router.get('/:applicationId/status-history', asyncRoute(async (req, res) => {
  const application = await ownedApplication(Number(req.params.applicationId), req.user.id);
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const rows = await knex('status_audits').where({ application_id: application.id }).orderBy('created_at', 'desc');
  res.json(rows.map((row) => ({
    old_status: row.old_status,
    new_status: row.new_status,
    actor_user_id: row.actor_user_id,
    created_at: row.created_at,
  })));
}));

module.exports = { router };
