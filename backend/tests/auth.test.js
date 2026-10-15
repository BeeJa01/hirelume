const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const request = require('supertest');

const { User } = require('../src/models');
const { app } = require('../src/app');

const userId = '64b000000000000000000001';
const user = {
  _id: userId,
  name: 'Test Candidate',
  email: 'candidate@example.com',
  role: 'job_seeker',
};

test('registration returns a token and current-user endpoint accepts it', async () => {
  const originals = { create: User.create, findById: User.findById };
  User.create = async (input) => ({ ...user, ...input, _id: userId });
  User.findById = async () => user;

  try {
    const registered = await request(app).post('/api/auth/register').send({
      name: user.name,
      email: user.email,
      password: 'valid-password-123',
      role: user.role,
    });
    assert.equal(registered.status, 200, registered.text);
    assert.equal(registered.body.user.email, user.email);
    assert.equal(typeof registered.body.access_token, 'string');

    const currentUser = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registered.body.access_token}`);
    assert.equal(currentUser.status, 200, currentUser.text);
    assert.equal(currentUser.body.id, userId);
  } finally {
    User.create = originals.create;
    User.findById = originals.findById;
  }
});

test('authentication errors use the standard error shape and field validation details', async () => {
  const originals = { create: User.create, findOne: User.findOne };
  User.create = async () => {
    const error = new Error('duplicate');
    error.code = 11000;
    throw error;
  };
  User.findOne = async () => null;

  try {
    const invalid = await request(app).post('/api/auth/register').send({
      name: '',
      email: 'not-an-email',
      password: 'short',
      role: 'job_seeker',
    });
    assert.equal(invalid.status, 422);
    assert.equal(invalid.body.success, false);
    assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
    assert.equal(typeof invalid.body.error.details.email, 'string');
    assert.equal(typeof invalid.body.error.details.password, 'string');

    const duplicate = await request(app).post('/api/auth/register').send({
      name: user.name,
      email: user.email,
      password: 'valid-password-123',
      role: user.role,
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, 'EMAIL_ALREADY_EXISTS');

    const missing = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'valid-password-123',
    });
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.code, 'EMAIL_NOT_FOUND');
  } finally {
    User.create = originals.create;
    User.findOne = originals.findOne;
  }
});

test('wrong passwords are distinguished and auth attempts are rate limited', async () => {
  const originalFindOne = User.findOne;
  User.findOne = async () => ({
    ...user,
    password_hash: await bcrypt.hash('correct-password-123', 4),
  });

  try {
    const wrongPassword = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'incorrect-password',
    });
    assert.equal(wrongPassword.status, 401);
    assert.equal(wrongPassword.body.error.code, 'WRONG_PASSWORD');

    let limited;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await request(app).post('/api/auth/login').send({
        email: user.email,
        password: 'correct-password-123',
      });
      if (response.status === 429) limited = response;
    }
    assert.ok(limited, 'expected repeated auth requests to be rate limited');
    assert.equal(limited.body.success, false);
    assert.equal(limited.body.error.code, 'RATE_LIMIT_EXCEEDED');
  } finally {
    User.findOne = originalFindOne;
  }
});
