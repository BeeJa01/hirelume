const { app } = require('./app');
const { port, secretKey, corsOrigins } = require('./config');
const { connectDatabase, closeDatabase } = require('./config/db');

async function start() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SECRET_KEY || secretKey === 'change-this-in-production') {
      throw new Error('Set a strong SECRET_KEY before starting in production');
    }
    if (!process.env.CORS_ORIGIN || !corsOrigins.length) {
      throw new Error('Set CORS_ORIGIN to the frontend URL before starting in production');
    }
  }

  await connectDatabase();
  const server = app.listen(port, () => console.log(`Hirelume API listening on port ${port}`));
  const shutdown = () => server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Failed to start Hirelume API:', error);
  process.exit(1);
});
