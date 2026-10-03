require("dotenv").config();

const { app } = require("./app");
const connectDB = require("./config/db");
const { ensureCvDirectory } = require("./services/fileStorage");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Make sure the CV storage directory exists
    ensureCvDirectory();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();