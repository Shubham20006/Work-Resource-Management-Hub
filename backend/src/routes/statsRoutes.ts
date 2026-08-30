import { Router } from 'express';
import { getStats, seedDatabase } from '../controllers/statsController.js';

export const statsRouter = Router();

statsRouter.get('/stats', getStats);
statsRouter.post('/seed', seedDatabase);
