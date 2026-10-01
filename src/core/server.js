const { app } = require('./app');
const { config } = require('./config');
const { initializeDatabase, knex } = require('./db');

async function start() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SECRET_KEY || config.secretKey === 'change-this-in-production') {
      throw new Error('Set a strong SECRET_KEY before starting in production');
    }
    if (!process.env.CORS_ORIGIN) throw new Error('Set CORS_ORIGIN to the frontend URL before starting in production');
  }

  await initializeDatabase();
  const server = app.listen(config.port, () => console.log(`Hirelume API listening on port ${config.port}`));
  const shutdown = () => server.close(async () => {
    await knex.destroy();
    process.exit(0);
  });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Failed to start Hirelume API:', error);
  process.exit(1);
});
