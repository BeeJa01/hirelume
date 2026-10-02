const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const temporaryDirectory = fsSync.mkdtempSync(path.join(os.tmpdir(), 'hirelume-cv-'));
process.env.UPLOAD_DIR = temporaryDirectory;
const { saveCv, removeCv, storedFilePath } = require('../src/services/fileStorage');
const { safeFilename } = require('../src/utils/sanitize');

test('CV files are stored privately and can be removed', async () => {
  const filePath = await saveCv(Buffer.from('%PDF-test'), '.pdf');
  assert.equal(storedFilePath(filePath), filePath);
  assert.deepEqual(await fs.readFile(filePath), Buffer.from('%PDF-test'));
  await removeCv(filePath);
  await assert.rejects(fs.access(filePath));
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
});

test('stored paths outside private CV storage are rejected', () => {
  assert.equal(storedFilePath(path.join(temporaryDirectory, '..', 'outside.pdf')), null);
});

test('uploaded filenames are reduced to safe names', () => {
  assert.equal(safeFilename('../../my cv.pdf'), 'my_cv.pdf');
  assert.equal(safeFilename(''), 'cv');
});

test.todo('Parse text from valid PDF and DOCX CV files');
