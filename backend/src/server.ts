import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { cardRouter } from './routes/cardRoutes.js';
import { itemRouter } from './routes/itemRoutes.js';
import { resourceRouter } from './routes/resourceRoutes.js';
import { statsRouter } from './routes/statsRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// CORS configuration (supports dev localhost + Render frontend URLs)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in cloud for seamless frontend connections
    },
    credentials: true,
  })
);

// Health check endpoints for Render
app.get(['/api/health', '/healthz'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'sheet-manager-api',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/cards', cardRouter);
app.use('/api/cards', itemRouter);
app.use('/api/cards', resourceRouter);
app.use('/api', resourceRouter);
app.use('/api', statsRouter);

// 404 Route
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Server Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 WorkHub Backend API running on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Workspaces:   http://localhost:${PORT}/api/cards`);
});
