import { Router } from 'express';
import { getMe, login, signup, getAllUsers } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

export const authRouter = Router();

authRouter.post('/auth/signup', signup);
authRouter.post('/auth/login', login);
authRouter.get('/auth/me', authenticateToken as any, getMe as any);
authRouter.get('/auth/users', authenticateToken as any, getAllUsers as any);
