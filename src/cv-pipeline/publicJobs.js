const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { z } = require('zod');
const { Job, Application } = require('../core/db');
const { config } = require('../core/config');
const { asyncRoute, now, token, validate } = require('../core/utils');
const { saveCv, removeCv } = require('../privacy-files/storage');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024, files: 1 },
});
const applicationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().email().max(255),
  phone: z.string().trim().min(1).max(50),
  consent: z.enum(['true', 'false', '1', '0']).transform((value) => value === 'true' || value === '1'),
  consent_version: z.string().min(1).max(50),
});
const allowedExtensions = new Set(['.pdf', '.docx']);

router.get('/:token', asyncRoute(async (req, res) => {
  const job = await Job.findOne({ public_token: req.params.token }).lean();
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  res.json({
    status: job.status,
    id: String(job._id),
    title: job.title,
    description: job.description,
    requirements: job.requirements.map((row) => ({ text: row.text, type: row.requirement_type })),
  });
}));

router.post('/:token/applications', upload.single('cv'), asyncRoute(async (req, res) => {
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
  try {
    application = await Application.create({
      job_id: job._id,
      name: input.name,
      email,
      phone: input.phone,
      cv_filename: path.basename(req.file.originalname || `cv${extension}`),
      cv_path: cvPath,
      cv_locked: true,
      consent_given: true,
      consent_version: input.consent_version,
      consent_at: now(),
      private_result_token: token(48),
      analysis_status: 'pending',
      applied_at: now(),
    });
    job.requirements_locked = true;
    await job.save();
    res.json({
      application_id: String(application._id),
      analysis_status: application.analysis_status,
      result_token: application.private_result_token,
      message: 'Application received',
    });
  } catch (error) {
    if (application) await Application.deleteOne({ _id: application._id });
    await removeCv(cvPath);
    if (error.code === 11000) {
      return res.status(409).json({ detail: 'DUPLICATE_APPLICATION' });
    }
    throw error;
  }
}));

module.exports = { router };
