const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const parsePdf = async (filePath) => {
  const buffer = await fs.readFile(filePath);

  const data = await pdfParse(buffer);

  return data.text;
};

const parseDocx = async (filePath) => {
  const result = await mammoth.extractRawText({
    path: filePath,
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

const parseCV = async (filePath, mimeType) => {
  let extractedText;

  if (mimeType === "application/pdf") {
    extractedText = await parsePdf(filePath);
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    extractedText = await parseDocx(filePath);
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

module.exports = {
  parseCV,
};