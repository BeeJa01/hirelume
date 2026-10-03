require("dotenv").config();

    const { app } = require("./app");
const connectDB = require("./config/db");

const {
  ensureCvDirectory,
} = require("./services/fileStorage");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  ensureCvDirectory();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();