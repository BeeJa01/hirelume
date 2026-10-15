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
const { parseCv } = require('../src/services/cvParser');
const JSZip = require('jszip');

function simplePdf(text) {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

async function simpleDocx(text) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`);
  return zip.generateAsync({ type: 'nodebuffer' });
}

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

test('parse text from valid PDF and DOCX CV files', async () => {
  assert.match(await parseCv(simplePdf('Backend Engineer'), 'resume.pdf'), /Backend Engineer/);
  assert.match(await parseCv(await simpleDocx('Node.js developer'), 'resume.docx'), /Node\.js developer/);
});
