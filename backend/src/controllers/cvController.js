const fs = require("fs");
const path = require("path");

const CV = require("../models/CV");
const { createBlindVersion } = require("../services/blindMode");
const { parseCV, parseImageCv } = require("../services/cvParser");
const { saveCv, removeCv } = require("../services/fileStorage");

const supportedCvTypes = new Map([
  [".pdf", "application/pdf"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

function sendCvError(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

function validUploadedCv(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (
    !supportedCvTypes.has(extension)
    || (file.mimetype !== supportedCvTypes.get(extension) && file.mimetype !== "application/octet-stream")
  ) return false;
  if (extension === ".pdf") return file.buffer.subarray(0, 5).toString() === "%PDF-";
  if (extension === ".docx") return file.buffer.subarray(0, 2).toString() === "PK";
  if ([".jpg", ".jpeg"].includes(extension)) {
    return file.buffer.length >= 3
      && file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  }
  if (extension === ".png") {
    return file.buffer.length >= 8 && file.buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  }
  return extension === ".webp"
    && file.buffer.length >= 12
    && file.buffer.subarray(0, 4).toString() === "RIFF"
    && file.buffer.subarray(8, 12).toString() === "WEBP";
}

function cvResponse(cv) {
  return {
    id: String(cv._id),
    fileName: cv.originalName,
    mimeType: cv.mimeType,
    size: cv.size,
    parsingStatus: cv.parsingStatus,
  };
}

const uploadOwnCv = async (req, res) => {
  const file = req.file;
  if (!file) return sendCvError(res, 422, "CV_REQUIRED", "Choose a CV file to continue.");
  if (!validUploadedCv(file)) {
    return sendCvError(res, 415, "UNSUPPORTED_FILE_TYPE", "The CV file type or contents are not supported.");
  }

  let parsedText;
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = supportedCvTypes.get(extension);
  try {
    parsedText = extension.startsWith(".")
      && [".jpg", ".jpeg", ".png", ".webp"].includes(extension)
      ? await parseImageCv(file.buffer)
      : await parseCV(file.buffer, mimeType);
  } catch (error) {
    console.error("CV text extraction failed:", error);
    return sendCvError(res, 422, "CV_UNREADABLE", "We could not read this CV. Try another PDF, DOCX, or image.");
  }
  if (!parsedText || parsedText.trim().length < 50) {
    return sendCvError(res, 422, "EMPTY_CV", "No readable CV text was found. Try a clearer image or a text-based PDF/DOCX.");
  }

  let storagePath;
  let previousActive;
  try {
    storagePath = await saveCv(file.buffer, extension);
    previousActive = await CV.findOne({ applicant: req.user._id, isActive: true });
    if (previousActive) {
      previousActive.isActive = false;
      await previousActive.save();
    }
    const cv = await CV.create({
      applicant: req.user._id,
      originalName: path.basename(file.originalname),
      storedName: path.basename(storagePath),
      mimeType,
      size: file.size,
      storagePath,
      parsedText,
      parsingStatus: "completed",
      isActive: true,
    });
    if (previousActive) {
      try {
        await CV.deleteOne({ _id: previousActive._id });
        if (previousActive.storagePath) {
          await removeCv(previousActive.storagePath);
        }
      } catch (error) {
        console.error("Could not remove replaced CV:", error);
      }
    }
    return res.status(201).json({ success: true, cv: cvResponse(cv) });
  } catch (error) {
    console.error("CV upload failed:", error);
    if (previousActive) {
      previousActive.isActive = true;
      await previousActive.save().catch((restoreError) => {
        console.error("Could not restore previous active CV:", restoreError);
      });
    }
    if (storagePath) {
      await removeCv(storagePath).catch((cleanupError) => {
        console.error("Could not clean up failed CV upload:", cleanupError);
      });
    }
    return sendCvError(res, 500, "SERVER_ERROR", "Could not save the CV. Please try again.");
  }
};

const getActiveCv = async (req, res) => {
  try {
    const cv = await CV.findOne({ applicant: req.user._id, isActive: true });
    return res.json({ success: true, cv: cv ? cvResponse(cv) : null });
  } catch (error) {
    console.error("Could not load active CV:", error);
    return sendCvError(res, 500, "SERVER_ERROR", "Could not load your CV. Please try again.");
  }
};

const deleteActiveCv = async (req, res) => {
  try {
    const cv = await CV.findOneAndDelete({ applicant: req.user._id, isActive: true });
    if (!cv) return sendCvError(res, 404, "CV_NOT_FOUND", "No active CV was found.");
    if (cv.storagePath) {
      try {
        await removeCv(cv.storagePath);
      } catch (error) {
        console.error("Could not remove deleted CV file:", error);
      }
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Could not remove active CV:", error);
    return sendCvError(res, 500, "SERVER_ERROR", "Could not remove your CV. Please try again.");
  }
};

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
  uploadOwnCv,
  getActiveCv,
  deleteActiveCv,
  processCV,
  enableBlindMode,
  downloadCV,
};