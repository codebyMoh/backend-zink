import mongoose from 'mongoose';
import config from '../env/index.js';
export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.DB_URL, { autoIndex: true });
    console.log('MongoDB connected successfully 🚀');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process on DB connection failure
  }
}
