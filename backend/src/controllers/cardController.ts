import { Request, Response } from 'express';
import { CardModel } from '../models/Card.js';

export const getAllCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = await CardModel.find().sort({ order: 1, updatedAt: -1 });
    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch cards', details: error.message });
  }
};

export const getCardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const card = await CardModel.findById(req.params.id);
    if (!card) {
      res.status(404).json({ error: 'Workspace card not found' });
      return;
    }
    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch card', details: error.message });
  }
};

export const createCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon, color, category } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Workspace name is required' });
      return;
    }

    const count = await CardModel.countDocuments();
    const newCard = new CardModel({
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

export const updateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon, color, category, order } = req.body;
    const card = await CardModel.findById(req.params.id);
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

export const deleteCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CardModel.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }
    res.json({ message: 'Workspace deleted successfully', id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete workspace', details: error.message });
  }
};

export const duplicateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const source = await CardModel.findById(req.params.id);
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

    const count = await CardModel.countDocuments();
    const duplicated = new CardModel({
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

export const toggleFavoriteCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const card = await CardModel.findById(req.params.id);
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }
    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle favorite', details: error.message });
  }
};

export const reorderCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderedIds } = req.body as { orderedIds: string[] };
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds array required' });
      return;
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await CardModel.bulkWrite(bulkOps);
    const updatedCards = await CardModel.find().sort({ order: 1 });
    res.json(updatedCards);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reorder cards', details: error.message });
  }
};
