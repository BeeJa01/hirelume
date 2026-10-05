const mongoose = require("mongoose");

/**
 * Connect the backend to MongoDB.
 *
 * The connection string is stored in MONGODB_URI
 * inside the .env file.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    // Stop the server when the database connection cannot be established.
    process.exit(1);
  }
};

module.exports = connectDB;