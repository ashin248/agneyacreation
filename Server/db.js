const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || process.env.Local_DB_URL || process.env.Server_DB_URL
    );
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    if (err.message.includes("authentication failed")) {
      console.error(
        "👉 Please check your username and password in the .env file.",
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB