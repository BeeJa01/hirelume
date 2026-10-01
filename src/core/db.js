const mongoose = require('mongoose');
const { config } = require('./config');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
  password_hash: { type: String, required: true },
  role: { type: String, required: true, enum: ['recruiter', 'job_seeker'] },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const requirementSchema = new Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  requirement_type: { type: String, required: true, enum: ['required', 'nice_to_have'], default: 'required' },
  position: { type: Number, required: true, default: 0 },
}, { _id: true });

const statusHistorySchema = new Schema({
  actor_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  old_status: { type: String, required: true },
  new_status: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
}, { _id: false });

const jobSchema = new Schema({
  recruiter_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true },
  feedback_enabled: { type: Boolean, default: true },
  blind_mode: { type: Boolean, default: false },
  requirements_locked: { type: Boolean, default: false },
  requirements: { type: [requirementSchema], default: [] },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  public_token: { type: String, required: true, unique: true },
  closed_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const applicationSchema = new Schema({
  job_id: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 255 },
  phone: { type: String, required: true, trim: true, maxlength: 50 },
  cv_filename: { type: String, required: true, maxlength: 255 },
  cv_path: { type: String, required: true, maxlength: 500 },
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
}, { timestamps: false });
applicationSchema.index({ job_id: 1, email: 1 }, { unique: true });

const analysisResultSchema = new Schema({
  application_id: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  score: { type: Number, required: true },
  match_level: { type: String, required: true },
  reason: { type: String, required: true },
  result_json: { type: String, required: true },
  prompt_version: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
const AnalysisResult = mongoose.models.AnalysisResult || mongoose.model('AnalysisResult', analysisResultSchema);

async function connectDatabase() {
  await mongoose.connect(config.mongoUri);
  await Promise.all([User, Job, Application, AnalysisResult].map((model) => model.init()));
}

async function closeDatabase() {
  await mongoose.disconnect();
}

module.exports = { mongoose, User, Job, Application, AnalysisResult, connectDatabase, closeDatabase };
