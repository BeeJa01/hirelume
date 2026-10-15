const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
  password_hash: { type: String, required: true },
  role: { type: String, required: true, enum: ['recruiter', 'job_seeker'] },
  avatar_path: { type: String, default: null },
  avatar_mime_type: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp', null], default: null },
  avatar_updated_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);