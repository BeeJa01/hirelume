const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const externalTestUri = process.env.MONGODB_TEST_URI;
const { MongoMemoryServer } = require('mongodb-memory-server');
const temporaryDirectory = fsSync.mkdtempSync(path.join(os.tmpdir(), 'hirelume-api-'));
process.env.UPLOAD_DIR = path.join(temporaryDirectory, 'cvs');
process.env.USER_UPLOAD_DIR = path.join(temporaryDirectory, 'users');
process.env.SECRET_KEY = 'test-secret-for-automated-tests';
if (externalTestUri) process.env.MONGODB_URI = externalTestUri;

const request = require('supertest');
const { app } = require('../src/app');
let models;
let memoryServer;

before(async () => {
  models = require('../src/models');
  const testUri = externalTestUri || (memoryServer = await MongoMemoryServer.create()).getUri();
  await require('../src/config/db').mongoose.connect(testUri);
  await Promise.all(Object.values(models).map((model) => model.init()));
});

beforeEach(async () => {
  if (!models) return;
  await Promise.all([
    models.AnalysisResult.deleteMany({}),
    models.CV.deleteMany({}),
    models.Application.deleteMany({}),
    models.Job.deleteMany({}),
    models.User.deleteMany({}),
    models.RefreshToken.deleteMany({}),
    models.Rating.deleteMany({}),
    models.AnalyticsEvent.deleteMany({}),
  ]);
});

after(async () => {
  if (models) await require('../src/config/db').closeDatabase();
  if (memoryServer) await memoryServer.stop();
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
});

async function register(email = 'recruiter@example.com', role = 'recruiter') {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Test User', email, password: 'test-password-123', role,
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

test('recruiter can create a job, receive an application, and manage its status', async () => {
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

test('refresh tokens rotate and logout revokes the active refresh token', async () => {
  const registered = await request(app).post('/api/auth/register').send({
    name: 'Recruiter', email: 'refresh@example.com', password: 'test-password-123', role: 'recruiter',
  });
  const refreshed = await request(app).post('/api/auth/refresh').send({ refresh_token: registered.body.refresh_token });
  assert.equal(refreshed.status, 200, refreshed.text);
  assert.notEqual(refreshed.body.refresh_token, registered.body.refresh_token);
  assert.equal((await request(app).post('/api/auth/refresh').send({ refresh_token: registered.body.refresh_token })).status, 401);
  assert.equal((await request(app).post('/api/auth/logout').send({ refresh_token: refreshed.body.refresh_token })).status, 204);
  assert.equal((await request(app).post('/api/auth/refresh').send({ refresh_token: refreshed.body.refresh_token })).status, 401);
});

test('public consent, paging, account linking, feedback privacy, ratings, and deletion work', async () => {
  const recruiterToken = await register();
  const job = await createJob(recruiterToken);
  const publicJob = await request(app).get(`/api/public/jobs/${job.public_token}`);
  assert.equal(publicJob.body.consent.version, 'v1');
  const submitted = await request(app)
    .post(`/api/public/jobs/${job.public_token}/applications`)
    .field('name', 'Candidate').field('email', 'candidate@example.com').field('phone', '555-0100')
    .field('consent', 'true').field('consent_version', 'v1').field('feedback_opt_in', 'true')
    .attach('cv', Buffer.from('%PDF-1.4 test'), 'resume.pdf');
  assert.equal(submitted.status, 200, submitted.text);
  const id = submitted.body.application_id;
  const application = await models.Application.findById(id);
  application.analysis_status = 'completed';
  application.analysis_score = 88;
  application.match_level = 'strong';
  application.reason = 'Strong match';
  await application.save();
  await models.AnalysisResult.create({
    application_id: id, score: 88, match_level: 'strong', reason: 'Strong match', prompt_version: 'test',
    result_json: JSON.stringify({ questions: ['Tell us about Node.js'], guidance: ['Add metrics'], skills: ['Node.js'], experience: [] }),
  });
  const privateResult = await request(app).get(`/api/results/${submitted.body.result_token}`);
  assert.deepEqual(privateResult.body.questions, ['Tell us about Node.js']);
  assert.equal(privateResult.body.score, undefined);
  const seekerToken = await register('candidate@example.com', 'job_seeker');
  assert.equal((await request(app).post('/api/applications/link').set('Authorization', `Bearer ${seekerToken}`).send({ result_token: submitted.body.result_token })).status, 200);
  const ownedResult = await request(app).get(`/api/results/${submitted.body.result_token}`).set('Authorization', `Bearer ${seekerToken}`);
  assert.equal(ownedResult.body.score, 88);
  assert.deepEqual(ownedResult.body.guidance, ['Add metrics']);
  const list = await request(app).get(`/api/jobs/${job.id}/applications?page=1&page_size=10&status=undecided&sort=date`).set('Authorization', `Bearer ${recruiterToken}`);
  assert.equal(list.status, 200);
  assert.equal(list.body.total, 1);
  const detail = await request(app).get(`/api/applications/${id}`).set('Authorization', `Bearer ${recruiterToken}`);
  assert.equal(detail.body.cv_url, `/api/applications/${id}/cv`);
  assert.equal((await request(app).post('/api/ratings').set('Authorization', `Bearer ${seekerToken}`).send({ application_id: id, value: 5 })).status, 201);
  assert.equal((await request(app).post('/api/events').send({ name: 'result.viewed', anonymous_id: 'anonymous-123', properties: {} })).status, 202);
  assert.equal((await request(app).delete(`/api/applications/${id}`).set('Authorization', `Bearer ${seekerToken}`)).status, 204);
});

test('avatar content is checked and stored avatars can be retrieved', async () => {
  const token = await register();
  const headers = { Authorization: `Bearer ${token}` };
  const bad = await request(app).post('/api/users/me/avatar').set(headers).attach('avatar', Buffer.from('not an image'), 'avatar.png');
  assert.equal(bad.body.detail, 'AVATAR_INVALID_CONTENT');
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  assert.equal((await request(app).post('/api/users/me/avatar').set(headers).attach('avatar', png, 'avatar.png')).status, 200);
  assert.equal((await request(app).get('/api/users/me/avatar').set(headers)).status, 200);
  assert.equal((await request(app).delete('/api/users/me/avatar').set(headers)).status, 200);
});

test('registration validates passwords and duplicate applications are rejected', async () => {
  const invalid = await request(app).post('/api/auth/register').send({
    name: 'Recruiter', email: 'long@example.com', password: 'x'.repeat(73), role: 'recruiter',
  });
  assert.equal(invalid.status, 422);
  const job = await createJob(await register());
  assert.equal((await apply(job.public_token)).status, 200);
  assert.equal((await apply(job.public_token)).status, 409);
});

test('application rejects invalid consent and CV files', async () => {
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

test('another recruiter cannot read a job or applicant', async () => {
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
