const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;
let useInMemory = false;

async function connectDB() {
  if (isConnected) return;

  if (env.MONGODB_URI) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
      });
      isConnected = true;
      console.log('✅ MongoDB connected:', env.MONGODB_URI);
      return;
    } catch (err) {
      console.warn('⚠️  MongoDB connection failed, falling back to in-memory store:', err.message);
    }
  } else {
    console.log('ℹ️  MONGODB_URI not set — using in-memory MongoDB fallback');
  }

  // In-memory fallback using mongodb-memory-server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    isConnected = true;
    useInMemory = true;
    console.log('✅ In-memory MongoDB started at:', uri);
  } catch (err) {
    console.error('❌ Failed to start in-memory MongoDB:', err.message);
    process.exit(1);
  }
}

function isInMemory() {
  return useInMemory;
}

module.exports = { connectDB, isInMemory };
