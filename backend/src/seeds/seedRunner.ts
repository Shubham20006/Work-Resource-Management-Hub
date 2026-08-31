import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { CardModel } from '../models/Card.js';
import { assignExistingDataToDefaultUser } from './assignExistingData.js';
import { SEED_CARDS } from './seedData.js';

dotenv.config();

// Configure fallback DNS servers for SRV lookups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected. Seeding cards...');

    await CardModel.deleteMany({});
    const inserted = await CardModel.insertMany(SEED_CARDS);
    console.log(`✅ Successfully inserted ${inserted.length} workspace cards!`);

    console.log('Assigning cards to default user...');
    await assignExistingDataToDefaultUser();

    console.log('✅ Seeding complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

runSeed();
