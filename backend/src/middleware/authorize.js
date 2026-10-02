const CV = require("../models/CV");
const Application = require("../models/Application");

const authorize = async (req, res, next) => {
  try {
    const { cvId } = req.params;

    if (!cvId) {
      return res.status(400).json({
        message: "CV ID is required",
      });
    }

    const cv = await CV.findById(cvId);

    if (!cv) {
      return res.status(404).json({
        message: "CV not found",
      });
    }

    // Authentication middleware should populate req.user
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Applicant owns this CV
    const isApplicant =
      cv.applicant.toString() === req.user._id.toString();

    if (isApplicant) {
      req.cv = cv;
      req.isApplicant = true;

      return next();
    }

    // Check whether an application exists for this CV
    const application = await Application.findOne({
      cv: cv._id,
    });

    if (!application) {
      return res.status(403).json({
        message: "You are not authorized to access this CV",
      });
    }

    // Only recruiters can access an applicant's CV
    if (req.user.role !== "recruiter") {
      return res.status(403).json({
        message: "You are not authorized to access this CV",
      });
    }

    req.cv = cv;
    req.application = application;
    req.isApplicant = false;

    next();
  } catch (error) {
    console.error("CV authorization error:", error);

    return res.status(500).json({
      message: "Authorization check failed",
    });
  }
};

module.exports = authorize;