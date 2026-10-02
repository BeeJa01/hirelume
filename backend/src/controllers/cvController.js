const fs = require("fs");

const CV = require("../models/CV");
const { createBlindVersion } = require("../services/blindMode");
const { parseCV } = require("../services/cvParser");

// Process and parse an uploaded CV
const processCV = async (req, res) => {
  try {
    const { cvId } = req.params;

    const cv = req.cv || await CV.findById(cvId);

    if (!cv) {
      return res.status(404).json({
        message: "CV not found",
      });
    }

    if (!cv.storagePath) {
      return res.status(400).json({
        message: "CV storage path is missing",
      });
    }

    if (!fs.existsSync(cv.storagePath)) {
      return res.status(404).json({
        message: "CV file not found",
      });
    }

    if (typeof parseCV !== "function") {
      throw new Error(
        "parseCV is not exported correctly from cvParser.js"
      );
    }

    const parsedText = await parseCV(cv.storagePath);

    if (!parsedText || typeof parsedText !== "string") {
      return res.status(400).json({
        message: "Unable to extract text from CV",
      });
    }

    cv.parsedText = parsedText;
    await cv.save();

    return res.status(200).json({
      message: "CV processed successfully",
      cvId: cv._id,
    });
  } catch (error) {
    console.error("CV processing error:", error);

    return res.status(500).json({
      message: "Failed to process CV",
      error: error.message,
    });
  }
};

// Enable Blind Mode
const enableBlindMode = async (req, res) => {
  try {
    const cv = req.cv || await CV.findById(req.params.cvId);

    if (!cv) {
      return res.status(404).json({
        message: "CV not found",
      });
    }

    if (!cv.parsedText) {
      return res.status(400).json({
        message:
          "CV must be successfully parsed before Blind Mode can be enabled.",
      });
    }

    const blindText = createBlindVersion(cv.parsedText);

    cv.blindMode = true;
    cv.blindData = {
      text: blindText,
      generatedAt: new Date(),
    };

    await cv.save();

    return res.status(200).json({
      message: "Blind Mode enabled successfully",
      cvId: cv._id,
      blindMode: true,
    });
  } catch (error) {
    console.error("Blind Mode error:", error);

    return res.status(500).json({
      message: "Failed to enable Blind Mode",
      error: error.message,
    });
  }
};

// Download CV
const downloadCV = async (req, res) => {
  try {
    const cv = req.cv;

    if (!cv) {
      return res.status(404).json({
        message: "CV not found",
      });
    }

    // Applicants can download their original CV.
    if (req.isApplicant) {
      if (!cv.storagePath || !fs.existsSync(cv.storagePath)) {
        return res.status(404).json({
          message: "CV file not found",
        });
      }

      return res.download(cv.storagePath, cv.originalName);
    }

    // Return the redacted text to recruiters when Blind Mode is enabled.
    if (cv.blindMode) {
      return res.status(200).json({
        message: "Blind Mode is enabled for this CV",
        cvId: cv._id,
        blindMode: true,
        data: cv.blindData,
      });
    }

    if (!cv.storagePath || !fs.existsSync(cv.storagePath)) {
      return res.status(404).json({
        message: "CV file not found",
      });
    }

    return res.download(cv.storagePath, cv.originalName);
  } catch (error) {
    console.error("CV download error:", error);

    return res.status(500).json({
      message: "Failed to download CV",
    });
  }
};

module.exports = {
  processCV,
  enableBlindMode,
  downloadCV,
};