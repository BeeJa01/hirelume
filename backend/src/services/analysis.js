const fs = require('node:fs/promises');
const { z } = require('zod');
const { Application, Job, CV, AnalysisResult } = require('../models');
const { storedFilePath } = require('./fileStorage');
const { parseCv } = require('./cvParser');
const { applyBlindMode } = require('./blindMode');
const {
  analysisProvider, analysisMaxAttempts, geminiApiKey, geminiModel, groqApiKey, groqModel,
} = require('../config');

const resultSchema = z.object({
  score: z.number().min(0).max(100),
  match_level: z.enum(['strong', 'moderate', 'weak']),
  reason: z.string().min(1).max(2000),
  skills: z.array(z.string()).max(30).default([]),
  experience: z.array(z.string()).max(30).default([]),
  needs_review: z.boolean().default(false),
  guidance: z.array(z.string()).max(10).default([]),
  questions: z.array(z.string()).min(1).max(10),
});

function promptFor(job, cvText) {
  const requirements = job.requirements.map((item) => `- ${item.requirement_type}: ${item.text}`).join('\n');
  return `Evaluate this CV only against the job and requirements. Do not infer protected traits. Return JSON with score (0-100), match_level (strong|moderate|weak), reason, skills[], experience[], needs_review, guidance[], and questions[] (always include 3 useful interview questions).\n\nJOB\n${job.title}\n${job.description}\n${requirements}\n\nCV\n${cvText}`;
}

async function callGroq(prompt) {
  if (!groqApiKey) throw Object.assign(new Error('GROQ_API_KEY is not configured'), { permanent: true });
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: groqModel, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, temperature: 0 }),
  });
  if (!response.ok) throw new Error(`Groq request failed (${response.status})`);
  const body = await response.json();
  return JSON.parse(body.choices?.[0]?.message?.content || '{}');
}

async function callGemini(prompt) {
  if (!geminiApiKey) throw Object.assign(new Error('GEMINI_API_KEY is not configured'), { permanent: true });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } }),
  });
  if (!response.ok) throw new Error(`Gemini request failed (${response.status})`);
  const body = await response.json();
  return JSON.parse(body.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
}

async function generateAnalysis(prompt) {
  if (analysisProvider === 'groq') return callGroq(prompt);
  if (analysisProvider === 'gemini') return callGemini(prompt);
  throw Object.assign(new Error('ANALYSIS_PROVIDER must be gemini or groq'), { permanent: true });
}

async function analyzeApplication(applicationId) {
  const application = await Application.findById(applicationId);
  if (!application || application.analysis_status === 'completed') return;
  application.analysis_status = 'processing';
  application.analysis_attempts += 1;
  application.analysis_updated_at = new Date();
  await application.save();
  try {
    const [job, cv] = await Promise.all([Job.findById(application.job_id).lean(), CV.findOne({ application_id: application._id }).lean()]);
    const filePath = cv && storedFilePath(cv.storage_path);
    if (!job || !cv || !filePath) throw Object.assign(new Error('Application source data is missing'), { permanent: true });
    let cvText = await parseCv(await fs.readFile(filePath), cv.filename);
    if (job.blind_mode) cvText = applyBlindMode(cvText, application);
    const result = resultSchema.parse(await generateAnalysis(promptFor(job, cvText)));
    await AnalysisResult.findOneAndUpdate(
      { application_id: application._id },
      { ...result, result_json: JSON.stringify(result), prompt_version: 'flow1-v1' },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    Object.assign(application, {
      analysis_status: 'completed', analysis_score: result.score, match_level: result.match_level,
      reason: result.reason, skills: result.skills, experience: result.experience,
      needs_review: result.needs_review, analysis_updated_at: new Date(),
    });
    await application.save();
  } catch (error) {
    const retry = !error.permanent && application.analysis_attempts < analysisMaxAttempts;
    application.analysis_status = retry ? 'pending' : 'failed';
    application.analysis_updated_at = new Date();
    await application.save();
    if (retry) {
      const timer = setTimeout(() => analyzeApplication(application._id).catch(console.error), 1000 * (2 ** (application.analysis_attempts - 1)));
      timer.unref();
    } else {
      console.error(`Analysis failed for ${application._id}:`, error.message);
    }
  }
}

function queueAnalysis(applicationId) {
  if (!['gemini', 'groq'].includes(analysisProvider)) return;
  setImmediate(() => analyzeApplication(applicationId).catch(console.error));
}

async function recoverPendingAnalyses() {
  if (!['gemini', 'groq'].includes(analysisProvider)) return;
  const pending = await Application.find({ analysis_status: { $in: ['pending', 'processing'] }, analysis_attempts: { $lt: analysisMaxAttempts } }).select('_id').lean();
  pending.forEach(({ _id }) => queueAnalysis(_id));
}

module.exports = { analyzeApplication, generateAnalysis, queueAnalysis, recoverPendingAnalyses, resultSchema };
