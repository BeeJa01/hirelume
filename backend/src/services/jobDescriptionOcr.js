const { createWorker } = require('tesseract.js');
const englishData = require('@tesseract.js-data/eng');

async function extractTextFromImages(files) {
  const worker = await createWorker(englishData.code, 1, {
    langPath: englishData.langPath,
    gzip: englishData.gzip,
    cacheMethod: 'none',
  });

  try {
    const extractedPages = [];
    for (const file of files) {
      const result = await worker.recognize(file.buffer);
      extractedPages.push(String(result.data.text || '').trim());
    }
    return extractedPages.filter(Boolean).join('\n\n').slice(0, 50000);
  } finally {
    await worker.terminate();
  }
}

module.exports = { extractTextFromImages };
