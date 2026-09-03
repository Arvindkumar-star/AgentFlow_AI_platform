import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agentflow';
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      console.warn('MongoDB connection note (NextAuth):', err.message);
      return null;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch((err) => {
    console.warn('MongoDB connection note (NextAuth):', err.message);
    return null;
  });
}

export default clientPromise;
