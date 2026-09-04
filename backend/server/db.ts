import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let memoryServerInstance: any = null;

export async function connectDB(): Promise<string> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return 'connected';
  }

  const customUri = process.env.MONGODB_URI?.trim();

  if (customUri) {
    await mongoose.connect(customUri, { serverSelectionTimeoutMS: 10000 });
    isConnected = true;
    return customUri;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production.');
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  if (!memoryServerInstance) {
    memoryServerInstance = await MongoMemoryServer.create({
      instance: { dbName: 'stockpilot' },
    });
  }

  const memUri = memoryServerInstance.getUri();
  await mongoose.connect(memUri);
  isConnected = true;
  return memUri;
}

export function getDBStatus() {
  return {
    connected: mongoose.connection.readyState === 1,
    dbName: mongoose.connection.name || 'stockpilot',
    host: mongoose.connection.host || 'localhost',
    isEmbedded: Boolean(memoryServerInstance),
  };
}
