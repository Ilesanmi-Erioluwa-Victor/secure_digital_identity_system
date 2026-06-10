const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI is not defined in .env');
      process.exit(1);
    }
    console.log('Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (error.message.includes('ENOTFOUND')) {
      console.error('  → DNS lookup failed. Check your cluster hostname in MONGO_URI.');
    } else if (error.message.includes('Authentication')) {
      console.error('  → Authentication failed. Check username/password in MONGO_URI.');
    } else if (error.message.includes('timed out')) {
      console.error('  → Connection timed out. Whitelist your IP in Atlas Network Access.');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
