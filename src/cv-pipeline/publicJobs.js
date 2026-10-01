const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { z } = require('zod');
const { knex } = require('../core/db');
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
  const job = await knex('jobs').where({ public_token: req.params.token }).first();
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  const requirements = await knex('requirements').where({ job_id: job.id }).orderBy('position');
  res.json({
    status: job.status,
    id: job.id,
    title: job.title,
    description: job.description,
    requirements: requirements.map((row) => ({ text: row.text, type: row.requirement_type })),
  });
}));

router.post('/:token/applications', upload.single('cv'), asyncRoute(async (req, res) => {
  const input = validate(applicationSchema, req.body);
  const job = await knex('jobs').where({ public_token: req.params.token }).first();
  if (!job) return res.status(404).json({ detail: 'JOB_NOT_FOUND' });
  if (job.status === 'closed') return res.status(409).json({ detail: 'JOB_CLOSED' });
  if (!input.consent) return res.status(400).json({ detail: 'CONSENT_REQUIRED' });

  const email = input.email.trim().toLowerCase();
  if (await knex('applications').where({ job_id: job.id, email }).first()) {
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
  try {
    const [application] = await knex.transaction(async (trx) => {
      const rows = await trx('applications').insert({
        job_id: job.id,
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
      }).returning('*');
      await trx('jobs').where({ id: job.id }).update({ requirements_locked: true, updated_at: now() });
      return rows;
    });
    res.json({
      application_id: application.id,
      analysis_status: application.analysis_status,
      result_token: application.private_result_token,
      message: 'Application received',
    });
  } catch (error) {
    await removeCv(cvPath);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
      return res.status(409).json({ detail: 'DUPLICATE_APPLICATION' });
    }
    throw error;
  }
}));

module.exports = { router };
