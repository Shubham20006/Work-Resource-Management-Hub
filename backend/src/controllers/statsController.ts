import { Request, Response } from 'express';
import { CardModel } from '../models/Card.js';
import { SEED_CARDS } from '../seeds/seedData.js';

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = await CardModel.find();
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

export const seedDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    await CardModel.deleteMany({});
    const created = await CardModel.insertMany(SEED_CARDS);
    res.json({ message: 'Database reset and seeded with clean datasets', count: created.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
};
