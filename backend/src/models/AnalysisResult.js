const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema({
  application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true, index: true },
  score: { type: Number, required: true },
  match_level: { type: String, required: true },
  reason: { type: String, required: true },
  result_json: { type: String, required: true },
  prompt_version: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.models.AnalysisResult || mongoose.model('AnalysisResult', analysisResultSchema);
