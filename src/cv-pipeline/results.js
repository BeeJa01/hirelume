const express = require('express');
const { knex } = require('../core/db');
const { asyncRoute } = require('../core/utils');

const router = express.Router();

router.get('/:privateToken', asyncRoute(async (req, res) => {
  const application = await knex('applications').where({ private_result_token: req.params.privateToken }).first();
  if (!application) return res.status(404).json({ detail: 'INVALID_RESULT_TOKEN' });
  const job = await knex('jobs').where({ id: application.job_id }).first();
  const payload = {
    application_id: application.id,
    analysis_status: application.analysis_status,
    feedback_enabled: Boolean(job?.feedback_enabled),
  };
  if (application.analysis_status !== 'completed') {
    payload.message = ['pending', 'processing', 'queued'].includes(application.analysis_status)
      ? 'Analysis pending'
      : 'Analysis unavailable';
    return res.json(payload);
  }
  const result = await knex('analysis_results').where({ application_id: application.id }).orderBy('id', 'desc').first();
  if (!result) {
    payload.analysis_status = 'failed';
    payload.message = 'Analysis result unavailable';
    return res.json(payload);
  }
  Object.assign(payload, {
    score: result.score,
    match_level: result.match_level,
    reason: result.reason,
    analysis: JSON.parse(result.result_json),
  });
  res.json(payload);
}));

module.exports = { router };
