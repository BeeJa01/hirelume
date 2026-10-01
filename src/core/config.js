require('dotenv').config();

const config = {
  port: Number(process.env.PORT || 8000),
  databaseUrl: process.env.DATABASE_URL || './hirelume.db',
  uploadDirectory: process.env.UPLOAD_DIR || 'uploads',
  secretKey: process.env.SECRET_KEY || 'change-this-in-production',
  accessTokenExpireMinutes: Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 1440),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 5),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

module.exports = { config };