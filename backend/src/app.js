const express = require("express");
const cors = require("cors");

const { corsOrigins } = require("./config");
const {
  notFound,
  errorHandler,
} = require("./middleware/errors");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const publicApplicationRoutes = require("./routes/publicApplicationRoutes");
const cvRoutes = require("./routes/cvRoutes");

const app = express();

app.disable("x-powered-by");

app.use(cors({ origin: corsOrigins }));

app.use(express.json({ limit: "1mb" }));

/**
 * Health check.
 */
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "hirelume-backend",
    version: "0.3.0",
  })
);

/**
 * Authentication routes.
 */
app.use("/api/auth", authRoutes);

/**
 * Recruiter job routes.
 */
app.use("/api/jobs", jobRoutes);

/**
 * Public applicant routes.
 *
 * Applicants can submit an application without
 * creating a HIRELUME account.
 *
 * Final endpoint:
 * POST /public/jobs/:token/applications
 */
app.use("/public", publicApplicationRoutes);

/**
 * Authenticated application routes.
 */
app.use("/api/applications", applicationRoutes);

/**
 * CV management routes.
 */
app.use("/api/cvs", cvRoutes);

/**
 * Handle unknown routes.
 */
app.use(notFound);

/**
 * Central error handler.
 */
app.use(errorHandler);

module.exports = { app };