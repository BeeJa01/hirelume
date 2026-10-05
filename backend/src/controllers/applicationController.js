const fs = require("fs");
const crypto = require("crypto");

const Application = require("../models/Application");
const CV = require("../models/CV");
const Job = require("../models/Job");

/**
 * Create a public job application.
 *
 * Applicants do not need a HIRELUME account.
 *
 * Expected route:
 * POST /public/jobs/:token/applications
 *
 * Expected form fields:
 * - fullName
 * - email
 * - phone
 * - consent
 *
 * Expected file:
 * - cv
 *
 * Important:
 * The application is saved before any AI processing happens.
 * This means an AI failure will not delete the applicant's submission.
 */
const createPublicApplication = async (req, res) => {
  try {
    const { token } = req.params;
    const { fullName, email, phone, consent } = req.body;

    // Make sure all required applicant information was provided.
    if (!fullName || !email || !phone) {
      return res.status(400).json({
        message: "Full name, email and phone are required",
      });
    }

    // The applicant must explicitly give consent before submitting
    // their personal information and CV.
    if (
      consent !== true &&
      consent !== "true" &&
      consent !== "on"
    ) {
      return res.status(400).json({
        message: "Consent is required before applying",
      });
    }

    // The CV must be included in the multipart/form-data request.
    if (!req.file) {
      return res.status(400).json({
        message: "CV file is required",
      });
    }

    // Find the job using the public token generated for its shareable link.
    const job = await Job.findOne({
      public_token: token,
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    // Applicants cannot apply to a closed job.
    if (job.status !== "open") {
      return res.status(400).json({
        message: "This job is no longer accepting applications",
      });
    }

    // Normalize the email before checking for duplicate applications.
    const normalizedEmail = email.trim().toLowerCase();

    // Prevent the same email from applying to the same job more than once.
    const existingApplication = await Application.findOne({
      job: job._id,
      email: normalizedEmail,
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "An application with this email already exists for this job",
      });
    }

    /**
     * Create the CV record first so the application can reference it.
     *
     * The uploaded file has already been saved by Multer into the
     * private CV storage directory.
     */
    const cv = await CV.create({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,

      // Public applicants do not have a User account.
      applicant: null,

      // The CV becomes locked after submission.
      locked: true,

      parsingStatus: "pending",
    });

    /**
     * Create the application.
     *
     * The private result token can later be used to give the applicant
     * access to their analysis results without exposing their data publicly.
     */
    const application = await Application.create({
      job: job._id,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),

      cv: cv._id,

      consentGivenAt: new Date(),

      // Keep the consent version explicit so the team can update the
      // privacy wording later without losing which version was accepted.
      consentVersion: "1.0",

      status: "submitted",
      analysisStatus: "pending",

      privateResultToken: crypto.randomBytes(32).toString("hex"),
    });

    // Connect the CV back to its application.
    cv.application = application._id;
    await cv.save();

    return res.status(201).json({
      message: "Application submitted successfully",

      applicationId: application._id,

      // The frontend can use this later when displaying the applicant's
      // analysis/result page.
      resultToken: application.privateResultToken,

      analysisStatus: application.analysisStatus,
    });
  } catch (error) {
    console.error("Public application creation error:", error);

    // If MongoDB reports a duplicate application despite our earlier
    // check, return a clear response instead of a generic server error.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An application with this email already exists for this job",
      });
    }

    return res.status(500).json({
      message: "Failed to submit application",
    });
  }
};

/**
 * Get the CV attached to an application.
 *
 * Recruiters must be authenticated.
 * Applicants can access their own CV through the appropriate
 * authenticated flow when applicable.
 */
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

    // This endpoint requires authentication.
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    /**
     * Recruiters are allowed to access application CVs.
     *
     * Blind Mode handling will be connected to the final recruiter
     * screening implementation.
     */
    if (req.user.role !== "recruiter") {
      return res.status(403).json({
        message: "You are not authorized to access this CV",
      });
    }

    // When Blind Mode is active, return the blind version instead
    // of exposing the original CV.
    if (cv.blindMode === true) {
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

    if (!cv.storagePath || !fs.existsSync(cv.storagePath)) {
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

/**
 * Enable or disable Blind Mode for an application.
 *
 * This remains available for the existing recruiter/application
 * functionality and can be refined when the screening flow is completed.
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

    const application = await Application.findById(
      applicationId
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Only recruiters should control screening-related Blind Mode.
    if (req.user.role !== "recruiter") {
      return res.status(403).json({
        message: "Only recruiters can change Blind Mode",
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
  createPublicApplication,
  getApplicationCV,
  setBlindMode,
};