
const express = require("express");
const router = express.Router();

const {
  shortlistApplication,
} = require("../controllers/shortlistController");

const auth = require("../middleware/auth");

router.patch(
  "/:applicationId/shortlist",
  auth,
  shortlistApplication
);

module.exports = router;
