const mongoose = require('mongoose');

const flow2AnalysisSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  job_text: { type: String, default: '', maxlength: 50000 },
  job_link: { type: String, default: null, maxlength: 2000 },
  source_type: { type: String, required: true, enum: ['text', 'link', 'screenshots'] },
  cv_filename: { type: String, default: null, maxlength: 255 },
  cv_storage_path: { type: String, default: null, maxlength: 500 },
  cv_content_type: { type: String, default: null, maxlength: 120 },
  cv_size_bytes: { type: Number, default: null, min: 1 },
  status: {
    type: String,
    enum: ['awaiting_confirmation', 'awaiting_cv', 'pending', 'processing', 'completed', 'failed'],
    default: 'awaiting_confirmation',
    index: true,
  },
  attempts: { type: Number, default: 0 },
  quota_date: { type: String, default: null, index: true },
  quota_slot: { type: Number, default: null },
  score: { type: Number, default: null },
  match_level: { type: String, default: null },
  reason: { type: String, default: null },
  skills: { type: [String], default: [] },
  experience: { type: [String], default: [] },
  gaps: { type: [String], default: [] },
  guidance: { type: [String], default: [] },
  questions: { type: [String], default: [] },
  needs_review: { type: Boolean, default: false },
  result_json: { type: String, default: null },
  prompt_version: { type: String, default: null },
  analysis_updated_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

flow2AnalysisSchema.index({ user_id: 1, quota_date: 1 });
flow2AnalysisSchema.index(
  { user_id: 1, quota_date: 1, quota_slot: 1 },
  { unique: true, partialFilterExpression: { quota_slot: { $type: 'number' } } },
);

module.exports = mongoose.models.Flow2Analysis || mongoose.model('Flow2Analysis', flow2AnalysisSchema);
