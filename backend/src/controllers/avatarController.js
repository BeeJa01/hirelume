const { removeAvatar, readAvatar, saveAvatar } = require('../services/avatarStorage');
const { publicUser } = require('../utils');

const supportedAvatarTypes = new Map([
  ['image/jpeg', { extension: '.jpg', signature(buffer) {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  } }],
  ['image/png', { extension: '.png', signature(buffer) {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  } }],
  ['image/webp', { extension: '.webp', signature(buffer) {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString() === 'RIFF'
      && buffer.subarray(8, 12).toString() === 'WEBP';
  } }],
]);

function sendError(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

async function uploadOwnAvatar(req, res) {
  const file = req.file;
  if (!file) return sendError(res, 422, 'AVATAR_REQUIRED', 'Choose a profile image to upload.');
  const format = supportedAvatarTypes.get(file.mimetype);
  if (!format || !format.signature(file.buffer)) {
    return sendError(res, 415, 'UNSUPPORTED_FILE_TYPE', 'The image contents are not a supported JPEG, PNG, or WebP.');
  }

  let avatarPath;
  const oldPath = req.user.avatar_path;
  const oldMimeType = req.user.avatar_mime_type;
  const oldUpdatedAt = req.user.avatar_updated_at;
  try {
    avatarPath = await saveAvatar(file.buffer, format.extension);
    req.user.avatar_path = avatarPath;
    req.user.avatar_mime_type = file.mimetype;
    req.user.avatar_updated_at = new Date();
    await req.user.save();
  } catch (error) {
    req.user.avatar_path = oldPath;
    req.user.avatar_mime_type = oldMimeType;
    req.user.avatar_updated_at = oldUpdatedAt;
    if (avatarPath) {
      await removeAvatar(avatarPath).catch((cleanupError) => {
        console.error('Could not clean up failed avatar upload:', cleanupError);
      });
    }
    console.error('Profile image upload failed:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Could not save your profile image. Please try again.');
  }

  if (oldPath) {
    await removeAvatar(oldPath).catch((error) => {
      console.error('Could not remove replaced profile image:', error);
    });
  }
  return res.json({ success: true, user: publicUser(req.user) });
}

async function getOwnAvatar(req, res) {
  if (!req.user.avatar_path || !req.user.avatar_mime_type) {
    return sendError(res, 404, 'AVATAR_NOT_FOUND', 'No profile image has been uploaded.');
  }
  try {
    const contents = await readAvatar(req.user.avatar_path);
    return res
      .set('Cache-Control', 'private, no-store')
      .type(req.user.avatar_mime_type)
      .send(contents);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return sendError(res, 404, 'AVATAR_NOT_FOUND', 'The profile image could not be found.');
    }
    console.error('Could not load profile image:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Could not load your profile image.');
  }
}

async function deleteOwnAvatar(req, res) {
  const oldPath = req.user.avatar_path;
  const oldUpdatedAt = req.user.avatar_updated_at;
  req.user.avatar_path = null;
  req.user.avatar_mime_type = null;
  req.user.avatar_updated_at = null;
  try {
    await req.user.save();
  } catch (error) {
    req.user.avatar_path = oldPath;
    req.user.avatar_updated_at = oldUpdatedAt;
    console.error('Could not remove profile image:', error);
    return sendError(res, 500, 'SERVER_ERROR', 'Could not remove your profile image.');
  }
  if (oldPath) {
    await removeAvatar(oldPath).catch((error) => {
      console.error('Could not clean up removed profile image:', error);
    });
  }
  return res.json({ success: true, user: publicUser(req.user) });
}

function avatarUploadError(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 413, 'FILE_TOO_LARGE', 'Profile images must be 2 MB or smaller.');
  }
  if (error.code === 'UNSUPPORTED_FILE_TYPE') {
    return sendError(res, 415, error.code, error.message);
  }
  return next(error);
}

module.exports = {
  avatarUploadError,
  deleteOwnAvatar,
  getOwnAvatar,
  uploadOwnAvatar,
};
