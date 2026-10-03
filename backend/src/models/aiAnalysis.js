const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: false,
      index: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: false,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "fit_check",
        "cv_tips",
        "application_feedback",
        "interview_questions",
        "recruiter_ranking",
      ],
      required: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    model: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);