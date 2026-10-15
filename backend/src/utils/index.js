const { randomBytes } = require('node:crypto');

const now = () => new Date().toISOString();
const token = (bytes = 32) => randomBytes(bytes).toString('base64url');
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function publicUser(user) {
  return {
    id: String(user._id ?? user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar_filename: user.avatar_filename || null,
    avatar_mime_type: user.avatar_mime_type || null,
    avatar_uploaded_at: user.avatar_uploaded_at || null,
    avatar_url: user.avatar_path ? '/api/users/me/avatar' : null,
  };
}

function validate(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const error = new Error('Validation error');
    error.name = 'ZodError';
    error.issues = result.error.issues;
    throw error;
  }
  return result.data;
}

module.exports = { now, token, asyncRoute, publicUser, validate };
