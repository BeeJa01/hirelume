const express = require("express");
const { getResultByToken } = require("../controllers/resultController");

const router = express.Router();

router.get("/:token", getResultByToken);

module.exports = router;
