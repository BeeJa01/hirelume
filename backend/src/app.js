const express = require('express');
const cors = require('cors');
const { corsOrigins } = require('./config');
const { notFound, errorHandler } = require('./middleware/errors');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const cvRoutes = require('./routes/cvRoutes');
const analysisRoutes = require('./routes/analysisRoutes');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'hirelume-backend', version: '0.3.0' }));
app.post('/test-body', (req, res) => {
  console.log('TEST BODY:', req.body);
  res.json({ received: req.body });
});
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/analysis', analysisRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
