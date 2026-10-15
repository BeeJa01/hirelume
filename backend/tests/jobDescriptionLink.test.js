const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const {
  LinkExtractionError,
  extractJobDescriptionFromLink,
  parseJobPostingHtml,
  validateAndNormalizeUrl,
} = require('../src/services/jobDescriptionLink');

test('job links must use public HTTP or HTTPS URLs', () => {
  assert.equal(validateAndNormalizeUrl('https://careers.example.com/jobs/engineer').protocol, 'https:');
  for (const url of [
    'file:///etc/passwd',
    'javascript:alert(1)',
    'http://localhost/jobs',
    'http://127.0.0.1/jobs',
    'http://10.0.0.2/jobs',
    'http://192.168.1.10/jobs',
    'http://[::1]/jobs',
    'http://service.internal/jobs',
    'https://user:pass@example.com/jobs',
  ]) {
    assert.throws(() => validateAndNormalizeUrl(url), LinkExtractionError, url);
  }
});

test('job posting HTML extracts clean text and discards navigation and scripts', () => {
  const text = parseJobPostingHtml(`
    <html><body>
      <header>Company navigation</header>
      <main>
        <h1>Senior Engineer job opening</h1>
        <p>Responsibilities include building reliable services and collaborating with product teams.</p>
        <p>Requirements include five years of experience, strong JavaScript skills, and system design.</p>
      </main>
      <script>const hiddenJobDescription = 'not readable content';</script>
      <footer>Privacy policy</footer>
    </body></html>
  `);
  assert.match(text, /Senior Engineer job opening/);
  assert.match(text, /Requirements include five years/);
  assert.doesNotMatch(text, /Company navigation|hiddenJobDescription|Privacy policy/);
});

test('empty, login-walled and non-job pages return distinct errors', () => {
  assert.throws(
    () => parseJobPostingHtml('<html><body><div id="app"></div><script>render later</script></body></html>'),
    (error) => error.code === 'CONTENT_NOT_FOUND',
  );
  assert.throws(
    () => parseJobPostingHtml('<main><h1>Sign in to view this job</h1><p>Please sign in or create an account to access this job opening.</p></main>'),
    (error) => error.code === 'LOGIN_REQUIRED',
  );
  assert.throws(
    () => parseJobPostingHtml('<main><h1>About our company</h1><p>We build software for teams around the world. Learn about our story and products.</p></main>'),
    (error) => error.code === 'NOT_A_JOB_POSTING',
  );
});

test('authenticated link extraction endpoint returns text and standard errors', async () => {
  process.env.SECRET_KEY = 'job-description-link-test-secret';
  const linkService = require('../src/services/jobDescriptionLink');
  const originalExtract = linkService.extractJobDescriptionFromLink;
  linkService.extractJobDescriptionFromLink = async (url) => {
    if (url === 'https://careers.example.com/jobs/engineer') {
      return 'A public job posting with responsibilities, qualifications, relevant skills, and application details.';
    }
    return originalExtract(url);
  };

  const { app } = require('../src/app');
  const { User } = require('../src/models');
  const originalFindById = User.findById;
  const userId = '64b000000000000000000001';
  User.findById = async () => ({ _id: userId });
  const token = jwt.sign({ sub: userId }, process.env.SECRET_KEY);

  try {
    const success = await request(app)
      .post('/api/job-descriptions/links/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://careers.example.com/jobs/engineer' });
    assert.equal(success.status, 200);
    assert.match(success.body.rawText, /responsibilities/);

    const rejected = await request(app)
      .post('/api/job-descriptions/links/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'http://127.0.0.1/private' });
    assert.equal(rejected.status, 422);
    assert.equal(rejected.body.success, false);
    assert.equal(rejected.body.error.code, 'INVALID_URL');
    assert.equal(typeof rejected.body.error.message, 'string');
  } finally {
    User.findById = originalFindById;
  }
});
