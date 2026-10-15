const express = require('express');
const cors = require('cors');
const { corsOrigins } = require('./config');
const { notFound, errorHandler } = require('./middleware/errors');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const cvRoutes = require('./routes/cvRoutes');
const jobDescriptionRoutes = require('./routes/jobDescriptionRoutes');
const resumeAnalysisRoutes = require('./routes/resumeAnalysisRoutes');

const app = express();
app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'hirelume-backend', version: '0.3.0' }));
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/job-descriptions', jobDescriptionRoutes);
app.use('/api/analyses', resumeAnalysisRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
