const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
  filename: { type: String, required: true, maxlength: 255 },
  storage_path: { type: String, required: true, maxlength: 500 },
  content_type: { type: String, required: true },
  size_bytes: { type: Number, required: true, min: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.models.CV || mongoose.model('CV', cvSchema);