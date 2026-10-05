const express = require("express");
const authenticate = require("../middleware/auth");

const {
  getApplicationCV,
  setBlindMode,
} = require("../controllers/applicationController");

const router = express.Router();

/**
 * Get the CV attached to an application.
 *
 * Authentication is required because application CVs
 * contain private applicant information.
 */
router.get(
  "/:applicationId/cv",
  authenticate,
  getApplicationCV
);

/**
 * Enable or disable Blind Mode for an application.
 */
router.patch(
  "/:applicationId/blind-mode",
  authenticate,
  setBlindMode
);

module.exports = router;