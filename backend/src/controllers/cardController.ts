import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { CardModel } from '../models/Card.js';

export const getAllCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const cards = await CardModel.find({ userId }).sort({ order: 1, updatedAt: -1 });
    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch cards', details: error.message });
  }
};

export const getCardById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const card = await CardModel.findOne({ _id: req.params.id, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace card not found' });
      return;
    }
    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch card', details: error.message });
  }
};

export const createCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, description, icon, color, category } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Workspace name is required' });
      return;
    }

    const count = await CardModel.countDocuments({ userId });
    const newCard = new CardModel({
      userId,
      name,
      description: description || '',
      icon: icon || 'FolderKanban',
      color: color || 'indigo',
      category: category || 'Other',
      order: count,
      items: [],
    });

    await newCard.save();
    res.status(201).json(newCard);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create workspace', details: error.message });
  }
};

export const updateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, description, icon, color, category, order } = req.body;
    const card = await CardModel.findOne({ _id: req.params.id, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    if (name !== undefined) card.name = name;
    if (description !== undefined) card.description = description;
    if (icon !== undefined) card.icon = icon;
    if (color !== undefined) card.color = color;
    if (category !== undefined) card.category = category;
    if (order !== undefined) card.order = order;

    await card.save();
    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update workspace', details: error.message });
  }
};

export const deleteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const result = await CardModel.findOneAndDelete({ _id: req.params.id, userId });
    if (!result) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }
    res.json({ message: 'Workspace deleted successfully', id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete workspace', details: error.message });
  }
};

export const duplicateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const source = await CardModel.findOne({ _id: req.params.id, userId });
    if (!source) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const clonedItems = source.items.map((item) => ({
      name: item.name,
      description: item.description,
      githubUrl: item.githubUrl,
      resourceUrl: item.resourceUrl,
      order: item.order,
      resources: item.resources.map((r) => ({
        name: r.name,
        url: r.url,
        description: r.description,
        emailsUsed: [...(r.emailsUsed || [])],
      })),
    }));

    const count = await CardModel.countDocuments({ userId });
    const duplicated = new CardModel({
      userId,
      name: `${source.name} (Copy)`,
      description: source.description,
      icon: source.icon,
      color: source.color,
      category: source.category,
      order: count,
      items: clonedItems,
    });

    await duplicated.save();
    res.status(201).json(duplicated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to duplicate workspace', details: error.message });
  }
};

export const toggleFavoriteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const card = await CardModel.findOne({ _id: req.params.id, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }
    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle favorite', details: error.message });
  }
};

export const reorderCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { orderedIds } = req.body as { orderedIds: string[] };
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds array required' });
      return;
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, userId },
        update: { $set: { order: index } },
      },
    }));

    await CardModel.bulkWrite(bulkOps);
    const updatedCards = await CardModel.find({ userId }).sort({ order: 1 });
    res.json(updatedCards);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reorder cards', details: error.message });
  }
};
