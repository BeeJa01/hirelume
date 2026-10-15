const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
  password_hash: { type: String, required: true },
  role: { type: String, required: true, enum: ['recruiter', 'job_seeker'] },
  avatar_filename: { type: String, default: null, maxlength: 255 },
  avatar_path: { type: String, default: null, maxlength: 500 },
  avatar_mime_type: { type: String, default: null, maxlength: 120 },
  avatar_uploaded_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);