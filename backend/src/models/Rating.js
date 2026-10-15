const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null, index: true },
  value: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 1000 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

ratingSchema.index({ user_id: 1, application_id: 1 }, { unique: true });
module.exports = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);
