const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const {
  processCV,
  enableBlindMode,
  downloadCV
} = require("../controllers/cvController");

const router = express.Router();

router.use(auth, authorize);

router.post(
  "/:cvId/process",
  processCV
);

router.post(
  "/:cvId/blind-mode",
  enableBlindMode
);

router.get(
  "/:cvId/download",
  downloadCV
);

module.exports = router;