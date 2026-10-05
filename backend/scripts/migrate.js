const { connectDatabase, closeDatabase } = require('../src/config/db');
const models = require('../src/models');

async function migrate() {
  await connectDatabase();

  const duplicates = await models.AnalysisResult.aggregate([
    { $sort: { created_at: -1 } },
    { $group: { _id: '$application_id', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  for (const duplicate of duplicates) {
    await models.AnalysisResult.deleteMany({ _id: { $in: duplicate.ids.slice(1) } });
  }

  await Promise.all(Object.values(models).map((model) => model.createIndexes()));
  console.log(`Migration complete; removed ${duplicates.reduce((total, item) => total + item.count - 1, 0)} duplicate analysis results.`);
}

migrate()
  .then(closeDatabase)
  .catch(async (error) => {
    console.error('Migration failed:', error);
    await closeDatabase();
    process.exitCode = 1;
  });
