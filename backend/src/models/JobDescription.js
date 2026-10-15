const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  source: { type: String, required: true, enum: ['text', 'image', 'link'], default: 'text' },
  rawText: { type: String, required: true, trim: true, minlength: 50, maxlength: 50000 },
  title: { type: String, trim: true, maxlength: 200, default: null },
  company: { type: String, trim: true, maxlength: 200, default: null },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

module.exports = mongoose.models.JobDescription || mongoose.model('JobDescription', jobDescriptionSchema);
