const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const privateCvDirectory = path.join(
  process.cwd(),
  "private",
  "cvs"
);

function ensureCvDirectory() {
  if (!fs.existsSync(privateCvDirectory)) {
    fs.mkdirSync(privateCvDirectory, {
      recursive: true,
    });
  }
}

function generateStoredFilename(originalName) {
  const extension = path.extname(originalName).toLowerCase();

  const randomName = crypto.randomBytes(32).toString("hex");

  return `${randomName}${extension}`;
}

function getCvStoragePath(filename) {
  return path.join(privateCvDirectory, filename);
}

module.exports = {
  privateCvDirectory,
  ensureCvDirectory,
  generateStoredFilename,
  getCvStoragePath,
};
