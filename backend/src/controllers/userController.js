const path = require('node:path');
const { z } = require('zod');
const { User } = require('../models');
const { asyncRoute, validate } = require('../utils');
const fs = require('node:fs');
const { saveUserAvatar, removeUserAvatar, storedUserFilePath } = require('../services/userStorage');

const avatarSchema = z.object({
  avatar: z.any().optional(),
});

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function isImage(buffer, extension) {
  if (extension === '.png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === '.jpg' || extension === '.jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  return extension === '.webp' && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
}

const uploadAvatar = asyncRoute(async (req, res) => {
  const input = validate(avatarSchema, { avatar: req.file || null });
  if (!input.avatar) return res.status(422).json({ detail: 'AVATAR_REQUIRED' });

  const extension = path.extname(req.file.originalname || '').toLowerCase();
  if (!allowedExtensions.has(extension)) return res.status(400).json({ detail: 'AVATAR_UNSUPPORTED_FORMAT' });
  if (!req.file.buffer.length) return res.status(400).json({ detail: 'AVATAR_EMPTY' });
  if (!isImage(req.file.buffer, extension)) return res.status(400).json({ detail: 'AVATAR_INVALID_CONTENT' });

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ detail: 'USER_NOT_FOUND' });

  const previousPath = user.avatar_path;
  const avatarPath = await saveUserAvatar(req.file.buffer, extension);

  try {
    user.avatar_filename = path.basename(req.file.originalname || `avatar${extension}`);
    user.avatar_path = avatarPath;
    user.avatar_mime_type = mimeTypes[extension];
    user.avatar_uploaded_at = new Date();
    await user.save();
    if (previousPath) await removeUserAvatar(previousPath);
    return res.json({
      avatar_path: avatarPath,
      avatar_filename: user.avatar_filename,
      avatar_mime_type: user.avatar_mime_type,
      avatar_uploaded_at: user.avatar_uploaded_at,
      avatar_url: '/api/users/me/avatar',
    });
  } catch (error) {
    await removeUserAvatar(avatarPath);
    throw error;
  }
});

const getAvatar = asyncRoute(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  const filePath = user?.avatar_path && storedUserFilePath(user.avatar_path);
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ detail: 'AVATAR_NOT_FOUND' });
  res.type(user.avatar_mime_type || 'application/octet-stream');
  return res.sendFile(filePath);
});

const removeAvatar = asyncRoute(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ detail: 'USER_NOT_FOUND' });
  const previousPath = user.avatar_path;
  user.avatar_filename = null;
  user.avatar_path = null;
  user.avatar_mime_type = null;
  user.avatar_uploaded_at = null;
  await user.save();
  if (previousPath) await removeUserAvatar(previousPath);
  return res.json({ message: 'Avatar removed' });
});

module.exports = { uploadAvatar, getAvatar, removeAvatar };
