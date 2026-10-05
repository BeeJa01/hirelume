const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    // The job this application belongs to.
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    // Applicant information is stored directly because public applicants
    // do not need a HIRELUME account to apply.
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    // Reference to the private CV document stored for this application.
    cv: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CV",
      required: true,
    },

    // Records exactly when the applicant gave consent.
    consentGivenAt: {
      type: Date,
      required: true,
    },

    // Stores the version of the privacy/consent wording the applicant agreed to.
    consentVersion: {
      type: String,
      required: true,
    },

    // Recruiter-controlled application status.
    // AI must never automatically change this status.
    status: {
      type: String,
      enum: [
        "submitted",
        "reviewing",
        "shortlisted",
        "interview",
        "rejected",
        "hired",
      ],
      default: "submitted",
    },

    // Used later when the AI analysis begins.
    // The application must remain saved even if analysis fails.
    analysisStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      default: "pending",
    },

    // Used to give an applicant secure access to their results later
    // without exposing the application through a public ID.
    privateResultToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Records when the application was submitted.
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same email address from applying to the same job twice.
// The combination of job + email must be unique.
applicationSchema.index(
  { job: 1, email: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);