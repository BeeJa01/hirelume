const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80, index: true },
  anonymous_id: { type: String, default: null, maxlength: 120 },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  occurred_at: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);
