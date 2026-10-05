const path = require('node:path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

async function parseCv(buffer, filename = '') {
  const extension = path.extname(filename).toLowerCase();
  let text;
  if (extension === '.pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      text = (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  } else if (extension === '.docx') {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else {
    const error = new Error('Unsupported CV format');
    error.code = 'CV_UNSUPPORTED_FORMAT';
    throw error;
  }
  const normalized = String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!normalized) {
    const error = new Error('No readable text found in CV');
    error.code = 'CV_TEXT_EMPTY';
    throw error;
  }
  return normalized;
}

module.exports = { parseCv };
