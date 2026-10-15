const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { avatarUploadDirectory } = require('../config');

const avatarDirectory = path.resolve(process.cwd(), avatarUploadDirectory);

function safeAvatarPath(filePath) {
  const resolved = path.resolve(filePath || '');
  const relative = path.relative(avatarDirectory, resolved);
  if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
  return resolved;
}

async function saveAvatar(buffer, extension) {
  await fs.mkdir(avatarDirectory, { recursive: true });
  const filePath = path.join(avatarDirectory, `${crypto.randomBytes(24).toString('hex')}${extension}`);
  await fs.writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 });
  return filePath;
}

async function removeAvatar(filePath) {
  const resolved = safeAvatarPath(filePath);
  if (!resolved) throw new Error('Invalid avatar storage path');
  await fs.unlink(resolved);
}

async function readAvatar(filePath) {
  const resolved = safeAvatarPath(filePath);
  if (!resolved) throw new Error('Invalid avatar storage path');
  return fs.readFile(resolved);
}

module.exports = { removeAvatar, readAvatar, safeAvatarPath, saveAvatar };
