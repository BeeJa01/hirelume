const fs = require("fs");

const CV = require("../models/CV");
const { parseCV } = require("../services/cvParser");
const {
  storedFilePath,
} = require("../services/fileStorage");
const { createBlindVersion } = require("../services/blindMode");

/**
 * Process a CV and extract its text.
 *
 * PDF and DOCX files are processed by the backend parser.
 * Image-based CV processing will be handled by the AI vision
 * service in the next stage.
 */
const processCV = async (req, res) => {
  try {
    const { cvId } = req.params;

    const cv = await CV.findById(cvId);

    if (!cv) {
      return res.status(404).json({
        message: "CV not found",
      });
    }

    if (!cv.storagePath || !fs.existsSync(cv.storagePath)) {
      return res.status(404).json({
        message: "CV file not found",
      });
    }

    cv.parsingStatus = "processing";
    await cv.save();

    try {
      // The parser needs both the file location and MIME type
      // to determine how the CV should be processed.
      const parsedText = await parseCV(
        cv.storagePath,
        cv.mimeType
      );

      cv.parsedText = parsedText;
      cv.parsingStatus = "completed";

      await cv.save();

      return res.status(200).json({
        message: "CV processed successfully",
        cvId: cv._id,
        parsingStatus: cv.parsingStatus,
      });
    } catch (parseError) {
      cv.parsingStatus = "failed";
      await cv.save();

      console.error("CV parsing error:", parseError);

      return res.status(422).json({
        message: "Failed to process CV",
        cvId: cv._id,
        parsingStatus: cv.parsingStatus,
      });
    }
  } catch (error) {
    console.error("CV processing error:", error);

    return res.status(500).json({
      message: "Failed to process CV",
    });
  }
};

/**
 * Generate a blind version of a processed CV.
 */
const enableBlindMode = async (req, res) => {
  try {
    const { cvId } = req.params;

    const cv = await CV.findById(cvId);

    if (!cv) {
      return res.status(404).json({
        message: "CV not found",
      });
    }

    if (!cv.parsedText) {
      return res.status(400).json({
        message: "CV must be processed before Blind Mode can be enabled",
      });
    }

    const blindData = createBlindVersion(cv.parsedText);

    cv.blindMode = true;
    cv.blindData = blindData;

    await cv.save();

    return res.status(200).json({
      message: "Blind Mode enabled",
      cvId: cv._id,
      blindMode: true,
    });
  } catch (error) {
    console.error("Blind Mode CV error:", error);

    return res.status(500).json({
      message: "Failed to enable Blind Mode",
    });
  }
};

/**
 * Download a CV.
 *
 * Applicants can download their own CV.
 * Recruiters receive the blind version when Blind Mode is enabled.
 */
const downloadCV = async (req, res) => {
  try {
    const { cvId } = req.params;

    const cv = await CV.findById(cvId);

    if (!cv) {
      return res.status(404).json({
        message: "CV not found",
      });
    }

    if (!cv.storagePath || !fs.existsSync(cv.storagePath)) {
      return res.status(404).json({
        message: "CV file not found",
      });
    }

    // Recruiters should receive the blind version when Blind Mode
    // has been enabled for the CV.
    if (
      req.user.role === "recruiter" &&
      cv.blindMode === true
    ) {
      if (!cv.blindData) {
        return res.status(409).json({
          message:
            "Blind Mode is enabled, but the blind CV has not been generated",
        });
      }

      return res.status(200).json({
        blindMode: true,
        cv: cv.blindData,
      });
    }

    return res.download(
      cv.storagePath,
      cv.originalName
    );
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