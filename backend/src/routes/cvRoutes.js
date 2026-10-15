const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { uploadCv } = require("../middleware/cvUpload");

const {
  uploadOwnCv,
  getActiveCv,
  deleteActiveCv,
  processCV,
  enableBlindMode,
  downloadCV
} = require("../controllers/cvController");

const router = express.Router();

router.get("/active", auth, getActiveCv);
router.post("/active", auth, uploadCv.single("file"), uploadOwnCv);
router.delete("/active", auth, deleteActiveCv);

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

router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      error: { code: "FILE_TOO_LARGE", message: "CV files must be 5 MB or smaller." },
    });
  }
  if (error.code === "UNSUPPORTED_FILE_TYPE") {
    return res.status(415).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
  }
  console.error("CV request failed:", error);
  return res.status(500).json({
    success: false,
    error: { code: "SERVER_ERROR", message: "Could not process the CV request." },
  });
});

module.exports = router;