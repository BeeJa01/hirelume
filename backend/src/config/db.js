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

module.exports = { mongoose, connectDatabase, closeDatabase };