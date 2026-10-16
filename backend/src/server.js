
require("dotenv").config();

const { app } = require("./app");
const connectDB = require("./config/db");
const { ensureCvDirectory } = require("./services/fileStorage");
const { recoverPendingAnalyses } = require("./services/analysis");

const PORT = process.env.PORT || 5050;

const startServer = async () => {
  await connectDB();
  ensureCvDirectory();

  // Requeue analyses left pending if the server previously stopped.
  await recoverPendingAnalyses();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exitCode = 1;
});
