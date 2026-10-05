require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT || 5050),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hirelume',
  uploadDirectory: process.env.UPLOAD_DIR || 'private/cvs',
  secretKey: process.env.SECRET_KEY || 'change-this-in-production',
  accessTokenExpireMinutes: Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 1440),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 5),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map((origin) => origin.trim()).filter(Boolean),
};