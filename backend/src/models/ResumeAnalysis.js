const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cv_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CV', required: true, index: true },
  job_description_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    required: true,
    index: true,
  },
  score: { type: Number, required: true, min: 0, max: 100 },
  matchLevel: { type: String, required: true, enum: ['strong', 'good', 'partial'] },
  summary: { type: String, required: true, maxlength: 2000 },
  breakdown: {
    skills: { type: Number, required: true, min: 0, max: 100 },
    experience: { type: Number, required: true, min: 0, max: 100 },
    education: { type: Number, required: true, min: 0, max: 100 },
    keywords: { type: Number, required: true, min: 0, max: 100 },
  },
  matchedKeywords: { type: [String], required: true },
  missingKeywords: { type: [String], required: true },
  strengths: { type: [String], required: true },
  gaps: { type: [String], required: true },
  suggestions: { type: [String], required: true },
  questions: {
    type: [{
      category: { type: String, required: true, enum: ['technical', 'behavioral', 'cv_gaps'] },
      question: { type: String, required: true, maxlength: 500 },
      tip: { type: String, required: true, maxlength: 500 },
    }],
    default: [],
  },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

resumeAnalysisSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.models.ResumeAnalysis
  || mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
