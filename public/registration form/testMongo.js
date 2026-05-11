const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/GOBLIN")
  .then(() => {
    console.log("✅ Connected to local MongoDB");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
