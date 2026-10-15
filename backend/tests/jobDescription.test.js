const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');

process.env.SECRET_KEY = 'job-description-test-secret';

const jobDescriptionOcr = require('../src/services/jobDescriptionOcr');
jobDescriptionOcr.extractTextFromImages = async (files) => {
  assert.equal(files.length, 1);
  return 'A suitable job description with qualifications and experience requirements for the successful applicant.';
};
const { app } = require('../src/app');
const { User } = require('../src/models');
const JobDescription = require('../src/models/JobDescription');

test('job description text can be saved for the authenticated user', async () => {
  const originalFindById = User.findById;
  const originalCreate = JobDescription.create;
  const userId = '64b000000000000000000001';
  const createdAt = new Date('2026-10-15T12:00:00.000Z');
  let savedInput;

  User.findById = async () => ({ _id: userId });
  JobDescription.create = async (input) => {
    savedInput = input;
    return { _id: '64b000000000000000000002', ...input, createdAt };
  };

  try {
    const token = jwt.sign({ sub: userId }, process.env.SECRET_KEY);
    const response = await request(app)
      .post('/api/job-descriptions')
      .set('Authorization', `Bearer ${token}`)
      .send({ rawText: '  Build and support customer-facing software products with a cross-functional engineering team.  ' });

    assert.equal(response.status, 201, response.text);
    assert.equal(savedInput.user_id, userId);
    assert.equal(savedInput.source, 'text');
    assert.equal(savedInput.rawText, 'Build and support customer-facing software products with a cross-functional engineering team.');
    assert.equal(response.body.source, 'text');
    assert.equal(response.body.rawText, savedInput.rawText);
    assert.equal(response.body.createdAt, createdAt.toISOString());
  } finally {
    User.findById = originalFindById;
    JobDescription.create = originalCreate;
  }
});

test('job description text shorter than 50 characters is rejected', async () => {
  const originalFindById = User.findById;
  User.findById = async () => ({ _id: '64b000000000000000000001' });

  try {
    const response = await request(app)
      .post('/api/job-descriptions')
      .set('Authorization', `Bearer ${jwt.sign({ sub: '64b000000000000000000001' }, process.env.SECRET_KEY)}`)
      .send({ rawText: 'Too short.' });

    assert.equal(response.status, 422);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'JOB_DESCRIPTION_TOO_SHORT');
    assert.equal(response.body.error.details[0].field, 'rawText');
  } finally {
    User.findById = originalFindById;
  }
});

test('job description creation requires authentication', async () => {
  const response = await request(app)
    .post('/api/job-descriptions')
    .send({ rawText: 'Build and support customer-facing software products with a cross-functional engineering team.' });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'UNAUTHORIZED');
});

test('screenshot OCR endpoint returns extracted text without saving it', async () => {
  const originalFindById = User.findById;
  User.findById = async () => ({ _id: '64b000000000000000000001' });

  try {
    const token = jwt.sign({ sub: '64b000000000000000000001' }, process.env.SECRET_KEY);
    const response = await request(app)
      .post('/api/job-descriptions/images/extract')
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'job.jpg');

    assert.equal(response.status, 200, response.text);
    assert.match(response.body.rawText, /job description/);
  } finally {
    User.findById = originalFindById;
  }
});

test('screenshot OCR endpoint rejects unsupported media types', async () => {
  const originalFindById = User.findById;
  User.findById = async () => ({ _id: '64b000000000000000000001' });

  try {
  const token = jwt.sign({ sub: '64b000000000000000000001' }, process.env.SECRET_KEY);
  const response = await request(app)
    .post('/api/job-descriptions/images/extract')
    .set('Authorization', `Bearer ${token}`)
    .attach('images', Buffer.from('not an image'), {
      filename: 'notes.txt',
      contentType: 'text/plain',
    });

  assert.equal(response.status, 415);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'UNSUPPORTED_FILE_TYPE');
  } finally {
    User.findById = originalFindById;
  }
});
