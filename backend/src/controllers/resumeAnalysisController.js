const mongoose = require('mongoose');
const { z } = require('zod');
const CV = require('../models/CV');
const JobDescription = require('../models/JobDescription');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const {
  ResumeAiError,
  generateInterviewQuestions,
  generateResumeAnalysis,
} = require('../services/resumeAi');

const analysisRequestSchema = z.object({
  cvId: z.string().min(1),
  jobDescriptionId: z.string().min(1),
}).strict();

function sendError(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

function formatAnalysis(analysis, jobDescription) {
  return {
    id: String(analysis._id),
    score: analysis.score,
    matchLevel: analysis.matchLevel,
    summary: analysis.summary,
    breakdown: analysis.breakdown,
    matchedKeywords: analysis.matchedKeywords,
    missingKeywords: analysis.missingKeywords,
    strengths: analysis.strengths,
    gaps: analysis.gaps,
    suggestions: analysis.suggestions,
    questions: analysis.questions || [],
    jobDescription: jobDescription ? {
      title: jobDescription.title || null,
      company: jobDescription.company || null,
    } : null,
    createdAt: analysis.createdAt,
  };
}

function handleAiError(res, error) {
  if (!(error instanceof ResumeAiError)) return false;
  const status = error.code === 'AI_NOT_CONFIGURED' ? 503
    : error.code === 'AI_RATE_LIMITED' ? 429
      : error.code === 'AI_TIMEOUT' ? 504
        : error.code === 'AI_INVALID_RESPONSE' ? 502 : 503;
  sendError(res, status, error.code, error.message);
  return true;
}

async function createResumeAnalysis(req, res) {
  const parsed = analysisRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 422, 'VALIDATION_ERROR', 'Provide a CV and job description to analyse.');
  }
  const { cvId, jobDescriptionId } = parsed.data;
  if (
    !mongoose.Types.ObjectId.isValid(cvId)
    || !mongoose.Types.ObjectId.isValid(jobDescriptionId)
  ) {
    return sendError(res, 404, 'ANALYSIS_INPUT_NOT_FOUND', 'The CV or job description could not be found.');
  }

  try {
    const [cv, jobDescription] = await Promise.all([
      CV.findOne({ _id: cvId, applicant: req.user._id, isActive: true }),
      JobDescription.findOne({ _id: jobDescriptionId, user_id: req.user._id }),
    ]);
    if (!cv || !cv.parsedText) {
      return sendError(res, 404, 'CV_NOT_FOUND', 'Upload a readable CV before running an analysis.');
    }
    if (!jobDescription) {
      return sendError(res, 404, 'JOB_DESCRIPTION_NOT_FOUND', 'Save a job description before running an analysis.');
    }

    const generated = await generateResumeAnalysis(cv.parsedText, jobDescription.rawText);
    const analysis = await ResumeAnalysis.create({
      user_id: req.user._id,
      cv_id: cv._id,
      job_description_id: jobDescription._id,
      ...generated,
    });
    return res.status(201).json({
      success: true,
      analysis: formatAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    if (handleAiError(res, error)) return;
    console.error('Resume analysis failed:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Could not analyse your CV. Please try again.');
  }
}

async function generateAnalysisQuestions(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.analysisId)) {
    return sendError(res, 404, 'ANALYSIS_NOT_FOUND', 'Analysis not found.');
  }

  try {
    const analysis = await ResumeAnalysis.findOne({
      _id: req.params.analysisId,
      user_id: req.user._id,
    });
    if (!analysis) return sendError(res, 404, 'ANALYSIS_NOT_FOUND', 'Analysis not found.');

    const [cv, jobDescription] = await Promise.all([
      CV.findOne({ _id: analysis.cv_id, applicant: req.user._id }),
      JobDescription.findOne({ _id: analysis.job_description_id, user_id: req.user._id }),
    ]);
    if (!cv?.parsedText || !jobDescription) {
      return sendError(res, 404, 'ANALYSIS_INPUT_NOT_FOUND', 'The CV or job description could not be found.');
    }

    const questions = await generateInterviewQuestions(
      cv.parsedText,
      jobDescription.rawText,
      analysis,
    );
    analysis.questions = questions;
    await analysis.save();
    return res.json({ success: true, questions });
  } catch (error) {
    if (handleAiError(res, error)) return;
    console.error('Interview question generation failed:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Could not generate interview questions. Please try again.');
  }
}

async function getResumeAnalysis(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.analysisId)) {
    return sendError(res, 404, 'ANALYSIS_NOT_FOUND', 'Analysis not found.');
  }
  try {
    const analysis = await ResumeAnalysis.findOne({
      _id: req.params.analysisId,
      user_id: req.user._id,
    });
    if (!analysis) return sendError(res, 404, 'ANALYSIS_NOT_FOUND', 'Analysis not found.');
    const jobDescription = await JobDescription.findOne({
      _id: analysis.job_description_id,
      user_id: req.user._id,
    });
    return res.json({
      success: true,
      analysis: formatAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    console.error('Could not load resume analysis:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Could not load the analysis. Please try again.');
  }
}

async function listResumeAnalyses(req, res) {
  try {
    const analyses = await ResumeAnalysis.find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const jobIds = [...new Set(analyses.map((item) => String(item.job_description_id)))];
    const jobDescriptions = await JobDescription.find({
      _id: { $in: jobIds },
      user_id: req.user._id,
    }).select('title company').lean();
    const jobsById = new Map(jobDescriptions.map((job) => [String(job._id), job]));
    return res.json({
      success: true,
      analyses: analyses.map((analysis) => formatAnalysis(
        analysis,
        jobsById.get(String(analysis.job_description_id)),
      )),
    });
  } catch (error) {
    console.error('Could not load analysis history:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Could not load your analyses. Please try again.');
  }
}

module.exports = {
  createResumeAnalysis,
  generateAnalysisQuestions,
  getResumeAnalysis,
  listResumeAnalyses,
};
