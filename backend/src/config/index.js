require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT || 8000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hirelume',
  uploadDirectory: process.env.UPLOAD_DIR || 'private/cvs',
  userUploadDirectory: process.env.USER_UPLOAD_DIR || 'private/users',
  secretKey: process.env.SECRET_KEY || 'change-this-in-production',
  accessTokenExpireMinutes: Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 1440),
  refreshTokenExpireDays: Number(process.env.REFRESH_TOKEN_EXPIRE_DAYS || 30),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 5),
  userFileSizeMb: Number(process.env.USER_FILE_SIZE_MB || 2),
  consentVersion: process.env.CONSENT_VERSION || 'v1',
  consentText: process.env.CONSENT_TEXT || 'I consent to Hirelume storing and processing my application data for recruitment.',
  analysisProvider: (process.env.ANALYSIS_PROVIDER || 'none').toLowerCase(),
  analysisMaxAttempts: Number(process.env.ANALYSIS_MAX_ATTEMPTS || 3),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  publicRateLimit: Number(process.env.PUBLIC_RATE_LIMIT || 60),
  publicRateWindowMinutes: Number(process.env.PUBLIC_RATE_WINDOW_MINUTES || 15),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,https://hirelume-kappa.vercel.app')
    .split(',').map((origin) => origin.trim()).filter(Boolean),
};
