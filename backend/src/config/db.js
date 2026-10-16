const mongoose = require('mongoose');
const { mongoUri } = require('./index');
require('../models');

async function connectDatabase() {
  await mongoose.connect(mongoUri);
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

async function closeDatabase() {
  await mongoose.disconnect();
}

async function connectDatabase() {
  await mongoose.connect(mongoUri);

  for (const model of Object.values(mongoose.models)) {
    try {
      console.log(`Checking indexes for model: ${model.modelName}`);
      await model.init();
      console.log(`Indexes OK: ${model.modelName}`);
    } catch (error) {
      console.error(`INDEX ERROR IN MODEL: ${model.modelName}`);
      throw error;
    }
  }
}

module.exports = { mongoose, connectDatabase, closeDatabase };