const fs = require('node:fs/promises');
const path = require('node:path');
const { config } = require('../core/config');
const { token } = require('../core/utils');

function storedFilePath(filePath) {
  const root = path.resolve(config.uploadDirectory);
  const target = path.resolve(filePath);
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return target;
}

async function saveCv(buffer, extension) {
  const directory = path.resolve(config.uploadDirectory);
  await fs.mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `${token(16)}${extension}`);
  await fs.writeFile(filePath, buffer, { flag: 'wx' });
  return filePath;
}

async function removeCv(filePath) {
  const safePath = storedFilePath(filePath);
  if (safePath) await fs.unlink(safePath).catch(() => {});
}

module.exports = { saveCv, removeCv, storedFilePath };
