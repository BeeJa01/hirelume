const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  actor_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  old_status: { type: String, required: true },
  new_status: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 255 },
  phone: { type: String, required: true, trim: true, maxlength: 50 },
  cv_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CV', default: null },
  cv_locked: { type: Boolean, default: true },
  consent_given: { type: Boolean, default: false },
  consent_version: { type: String, required: true, maxlength: 50 },
  consent_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['shortlisted', 'rejected', 'undecided'], default: 'undecided' },
  status_history: { type: [statusHistorySchema], default: [] },
  analysis_status: { type: String, default: 'pending' },
  analysis_attempts: { type: Number, default: 0 },
  private_result_token: { type: String, required: true, unique: true, index: true },
  analysis_score: { type: Number, default: null },
  match_level: { type: String, default: null },
  reason: { type: String, default: null },
  needs_review: { type: Boolean, default: false },
  applied_at: { type: Date, default: Date.now },
  analysis_updated_at: { type: Date, default: null },
});
applicationSchema.index({ job_id: 1, email: 1 }, { unique: true });

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);