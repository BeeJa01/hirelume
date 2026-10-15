const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require("./app");
const connectDB = require("./config/db");
const { port } = require("./config");

const {
  ensureCvDirectory,
} = require("./services/fileStorage");

const startServer = async () => {
  await connectDB();

  ensureCvDirectory();

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on 0.0.0.0:${port}`);
  });
};

startServer();