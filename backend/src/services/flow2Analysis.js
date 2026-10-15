const fs = require('node:fs/promises');
const { z } = require('zod');
const { Flow2Analysis } = require('../models');
const { storedFilePath } = require('./fileStorage');
const { parseCv } = require('./cvParser');
const { generateAnalysis } = require('./analysis');
const { analysisProvider, analysisMaxAttempts } = require('../config');

const flow2ResultSchema = z.object({
  score: z.number().min(0).max(100),
  match_level: z.enum(['strong', 'moderate', 'weak']),
  reason: z.string().min(1).max(2000),
  skills: z.array(z.string()).max(30).default([]),
  experience: z.array(z.string()).max(30).default([]),
  gaps: z.array(z.string()).max(20).default([]),
  guidance: z.array(z.string()).max(10).default([]),
  questions: z.array(z.string()).min(1).max(10),
  needs_review: z.boolean().default(false),
});

function flow2Prompt(jobText, cvText) {
  return `Compare this CV with the confirmed job description. Do not infer protected traits. Return JSON with score (0-100), match_level (strong|moderate|weak), reason, skills[], experience[], gaps[], guidance[], questions[] (3 useful interview-preparation questions), and needs_review.\n\nJOB DESCRIPTION\n${jobText}\n\nCV\n${cvText}`;
}

async function analyzeFlow2(analysisId) {
  const analysis = await Flow2Analysis.findById(analysisId);
  if (!analysis || analysis.status === 'completed' || analysis.status === 'awaiting_confirmation') return;
  analysis.status = 'processing';
  analysis.attempts += 1;
  analysis.analysis_updated_at = new Date();
  await analysis.save();
  try {
    const filePath = storedFilePath(analysis.cv_storage_path);
    if (!filePath) throw Object.assign(new Error('Flow 2 CV is missing'), { permanent: true });
    const cvText = await parseCv(await fs.readFile(filePath), analysis.cv_filename);
    const result = flow2ResultSchema.parse(await generateAnalysis(flow2Prompt(analysis.job_text, cvText)));
    Object.assign(analysis, result, {
      status: 'completed',
      result_json: JSON.stringify(result),
      prompt_version: 'flow2-v1',
      analysis_updated_at: new Date(),
    });
    await analysis.save();
  } catch (error) {
    const retry = !error.permanent && analysis.attempts < analysisMaxAttempts;
    analysis.status = retry ? 'pending' : 'failed';
    analysis.analysis_updated_at = new Date();
    await analysis.save();
    if (retry) {
      const timer = setTimeout(() => analyzeFlow2(analysis._id).catch(console.error), 1000 * (2 ** (analysis.attempts - 1)));
      timer.unref();
    } else {
      console.error(`Flow 2 analysis failed for ${analysis._id}:`, error.message);
    }
  }
}

function queueFlow2Analysis(analysisId) {
  if (!['gemini', 'groq'].includes(analysisProvider)) return;
  setImmediate(() => analyzeFlow2(analysisId).catch(console.error));
}

async function recoverPendingFlow2Analyses() {
  if (!['gemini', 'groq'].includes(analysisProvider)) return;
  const pending = await Flow2Analysis.find({
    status: { $in: ['pending', 'processing'] },
    attempts: { $lt: analysisMaxAttempts },
  }).select('_id').lean();
  pending.forEach(({ _id }) => queueFlow2Analysis(_id));
}

module.exports = { analyzeFlow2, queueFlow2Analysis, recoverPendingFlow2Analyses, flow2ResultSchema };
