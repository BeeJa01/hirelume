const express = require('express');
const { Job, Application, AnalysisResult } = require('../core/db');
const { asyncRoute } = require('../core/utils');

const router = express.Router();

router.get('/:privateToken', asyncRoute(async (req, res) => {
  const application = await Application.findOne({ private_result_token: req.params.privateToken }).lean();
  if (!application) return res.status(404).json({ detail: 'INVALID_RESULT_TOKEN' });
  const job = await Job.findById(application.job_id).select('feedback_enabled').lean();
  const payload = {
    application_id: String(application._id),
    analysis_status: application.analysis_status,
    feedback_enabled: Boolean(job?.feedback_enabled),
  };
  if (application.analysis_status !== 'completed') {
    payload.message = ['pending', 'processing', 'queued'].includes(application.analysis_status)
      ? 'Analysis pending'
      : 'Analysis unavailable';
    return res.json(payload);
  }
  const result = await AnalysisResult.findOne({ application_id: application._id }).sort({ created_at: -1 }).lean();
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
