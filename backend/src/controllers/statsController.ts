import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { CardModel } from '../models/Card.js';
import { SEED_CARDS } from '../seeds/seedData.js';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const cards = await CardModel.find({ userId });
    const totalCards = cards.length;
    const totalItems = cards.reduce((acc, c) => acc + c.items.length, 0);
    const totalResources = cards.reduce(
      (acc, c) => acc + c.items.reduce((iAcc, item) => iAcc + item.resources.length, 0),
      0
    );

    res.json({
      totalCards,
      totalItems,
      totalResources,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
};

export const seedDatabase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    await CardModel.deleteMany({ userId });
    const userSeedCards = SEED_CARDS.map((c) => ({ ...c, userId }));
    const created = await CardModel.insertMany(userSeedCards);
    res.json({ message: 'Database reset and seeded with clean datasets', count: created.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
};
