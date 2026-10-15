const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { mongoUri } = require("./index");

let embeddedMongo;

function isLocalMongoUri(uri) {
  return /mongodb:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(uri);
}

async function startEmbeddedMongo() {
  const { MongoMemoryServer } = require("mongodb-memory-server");
  const dbPath = path.resolve(__dirname, "../../.mongo-data");
  fs.mkdirSync(dbPath, { recursive: true });

  embeddedMongo = await MongoMemoryServer.create({
    binary: {
      version: "7.0.14",
    },
    instance: {
      dbName: "hirelume",
      dbPath,
      storageEngine: "wiredTiger",
      launchTimeout: 60000,
    },
  });

  return embeddedMongo.getUri("hirelume");
}

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    return;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    if (process.env.NODE_ENV === "test") {
      throw error;
    }

    if (!isLocalMongoUri(mongoUri)) {
      process.exit(1);
    }

    console.warn("Local MongoDB is not running. Starting an embedded database for development.");
    try {
      const embeddedUri = await startEmbeddedMongo();
      await mongoose.connect(embeddedUri);
      console.log("Embedded MongoDB connected");
    } catch (embeddedError) {
      console.error("Embedded MongoDB failed:", embeddedError.message);
      process.exit(1);
    }
  }
};

const closeDatabase = async () => {
  await mongoose.disconnect();
  if (embeddedMongo) {
    await embeddedMongo.stop();
    embeddedMongo = null;
  }
};

connectDB.connectDatabase = connectDB;
connectDB.closeDatabase = closeDatabase;

module.exports = connectDB;
