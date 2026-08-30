import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { CardModel } from '../models/Card.js';

dotenv.config();

async function clearDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Clearing all workspace data...');

    const result = await CardModel.deleteMany({});
    console.log(`🧹 Successfully removed all ${result.deletedCount} documents from the database! Database is now empty.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Failed to clear database:', error.message);
    process.exit(1);
  }
}

clearDB();
