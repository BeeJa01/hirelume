const maskEmailAddresses = (text) => {
  return text.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[EMAIL REMOVED]"
  );
};

const maskPhoneNumbers = (text) => {
  return text.replace(
    /(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)/g,
    "[PHONE REMOVED]"
  );
};

const maskUrls = (text) => {
  return text.replace(
    /\b(?:https?:\/\/|www\.)[^\s]+/gi,
    "[URL REMOVED]"
  );
};

const maskContactLabels = (text) => {
  return text.replace(
    /(\b(?:email|e-mail|phone|mobile|telephone|tel|address|location)\s*[:\-]?\s*)[^\n]*/gi,
    "$1[REMOVED]"
  );
};

const maskName = (text) => {
  const lines = text.split("\n");

  if (lines.length === 0) {
    return text;
  }

  const firstMeaningfulLineIndex = lines.findIndex(
    (line) => line.trim().length > 0
  );

  if (firstMeaningfulLineIndex === -1) {
    return text;
  }

  lines[firstMeaningfulLineIndex] = "CANDIDATE";

  return lines.join("\n");
};

const createBlindVersion = (parsedText) => {
  if (!parsedText || typeof parsedText !== "string") {
    throw new Error("CV text is required for Blind Mode.");
  }

  let blindText = parsedText;

  blindText = maskUrls(blindText);
  blindText = maskEmailAddresses(blindText);
  blindText = maskPhoneNumbers(blindText);
  blindText = maskContactLabels(blindText);
  blindText = maskName(blindText);

  return blindText.trim();
};

module.exports = {
  createBlindVersion,
};