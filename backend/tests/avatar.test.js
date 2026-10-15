const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const temporaryRoot = fsSync.mkdtempSync(path.join(os.tmpdir(), 'hirelume-avatar-'));
const temporaryDirectory = path.join(temporaryRoot, 'avatars');
process.env.AVATAR_UPLOAD_DIR = temporaryDirectory;
process.env.SECRET_KEY = 'avatar-test-secret';

const { User } = require('../src/models');
const { app } = require('../src/app');

const userId = '64b000000000000000000011';
const token = jwt.sign({ sub: userId }, process.env.SECRET_KEY);
const pngImage = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

test('profile photo can be uploaded, served to its owner, and removed', async () => {
  const originalFindById = User.findById;
  const user = {
    _id: userId,
    name: 'Photo Candidate',
    email: 'photo@example.com',
    role: 'job_seeker',
    avatar_path: null,
    avatar_mime_type: null,
    save: async function save() { return this; },
  };
  User.findById = async () => user;

  try {
    const uploaded = await request(app)
      .post('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', pngImage, { filename: 'profile.png', contentType: 'image/png' });
    assert.equal(uploaded.status, 200, uploaded.text);
    assert.equal(uploaded.body.success, true);
    assert.match(uploaded.body.user.avatar_url, /^\/api\/auth\/me\/avatar\?v=\d+$/);
    assert.ok(user.avatar_path);

    const fetched = await request(app)
      .get('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(fetched.status, 200);
    assert.match(fetched.headers['content-type'], /image\/png/);
    assert.deepEqual(fetched.body, pngImage);

    const removedPath = user.avatar_path;
    const removed = await request(app)
      .delete('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(removed.status, 200, removed.text);
    assert.equal(removed.body.user.avatar_url, null);
    assert.equal(user.avatar_path, null);
    await assert.rejects(fs.access(removedPath));
  } finally {
    User.findById = originalFindById;
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});

test('profile photo upload rejects invalid content and requires authentication', async () => {
  const originalFindById = User.findById;
  User.findById = async () => ({
    _id: userId,
    name: 'Photo Candidate',
    email: 'photo@example.com',
    role: 'job_seeker',
  });

  try {
    const invalid = await request(app)
      .post('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('not an image'), { filename: 'profile.png', contentType: 'image/png' });
    assert.equal(invalid.status, 415);
    assert.equal(invalid.body.error.code, 'UNSUPPORTED_FILE_TYPE');

    const unauthenticated = await request(app)
      .post('/api/auth/me/avatar')
      .attach('file', pngImage, { filename: 'profile.png', contentType: 'image/png' });
    assert.equal(unauthenticated.status, 401);
    assert.equal(unauthenticated.body.error.code, 'UNAUTHORIZED');
  } finally {
    User.findById = originalFindById;
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});
