const express = require("express");
const authenicate = require("../middleware/auth");

const {
  getApplicationCV,
  setBlindMode
} = require("../controllers/applicationController");


const router = express.Router();

router.get(
  "/:applicationId/cv",
  authenicate,
  getApplicationCV
);

router.patch(
  "/:applicationId/blind-mode",
  authenicate,
  setBlindMode
);

module.exports = router;