const express = require("express");

const uploadCv = require("../middleware/upload");

const {
  createPublicApplication,
} = require("../controllers/applicationController");

const router = express.Router();

/**
 * Public application endpoint.
 *
 * Applicants do not need a HIRELUME account.
 *
 * The CV is uploaded using multipart/form-data.
 */
router.post(
  "/jobs/:token/applications",
  uploadCv.single("cv"),
  createPublicApplication
);

module.exports = router;