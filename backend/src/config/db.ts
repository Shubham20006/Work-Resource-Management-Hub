import dns from 'dns';
import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not defined.');
    console.error('👉 Please set MONGODB_URI in server/.env with your MongoDB Atlas or local connection string.');
    return;
  }

  // Configure fallback DNS servers so Node.js c-ares DNS resolver can resolve _mongodb._tcp SRV records
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (dnsErr) {
    // Ignore if system doesn't allow setting custom DNS
  }

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('👉 Please check that your IP is whitelisted in MongoDB Atlas (Network Access: Allow Access from Anywhere 0.0.0.0/0 for Render).');
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB error event: ${err.message}`);
});
