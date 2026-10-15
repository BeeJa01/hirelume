const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });

module.exports = {
  port: Number(process.env.PORT || 5000),
  mongoUri: (process.env.NODE_ENV === 'test' && process.env.MONGODB_TEST_URI)
    || process.env.MONGODB_URI
    || process.env.MONGO_URI
    || 'mongodb://127.0.0.1:27017/hirelume',
  uploadDirectory: process.env.UPLOAD_DIR || 'private/cvs',
  avatarUploadDirectory: process.env.AVATAR_UPLOAD_DIR || 'private/avatars',
  secretKey: process.env.SECRET_KEY || 'change-this-in-production',
  accessTokenExpireMinutes: Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 1440),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 5),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map((origin) => origin.trim()).filter(Boolean),
};