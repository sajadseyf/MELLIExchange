import mongoose from 'mongoose';
import { env } from './env.js';

// Cache connection across serverless warm invocations
let cached: number = 0; // mongoose.connection.readyState

export async function connectDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return; // already connected

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    bufferCommands: false,        // fail fast instead of hanging forever
    maxPoolSize: 5,               // keep pool small for serverless
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  cached = mongoose.connection.readyState;
  console.log('[db] connected');
}
