const path = require('node:path');
const mongoose = require('mongoose');
const { z } = require('zod');
const { Flow2Analysis } = require('../models');
const { flow2DailyLimit } = require('../config');
const { asyncRoute, validate } = require('../utils');
const { safeFilename } = require('../utils/sanitize');
const { saveCv, removeCv } = require('../services/fileStorage');
const { parseCv } = require('../services/cvParser');
const { queueFlow2Analysis } = require('../services/flow2Analysis');
const { extractJobTextFromLink, extractJobTextFromScreenshots } = require('../services/flow2Source');

const inputSchema = z.object({
  job_text: z.string().trim().max(50000).optional().default(''),
  job_link: z.union([z.literal(''), z.string().url().max(2000)]).optional().transform((value) => value || null),
});
const confirmationSchema = z.object({ job_text: z.string().trim().min(50).max(50000) });
const allowedCvExtensions = new Set(['.pdf', '.docx']);
const cvContentTypes = { '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const quotaDate = () => new Date().toISOString().slice(0, 10);

function files(req, field) {
  return Array.isArray(req.files?.[field]) ? req.files[field] : [];
}

function serialize(analysis) {
  const payload = {
    id: String(analysis._id), status: analysis.status, source_type: analysis.source_type,
    job_text: analysis.job_text, job_link: analysis.job_link, attempts: analysis.attempts,
    created_at: analysis.created_at, analysis_updated_at: analysis.analysis_updated_at,
  };
  if (analysis.status === 'completed') Object.assign(payload, {
    score: analysis.score, match_level: analysis.match_level, reason: analysis.reason,
    skills: analysis.skills, experience: analysis.experience, gaps: analysis.gaps,
    guidance: analysis.guidance, questions: analysis.questions, needs_review: analysis.needs_review,
  });
  return payload;
}

function validateScreenshot(file) {
  if (!allowedImageTypes.has(file.mimetype)) return false;
  const bytes = file.buffer;
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.length >= 12 && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  return png || jpeg || webp;
}

async function validateCv(file) {
  if (!file) return { error: [422, 'CV_REQUIRED'] };
  const extension = path.extname(file.originalname || '').toLowerCase();
  if (!allowedCvExtensions.has(extension)) return { error: [400, 'CV_UNSUPPORTED_FORMAT'] };
  if (!file.buffer.length) return { error: [400, 'CV_EMPTY'] };
  const isPdf = extension === '.pdf' && file.buffer.subarray(0, 5).toString() === '%PDF-';
  const isDocx = extension === '.docx' && file.buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  if (!isPdf && !isDocx) return { error: [400, 'CV_INVALID_CONTENT'] };
  try {
    await parseCv(file.buffer, file.originalname);
  } catch {
    return { error: [422, 'CV_UNREADABLE'] };
  }
  return { extension, filename: safeFilename(file.originalname || `cv${extension}`), contentType: cvContentTypes[extension] };
}

async function claimDailyQuota(analysis, values = {}) {
  for (let slot = 1; slot <= flow2DailyLimit; slot += 1) {
    try {
      const claimed = await Flow2Analysis.findOneAndUpdate(
        { _id: analysis._id, user_id: analysis.user_id, status: analysis.status },
        { $set: { ...values, status: 'pending', quota_date: quotaDate(), quota_slot: slot, analysis_updated_at: new Date() } },
        { returnDocument: 'after', runValidators: true },
      );
      return claimed || null;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  return false;
}

async function resolveJobSource(input, screenshots) {
  const selected = Number(Boolean(input.job_text)) + Number(Boolean(input.job_link)) + Number(screenshots.length > 0);
  if (selected !== 1) return { error: [422, selected ? 'JOB_SOURCE_CONFLICT' : 'JOB_CONTEXT_REQUIRED'] };
  if (input.job_text) {
    if (input.job_text.length < 50) return { error: [422, 'JOB_TEXT_TOO_SHORT'] };
    return { sourceType: 'text', jobText: input.job_text, jobLink: null };
  }
  if (input.job_link) {
    try {
      return { sourceType: 'link', jobText: await extractJobTextFromLink(input.job_link), jobLink: input.job_link };
    } catch {
      return { error: [422, 'JOB_LINK_UNREADABLE'] };
    }
  }
  if (screenshots.some((file) => !validateScreenshot(file))) return { error: [400, 'SCREENSHOT_INVALID_CONTENT'] };
  try {
    return { sourceType: 'screenshots', jobText: await extractJobTextFromScreenshots(screenshots), jobLink: null };
  } catch {
    return { error: [422, 'SCREENSHOT_TEXT_UNREADABLE'] };
  }
}

const createAnalysis = asyncRoute(async (req, res) => {
  const input = validate(inputSchema, req.body);
  const source = await resolveJobSource(input, files(req, 'screenshots'));
  if (source.error) return res.status(source.error[0]).json({ detail: source.error[1] });

  const cvFile = files(req, 'cv')[0];
  let cvData = {};
  let cvPath = null;
  if (cvFile) {
    const checked = await validateCv(cvFile);
    if (checked.error) return res.status(checked.error[0]).json({ detail: checked.error[1] });
    cvPath = await saveCv(cvFile.buffer, checked.extension);
    cvData = { cv_filename: checked.filename, cv_storage_path: cvPath, cv_content_type: checked.contentType, cv_size_bytes: cvFile.size };
  }
  try {
    const analysis = await Flow2Analysis.create({
      user_id: req.user._id, source_type: source.sourceType, job_text: source.jobText,
      job_link: source.jobLink, ...cvData, status: 'awaiting_confirmation',
    });
    return res.status(201).json({ ...serialize(analysis), daily_limit: flow2DailyLimit });
  } catch (error) {
    if (cvPath) await removeCv(cvPath);
    throw error;
  }
});

const confirmAnalysis = asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ detail: 'FLOW2_ANALYSIS_NOT_FOUND' });
  const input = validate(confirmationSchema, req.body);
  const analysis = await Flow2Analysis.findOne({ _id: req.params.id, user_id: req.user._id });
  if (!analysis) return res.status(404).json({ detail: 'FLOW2_ANALYSIS_NOT_FOUND' });
  if (analysis.status !== 'awaiting_confirmation') return res.status(409).json({ detail: 'FLOW2_ALREADY_CONFIRMED' });
  if (!analysis.cv_storage_path) {
    analysis.job_text = input.job_text;
    analysis.status = 'awaiting_cv';
    analysis.analysis_updated_at = new Date();
    await analysis.save();
    return res.json({ ...serialize(analysis), daily_limit: flow2DailyLimit });
  }
  const claimed = await claimDailyQuota(analysis, { job_text: input.job_text });
  if (claimed === null) return res.status(409).json({ detail: 'FLOW2_ALREADY_CONFIRMED' });
  if (!claimed) return res.status(429).json({ detail: 'FLOW2_DAILY_LIMIT_REACHED', daily_limit: flow2DailyLimit });
  queueFlow2Analysis(claimed._id);
  return res.json({ ...serialize(claimed), daily_limit: flow2DailyLimit });
});

const uploadAnalysisCv = asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ detail: 'FLOW2_ANALYSIS_NOT_FOUND' });
  const analysis = await Flow2Analysis.findOne({ _id: req.params.id, user_id: req.user._id });
  if (!analysis) return res.status(404).json({ detail: 'FLOW2_ANALYSIS_NOT_FOUND' });
  if (analysis.status !== 'awaiting_cv') return res.status(409).json({ detail: 'FLOW2_NOT_AWAITING_CV' });
  const checked = await validateCv(req.file);
  if (checked.error) return res.status(checked.error[0]).json({ detail: checked.error[1] });
  const cvPath = await saveCv(req.file.buffer, checked.extension);
  const claimed = await claimDailyQuota(analysis, {
    cv_filename: checked.filename, cv_storage_path: cvPath,
    cv_content_type: checked.contentType, cv_size_bytes: req.file.size,
  });
  if (!claimed) {
    await removeCv(cvPath);
    if (claimed === null) return res.status(409).json({ detail: 'FLOW2_NOT_AWAITING_CV' });
    return res.status(429).json({ detail: 'FLOW2_DAILY_LIMIT_REACHED', daily_limit: flow2DailyLimit });
  }
  queueFlow2Analysis(claimed._id);
  return res.json({ ...serialize(claimed), daily_limit: flow2DailyLimit });
});

const retryAnalysis = asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ detail: 'FLOW2_ANALYSIS_NOT_FOUND' });
  const analysis = await Flow2Analysis.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user._id, status: 'failed' },
    { $set: { status: 'pending', attempts: 0, analysis_updated_at: new Date() } },
    { returnDocument: 'after' },
  );
  if (!analysis) return res.status(409).json({ detail: 'FLOW2_NOT_RETRYABLE' });
  queueFlow2Analysis(analysis._id);
  return res.json(serialize(analysis));
});

const getAnalysis = asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ detail: 'FLOW2_ANALYSIS_NOT_FOUND' });
  const analysis = await Flow2Analysis.findOne({ _id: req.params.id, user_id: req.user._id }).lean();
  if (!analysis) return res.status(404).json({ detail: 'FLOW2_ANALYSIS_NOT_FOUND' });
  return res.json(serialize(analysis));
});

module.exports = { createAnalysis, confirmAnalysis, uploadAnalysisCv, retryAnalysis, getAnalysis };
