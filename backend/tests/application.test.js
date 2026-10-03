const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const testUri = process.env.MONGODB_TEST_URI;
const temporaryDirectory = fsSync.mkdtempSync(path.join(os.tmpdir(), 'hirelume-api-'));
process.env.UPLOAD_DIR = path.join(temporaryDirectory, 'cvs');
process.env.SECRET_KEY = 'test-secret-for-automated-tests';
if (testUri) process.env.MONGODB_URI = testUri;

const request = require('supertest');
const { app } = require('../src/app');
let models;

before(async () => {
  if (!testUri) return;
  models = require('../src/models');
  await require('../src/config/db').connectDatabase();
});

beforeEach(async () => {
  if (!models) return;
  await Promise.all([
    models.AnalysisResult.deleteMany({}),
    models.CV.deleteMany({}),
    models.Application.deleteMany({}),
    models.Job.deleteMany({}),
    models.User.deleteMany({}),
  ]);
});

after(async () => {
  if (models) await require('../src/config/db').closeDatabase();
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
});

async function register(email = 'recruiter@example.com') {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Test Recruiter', email, password: 'test-password-123', role: 'recruiter',
  });
  assert.equal(response.status, 200, response.text);
  return response.body.access_token;
}

async function createJob(accessToken) {
  const response = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      title: 'Backend Engineer',
      description: 'Build and maintain backend services.',
      requirements: [{ text: 'Node.js experience' }],
    });
  assert.equal(response.status, 200, response.text);
  return response.body;
}

function apply(publicToken, email = 'candidate@example.com') {
  return request(app)
    .post(`/api/public/jobs/${publicToken}/applications`)
    .field('name', 'Test Candidate')
    .field('email', email)
    .field('phone', '555-0100')
    .field('consent', 'true')
    .field('consent_version', 'v1')
    .attach('cv', Buffer.from('%PDF-1.4 test'), 'resume.pdf');
}

test('recruiter can create a job, receive an application, and manage its status', { skip: !testUri && 'Set MONGODB_TEST_URI to run database integration tests' }, async () => {
  const accessToken = await register();
  const job = await createJob(accessToken);
  const publicJob = await request(app).get(`/api/public/jobs/${job.public_token}`);
  assert.equal(publicJob.status, 200);
  assert.equal(publicJob.body.requirements[0].text, 'Node.js experience');

  const application = await apply(job.public_token);
  assert.equal(application.status, 200, application.text);
  const id = application.body.application_id;
  const headers = { Authorization: `Bearer ${accessToken}` };
  assert.equal((await request(app).get('/api/auth/me').set(headers)).status, 200);
  assert.equal((await request(app).get(`/api/applications/${id}`).set(headers)).status, 200);
  assert.equal((await request(app).get(`/api/applications/${id}/cv`).set(headers)).status, 200);

  const status = await request(app).patch(`/api/applications/${id}/status`).set(headers).send({ status: 'shortlisted' });
  assert.equal(status.status, 200);
  const history = await request(app).get(`/api/applications/${id}/status-history`).set(headers);
  assert.equal(history.status, 200);
  assert.equal(history.body.length, 1);
  const result = await request(app).get(`/api/results/${application.body.result_token}`);
  assert.equal(result.status, 200);
  assert.equal(result.body.analysis_status, 'pending');
});

test('registration validates passwords and duplicate applications are rejected', { skip: !testUri && 'Set MONGODB_TEST_URI to run database integration tests' }, async () => {
  const invalid = await request(app).post('/api/auth/register').send({
    name: 'Recruiter', email: 'long@example.com', password: 'x'.repeat(73), role: 'recruiter',
  });
  assert.equal(invalid.status, 422);
  const job = await createJob(await register());
  assert.equal((await apply(job.public_token)).status, 200);
  assert.equal((await apply(job.public_token)).status, 409);
});

test('application rejects invalid consent and CV files', { skip: !testUri && 'Set MONGODB_TEST_URI to run database integration tests' }, async () => {
  const job = await createJob(await register());
  const url = `/api/public/jobs/${job.public_token}/applications`;
  const fields = { name: 'Candidate', email: 'candidate@example.com', phone: '555-0100', consent_version: 'v1' };
  const noConsent = await request(app).post(url).field({ ...fields, consent: 'false' }).attach('cv', Buffer.from('%PDF-test'), 'resume.pdf');
  assert.equal(noConsent.status, 400);
  const unsupported = await request(app).post(url).field({ ...fields, consent: 'true' }).attach('cv', Buffer.from('text'), 'resume.txt');
  assert.equal(unsupported.status, 400);
  const badPdf = await request(app).post(url).field({ ...fields, consent: 'true' }).attach('cv', Buffer.from('not a PDF'), 'resume.pdf');
  assert.equal(badPdf.status, 400);
  assert.equal(badPdf.body.detail, 'CV_INVALID_CONTENT');
  const empty = await request(app).post(url).field({ ...fields, consent: 'true' }).attach('cv', Buffer.alloc(0), 'empty.pdf');
  assert.equal(empty.status, 400);
  assert.equal(empty.body.detail, 'CV_EMPTY');
  const large = await request(app).post(url).field({ ...fields, consent: 'true' }).attach('cv', Buffer.alloc(5 * 1024 * 1024 + 1), 'large.pdf');
  assert.equal(large.status, 413);
});

test('another recruiter cannot read a job or applicant', { skip: !testUri && 'Set MONGODB_TEST_URI to run database integration tests' }, async () => {
  const job = await createJob(await register());
  const application = await apply(job.public_token);
  assert.equal(application.status, 200);
  const otherToken = await register('other@example.com');
  const headers = { Authorization: `Bearer ${otherToken}` };
  assert.equal((await request(app).get(`/api/jobs/${job.id}`).set(headers)).status, 404);
  assert.equal((await request(app).get(`/api/applications/${application.body.application_id}`).set(headers)).status, 404);
});

test('health check responds without a database connection', async () => {
  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('frontend origin is allowed by CORS', async () => {
  const response = await request(app).options('/api/auth/login')
    .set('Origin', 'http://localhost:5173')
    .set('Access-Control-Request-Method', 'POST');
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
});
