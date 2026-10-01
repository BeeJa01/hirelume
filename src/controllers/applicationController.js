const fs = require("fs");
const Application = require("../models/Application");

const getApplicationCV = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(
      applicationId
    ).populate("cv");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (!application.cv) {
      return res.status(404).json({
        message: "No CV is attached to this application",
      });
    }

    const cv = application.cv;

    /*
     * Applicant requesting their own application CV.
     */
    const isApplicant =
      application.applicant.toString() ===
      req.user._id.toString();

    if (isApplicant) {
      if (!fs.existsSync(cv.storagePath)) {
        return res.status(404).json({
          message: "CV file not found",
        });
      }

      return res.download(
        cv.storagePath,
        cv.originalName
      );
    }

    /*
     * Recruiter authorization.
     */
    if (req.user.role !== "recruiter") {
      return res.status(403).json({
        message: "You are not authorized to access this CV",
      });
    }

    /*
     * APPLICATION-level Blind Mode.
     */
    if (application.blindMode === true) {
      if (!cv.blindData) {
        return res.status(409).json({
          message:
            "Blind Mode is enabled, but the blind CV has not been generated.",
        });
      }

      return res.status(200).json({
        applicationId: application._id,
        blindMode: true,
        cv: {
          text: cv.blindData.text,
        },
      });
    }

    /*
     * Blind Mode is disabled.
     */
    if (!fs.existsSync(cv.storagePath)) {
      return res.status(404).json({
        message: "CV file not found",
      });
    }

    return res.download(
      cv.storagePath,
      cv.originalName
    );
  } catch (error) {
    console.error(
      "Application CV access error:",
      error
    );

    return res.status(500).json({
      message: "Failed to access application CV",
    });
  }
};


/*
 * Enable or disable Blind Mode for an application.
 */
const setBlindMode = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        message: "`enabled` must be true or false",
      });
    }

    const application =
      await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    /*
     * Only the applicant who owns the application
     * can change Blind Mode.
     */
    if (
      application.applicant.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Only the applicant can change Blind Mode",
      });
    }

    application.blindMode = enabled;

    await application.save();

    return res.status(200).json({
      message: enabled
        ? "Blind Mode enabled"
        : "Blind Mode disabled",

      applicationId: application._id,

      blindMode: application.blindMode,
    });
  } catch (error) {
    console.error(
      "Blind Mode update error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update Blind Mode",
    });
  }
};


module.exports = {
  getApplicationCV,
  setBlindMode,
};