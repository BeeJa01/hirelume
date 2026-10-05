const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema(
  {
    // Optional because public applicants do not have HIRELUME accounts.
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // Links the CV to the application that owns it.
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      index: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    storedName: {
      type: String,
      required: true,
      unique: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    storagePath: {
      type: String,
      required: true,
    },

    // Prevents the CV from being replaced after application submission.
    locked: {
      type: Boolean,
      default: false,
    },

    parsingStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      default: "pending",
    },

    parsedText: {
      type: String,
      default: null,
    },

    blindMode: {
      type: Boolean,
      default: false,
    },

    blindData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.CV ||
  mongoose.model("CV", cvSchema);