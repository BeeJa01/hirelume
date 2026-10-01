const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { notFound, errorHandler } = require('./middleware/errors');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const cvRoutes = require('../cv-pipeline');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'hirelume-backend', version: '0.3.0' }));
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/public/jobs', cvRoutes.publicJobs);
app.use('/api/applications', cvRoutes.applications);
app.use('/api/results', cvRoutes.results);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
