const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  requirement_type: { type: String, required: true, enum: ['required', 'nice_to_have'], default: 'required' },
  position: { type: Number, required: true, default: 0 },
});

const jobSchema = new mongoose.Schema({
  recruiter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);