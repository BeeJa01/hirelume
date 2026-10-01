const path = require('node:path');

function safeFilename(filename) {
  const name = path.basename(String(filename || 'cv'));
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255) || 'cv';
}

module.exports = { safeFilename };
