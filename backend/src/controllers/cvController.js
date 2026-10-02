const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { z } = require('zod');
const { Job, Application, CV, AnalysisResult } = require('../models');
const { asyncRoute, now, token, validate } = require('../utils');
const { saveCv, removeCv, storedFilePath } = require('../services/fileStorage');
const { safeFilename } = require('../utils/sanitize');

const applicationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().email().max(255),
  phone: z.string().trim().min(1).max(50),
  consent: z.enum(['true', 'false', '1', '0']).transform((value) => value === 'true' || value === '1'),
  consent_version: z.string().min(1).max(50),
});
const allowedExtensions = new Set(['.pdf', '.docx']);

const getPublicJob = asyncRoute(async (req, res) => {
  const job = await Job.findOne({ public_token: req.params.token }).lean();
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  res.json({
    status: job.status,
    id: String(job._id),
    title: job.title,
    description: job.description,
    requirements: job.requirements.map(({ text, requirement_type }) => ({ text, type: requirement_type })),
  });
});

const submitApplication = asyncRoute(async (req, res) => {
  const input = validate(applicationSchema, req.body);
  const job = await Job.findOne({ public_token: req.params.token });
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  if (job.status === 'closed') return res.status(409).json({ detail: 'JOB_CLOSED' });
  if (!input.consent) return res.status(400).json({ detail: 'CONSENT_REQUIRED' });

  const email = input.email.trim().toLowerCase();
  if (await Application.exists({ job_id: job._id, email })) {
    return res.status(409).json({ detail: 'DUPLICATE_APPLICATION' });
  }
  if (!req.file) return res.status(422).json({ detail: 'CV_REQUIRED' });

  const extension = path.extname(req.file.originalname || '').toLowerCase();
  if (!allowedExtensions.has(extension)) return res.status(400).json({ detail: 'CV_UNSUPPORTED_FORMAT' });
  if (!req.file.buffer.length) return res.status(400).json({ detail: 'CV_EMPTY' });
  const isPdf = extension === '.pdf' && req.file.buffer.subarray(0, 5).toString() === '%PDF-';
  const isDocx = extension === '.docx' && req.file.buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  if (!isPdf && !isDocx) return res.status(400).json({ detail: 'CV_INVALID_CONTENT' });

  const cvPath = await saveCv(req.file.buffer, extension);
  let application;
  let cv;
  try {
    application = await Application.create({
      job_id: job._id,
      name: input.name,
      email,
      phone: input.phone,
      cv_locked: true,
      consent_given: true,
      consent_version: input.consent_version,
      consent_at: now(),
      private_result_token: token(48),
      analysis_status: 'pending',
      applied_at: now(),
    });
    cv = await CV.create({
      application_id: application._id,
      filename: safeFilename(req.file.originalname || `cv${extension}`),
      storage_path: cvPath,
      content_type: req.file.mimetype || 'application/octet-stream',
      size_bytes: req.file.size,
    });
    application.cv_id = cv._id;
    await application.save();
    job.requirements_locked = true;
    await job.save();
    res.json({
      application_id: String(application._id),
      analysis_status: application.analysis_status,
      result_token: application.private_result_token,
      message: 'Application received',
    });
  } catch (error) {
    if (cv) await CV.deleteOne({ _id: cv._id });
    if (application) await Application.deleteOne({ _id: application._id });
    await removeCv(cvPath);
    if (error.code === 11000) return res.status(409).json({ detail: 'DUPLICATE_APPLICATION' });
    throw error;
  }
});

const downloadCv = asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const application = await Application.findById(req.params.id).lean();
  if (!application) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const job = await Job.exists({ _id: application.job_id, recruiter_id: req.user._id });
  if (!job) return res.status(404).json({ detail: 'APPLICATION_NOT_FOUND' });
  const cv = await CV.findOne({ application_id: application._id }).lean();
  const filePath = cv && storedFilePath(cv.storage_path);
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ detail: 'CV_NOT_FOUND' });
  res.type(cv.content_type).download(filePath, cv.filename);
});

const getResult = asyncRoute(async (req, res) => {
  const application = await Application.findOne({ private_result_token: req.params.token }).lean();
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
});

module.exports = { getPublicJob, submitApplication, downloadCv, getResult };
