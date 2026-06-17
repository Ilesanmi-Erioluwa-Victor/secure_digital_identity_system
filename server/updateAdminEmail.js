require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const updateEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected...");

    const result = await User.updateOne(
      { role: "admin" },
      { $set: { email: "terencegoodnews@gmail.com" } }
    );

    if (result.matchedCount === 0) {
      console.log("No admin user found.");
    } else {
      console.log(`Admin email updated. ${result.modifiedCount > 0 ? "Modified." : "Already set."}`);
    }

    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

updateEmail();
