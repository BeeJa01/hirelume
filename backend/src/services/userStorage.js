const fs = require('node:fs/promises');
const path = require('node:path');
const { userUploadDirectory } = require('../config');
const { token } = require('../utils');

function storedUserFilePath(filePath) {
  const root = path.resolve(userUploadDirectory);
  const target = path.resolve(filePath);
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return target;
}

async function saveUserAvatar(buffer, extension) {
  const directory = path.resolve(userUploadDirectory);
  await fs.mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `${token(16)}${extension}`);
  await fs.writeFile(filePath, buffer, { flag: 'wx' });
  return filePath;
}

async function removeUserAvatar(filePath) {
  const safePath = storedUserFilePath(filePath);
  if (safePath) await fs.unlink(safePath).catch(() => {});
}

module.exports = { saveUserAvatar, removeUserAvatar, storedUserFilePath };
