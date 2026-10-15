const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { createWorker } = require("tesseract.js");
const englishData = require("@tesseract.js-data/eng");

const parsePdf = async (input) => {
  const buffer = Buffer.isBuffer(input) ? input : await fs.readFile(input);
  const data = await pdfParse(buffer);
  return data.text;
};

const parseDocx = async (input) => {
  const result = await mammoth.extractRawText({
    ...(Buffer.isBuffer(input) ? { buffer: input } : { path: input }),
  });

  return result.value;
};

const cleanExtractedText = (text) => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const parseCV = async (input, mimeType) => {
  let extractedText;

  if (mimeType === "application/pdf") {
    extractedText = await parsePdf(input);
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    extractedText = await parseDocx(input);
  } else if (
    mimeType === "application/msword"
  ) {
    throw new Error(
      "Legacy .doc files are not supported by the current parser."
    );
  } else {
    throw new Error("Unsupported CV file type.");
  }

  return cleanExtractedText(extractedText);
};

const parseImageCv = async (input) => {
  const worker = await createWorker(englishData.code, 1, {
    langPath: englishData.langPath,
    gzip: englishData.gzip,
    cacheMethod: "none",
  });
  try {
    const result = await worker.recognize(input);
    return cleanExtractedText(String(result.data.text || ""));
  } finally {
    await worker.terminate();
  }
};

module.exports = {
  parseCV,
  parseImageCv,
};