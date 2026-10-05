const express = require('express');
const cors = require('cors');
const { corsOrigins } = require('./config');
const { notFound, errorHandler } = require('./middleware/errors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const cvRoutes = require('./routes/cvRoutes');
const engagementRoutes = require('./routes/engagementRoutes');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'hirelume-backend', version: '0.3.0' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api', cvRoutes);
app.use('/api', engagementRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
