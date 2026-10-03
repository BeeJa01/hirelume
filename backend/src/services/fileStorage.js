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

/**
 * Save a CV buffer inside the private CV directory.
 */
async function saveCv(buffer, extension = "") {
  ensureCvDirectory();

  const normalizedExtension = extension.startsWith(".")
    ? extension.toLowerCase()
    : `.${extension.toLowerCase()}`;

  const filename = `${crypto.randomBytes(32).toString("hex")}${normalizedExtension}`;

  const filePath = getCvStoragePath(filename);

  await fs.promises.writeFile(filePath, buffer);

  return filePath;
}

/**
 * Check whether a stored CV path is inside
 * the private CV directory.
 *
 * Returns the resolved path when valid,
 * otherwise null.
 */
function storedFilePath(filePath) {
  const privateDirectory = path.resolve(privateCvDirectory);
  const resolvedPath = path.resolve(filePath);

  const relativePath = path.relative(
    privateDirectory,
    resolvedPath
  );

  // Reject paths outside privateCvDirectory.
  if (
    relativePath === "" ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return resolvedPath;
}

/**
 * Remove a stored CV.
 */
async function removeCv(filePath) {
  const safePath = storedFilePath(filePath);

  if (!safePath) {
    throw new Error("Invalid CV storage path");
  }

  await fs.promises.unlink(safePath);
}

module.exports = {
  privateCvDirectory,
  ensureCvDirectory,
  generateStoredFilename,
  getCvStoragePath,
  saveCv,
  removeCv,
  storedFilePath,
};