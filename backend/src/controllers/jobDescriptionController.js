const { z } = require('zod');
const JobDescription = require('../models/JobDescription');
const { extractTextFromImages } = require('../services/jobDescriptionOcr');
const { extractJobDescriptionFromLink } = require('../services/jobDescriptionLink');

const createSchema = z.object({
  rawText: z.string().trim().min(50).max(50000),
  source: z.enum(['text', 'image', 'link']).default('text'),
  title: z.string().trim().min(1).max(200).optional(),
  company: z.string().trim().min(1).max(200).optional(),
}).strict();

function sendError(res, status, code, message, details) {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

async function createJobDescription(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    const tooShort = parsed.error.issues.some(
      (issue) => issue.path[0] === 'rawText' && issue.code === 'too_small',
    );
    const code = tooShort ? 'JOB_DESCRIPTION_TOO_SHORT' : 'VALIDATION_ERROR';
    const message = tooShort
      ? 'Job description must be at least 50 characters.'
      : 'Please check the submitted job description fields.';
    return sendError(res, 422, code, message, parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })));
  }

  try {
    const jobDescription = await JobDescription.create({
      user_id: req.user._id,
      ...parsed.data,
    });
    return res.status(201).json({
      id: String(jobDescription._id),
      source: jobDescription.source,
      rawText: jobDescription.rawText,
      title: jobDescription.title,
      company: jobDescription.company,
      createdAt: jobDescription.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to save job description:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Could not save the job description. Please try again.');
  }
}

function sendImageError(res, status, code, message) {
  return res.status(status).json({
    success: false,
    error: { code, message },
  });
}

function isSupportedImage(file) {
  const bytes = file.buffer;
  if (file.mimetype === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  }
  if (file.mimetype === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return file.mimetype === 'image/webp'
    && bytes.length >= 12
    && bytes.subarray(0, 4).toString() === 'RIFF'
    && bytes.subarray(8, 12).toString() === 'WEBP';
}

async function extractJobDescriptionImages(req, res) {
  const files = req.files || [];
  if (files.length === 0) {
    return sendImageError(res, 422, 'VALIDATION_ERROR', 'Select at least one screenshot.');
  }
  if (files.some((file) => !isSupportedImage(file))) {
    return sendImageError(
      res,
      415,
      'UNSUPPORTED_FILE_TYPE',
      'Only valid JPEG, PNG, and WebP screenshots are supported.',
    );
  }

  try {
    const rawText = await extractTextFromImages(files);
    if (rawText.trim().length < 50) {
      return sendImageError(
        res,
        422,
        'NO_TEXT_FOUND',
        'We could not read enough job-description text. Try clearer screenshots or paste the text instead.',
      );
    }
    return res.json({ rawText });
  } catch (error) {
    console.error('Job-description screenshot OCR failed:', error);
    return sendImageError(
      res,
      500,
      'OCR_FAILED',
      'We could not read those screenshots. Please try again or paste the text instead.',
    );
  }
}

const linkSchema = z.object({
  url: z.string().trim().min(1).max(2048),
}).strict();

async function extractJobDescriptionLink(req, res) {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 422, 'VALIDATION_ERROR', 'Provide a valid job-posting URL.', parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })));
  }

  try {
    const rawText = await extractJobDescriptionFromLink(parsed.data.url);
    return res.json({ rawText });
  } catch (error) {
    if (error.code && [
      'INVALID_URL',
      'LINK_UNREACHABLE',
      'LINK_TIMEOUT',
      'LOGIN_REQUIRED',
      'CONTENT_NOT_FOUND',
      'NOT_A_JOB_POSTING',
    ].includes(error.code)) {
      const status = error.code === 'INVALID_URL' ? 422
        : error.code === 'LINK_TIMEOUT' ? 504
          : error.code === 'LINK_UNREACHABLE' ? 502
            : error.code === 'LOGIN_REQUIRED' ? 403
              : error.code === 'NOT_A_JOB_POSTING' ? 422 : 422;
      return sendError(res, status, error.code, error.message);
    }

    console.error('Job-description link extraction failed:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Could not read the job link. Please try again.');
  }
}

module.exports = {
  createJobDescription,
  extractJobDescriptionImages,
  extractJobDescriptionLink,
};
