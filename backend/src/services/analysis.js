const {
  Application,
  Job,
  CV,
  AnalysisResult,
} = require('../models');

const config = require('../config');
const { parseCV } = require('./cvParser');
const { createBlindVersion } = require('./blindMode');
const { storedFilePath } = require('./fileStorage');
const { z } = require('zod');

const PROMPT_VERSION = 'hirelume-analysis-v1';

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

function buildPrompt(job, cvText) {
  const requirements = (job.requirements || []).map((item) => ({
    requirement: item.text,
    importance: item.requirement_type,
  }));

  return `You assist a recruiter by comparing a CV against a job.
Provide evidence-based assistance, not a hiring decision.

Rules:
- Return valid JSON only, with no Markdown fences.
- Assess only evidence in the supplied job and CV.
- Do not infer protected or sensitive personal characteristics.
- Do not penalize missing information as proof that a skill is absent.
- Explain uncertainty and identify information requiring human review.
- Never recommend automatic rejection.
- Score from 0 to 100 based on job-related evidence.
- match_level must be strong, moderate, or weak.
- Provide at least one practical interview question.

Required JSON shape:
{
  "score": 0,
  "match_level": "moderate",
  "reason": "Evidence-based explanation",
  "skills": ["Relevant evidenced skills"],
  "experience": ["Relevant evidenced experience"],
  "needs_review": false,
  "guidance": ["Suggested human follow-up"],
  "questions": ["Interview question"]
}

JOB TITLE:
${job.title}

JOB DESCRIPTION:
${job.description}

JOB REQUIREMENTS:
${JSON.stringify(requirements)}

CV TEXT:
${cvText.slice(0, 24000)}`;
}

async function callGroq(prompt) {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.groqModel,
        messages: [
          {
            role: 'system',
            content: 'Return only JSON matching the requested schema.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(60000),
    }
  );

  if (!response.ok) {
    throw new Error(`Groq request failed with HTTP ${response.status}.`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('Groq returned an empty response.');
  return content;
}

async function callGemini(prompt) {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(config.geminiModel)}:generateContent` +
    `?key=${encodeURIComponent(config.geminiApiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with HTTP ${response.status}.`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('');

  if (!content) throw new Error('Gemini returned an empty response.');
  return content;
}

async function generateAnalysis(prompt) {
  let content;

  if (config.analysisProvider === 'groq') {
    content = await callGroq(prompt);
  } else if (config.analysisProvider === 'gemini') {
    content = await callGemini(prompt);
  } else {
    throw new Error(
      'AI provider is not configured. Set ANALYSIS_PROVIDER to groq or gemini.'
    );
  }

  // Be tolerant if a provider wraps JSON in Markdown fences.
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI provider returned invalid JSON.');
  }

  return resultSchema.parse(parsed);
}

async function analyzeApplication(applicationId) {
  const application = await Application.findById(applicationId);
  if (!application) throw new Error('Application not found.');

  if (application.analysisStatus === 'completed') return;

  application.analysisStatus = 'processing';
  await application.save();

  try {
    const [job, cv] = await Promise.all([
      Job.findById(application.job),
      CV.findById(application.cv),
    ]);

    if (!job) throw new Error('The application job could not be found.');
    if (!cv) throw new Error('The application CV could not be found.');

    const safePath = storedFilePath(cv.storagePath);
    if (!safePath) {
      throw new Error('The stored CV path is outside private CV storage.');
    }

    cv.parsingStatus = 'processing';
    await cv.save();

    let cvText = await parseCV(safePath, cv.mimeType);

    if (!cvText.trim()) {
      throw new Error('No readable text was extracted from the CV.');
    }

    // Respect Blind Mode when it is enabled for the job or CV.
    if (job.blind_mode || cv.blindMode) {
      cvText = createBlindVersion(cvText);
    }

    cv.parsedText = cvText;
    cv.parsingStatus = 'completed';
    await cv.save();

    const prompt = buildPrompt(job, cvText);
    let result;
    let lastError;

    for (let attempt = 1; attempt <= config.analysisMaxAttempts; attempt += 1) {
      try {
        result = await generateAnalysis(prompt);
        break;
      } catch (error) {
        lastError = error;

        if (attempt < config.analysisMaxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (2 ** (attempt - 1)))
          );
        }
      }
    }

    if (!result) throw lastError || new Error('AI analysis failed.');

    await AnalysisResult.findOneAndUpdate(
      { application_id: application._id },
      {
        $set: {
          application_id: application._id,
          score: result.score,
          match_level: result.match_level,
          reason: result.reason,
          result_json: JSON.stringify(result),
          prompt_version: PROMPT_VERSION,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    // AI analysis must never change the recruiter's application decision.
    application.analysisStatus = 'completed';
    await application.save();

    console.log(`AI analysis completed for application ${application._id}`);
  } catch (error) {
    application.analysisStatus = 'failed';
    await application.save();

    // Do not log API keys, CV text, or provider response bodies.
    console.error(
      `AI analysis failed for application ${application._id}: ${error.message}`
    );
  }
}

function queueAnalysis(applicationId) {
  setImmediate(() => {
    analyzeApplication(applicationId).catch((error) => {
      console.error('Unexpected AI analysis error:', error.message);
    });
  });
}

async function recoverPendingAnalyses() {
  const pending = await Application.find({
    analysisStatus: { $in: ['pending', 'processing'] },
  }).select('_id');

  for (const application of pending) {
    queueAnalysis(application._id);
  }

  console.log(`Queued ${pending.length} pending AI analysis job(s).`);
}

module.exports = {
  analyzeApplication,
  generateAnalysis,
  queueAnalysis,
  recoverPendingAnalyses,
  resultSchema,
};
