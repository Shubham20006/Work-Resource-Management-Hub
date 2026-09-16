import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { CardModel } from '../models/Card.js';

const getAccessQuery = (userId: string | undefined) => ({
  $or: [
    { userId },
    { 'sharedWith.userId': userId },
    { 'items.sharedWith.userId': userId },
    { 'items.subGroups.sharedWith.userId': userId }
  ]
});

const filterCardForUser = (card: any, userId: string | undefined) => {
  if (card.userId?.toString() === userId) return card;
  const isCardShared = card.sharedWith?.some((sw: any) => sw.userId?.toString() === userId);
  if (isCardShared) return card;

  card.items = card.items.filter((item: any) => {
    const isItemShared = item.sharedWith?.some((sw: any) => sw.userId?.toString() === userId);
    if (isItemShared) return true;

    item.subGroups = item.subGroups.filter((sg: any) => {
      return sg.sharedWith?.some((sw: any) => sw.userId?.toString() === userId);
    });

    return item.subGroups.length > 0;
  });

  return card;
};

export const getAllCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const cards = await CardModel.find(getAccessQuery(userId)).sort({ order: 1, updatedAt: -1 });
    const filteredCards = cards.map(c => filterCardForUser(c, userId));
    res.json(filteredCards);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t load your workspaces right now.', details: error.message });
  }
};

export const getCardById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const card = await CardModel.findOne({ _id: req.params.id, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace.' });
      return;
    }
    res.json(filterCardForUser(card, userId));
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t load this workspace right now.', details: error.message });
  }
};

export const createCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, description, icon, color, category, sharedWith } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Please provide a name for your workspace.' });
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
      sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
    });

    await newCard.save();
    res.status(201).json(newCard);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t create your workspace right now. Please try again.', details: error.message });
  }
};

export const updateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, description, icon, color, category, order, sharedWith } = req.body;
    const card = await CardModel.findOne({ 
      _id: req.params.id, 
      $or: [
        { userId },
        { sharedWith: { $elemMatch: { userId, role: 'editor' } } }
      ]
    });
    
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace, or you don\'t have permission to access it.' });
      return;
    }

    if (name !== undefined) card.name = name;
    if (description !== undefined) card.description = description;
    if (icon !== undefined) card.icon = icon;
    if (color !== undefined) card.color = color;
    if (category !== undefined) card.category = category;
    if (order !== undefined) card.order = order;
    if (sharedWith !== undefined) card.sharedWith = sharedWith;

    await card.save();
    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t save changes to your workspace. Please try again.', details: error.message });
  }
};

export const deleteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const result = await CardModel.findOneAndDelete({ 
      _id: req.params.id, 
      $or: [
        { userId },
        { sharedWith: { $elemMatch: { userId, role: 'editor' } } }
      ]
    });
    if (!result) {
      res.status(404).json({ error: 'We couldn\'t find that workspace, or you don\'t have permission to access it.' });
      return;
    }
    res.json({ message: 'Workspace deleted successfully', id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t delete your workspace right now. Please try again.', details: error.message });
  }
};

export const duplicateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const source = await CardModel.findOne({ _id: req.params.id, ...getAccessQuery(userId) });
    if (!source) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }

    const filteredSource = filterCardForUser(source, userId);

    const clonedItems = filteredSource.items.map((item: any) => ({
      name: item.name,
      description: item.description,
      githubUrl: item.githubUrl,
      resourceUrl: item.resourceUrl,
      order: item.order,
      resources: item.resources.map((r: any) => ({
        name: r.name,
        url: r.url,
        description: r.description,
        emailsUsed: [...(r.emailsUsed || [])],
      })),
      subGroups: item.subGroups.map((sg: any) => ({
        name: sg.name,
        description: sg.description,
        order: sg.order,
        resources: sg.resources.map((r: any) => ({
          name: r.name,
          url: r.url,
          description: r.description,
          emailsUsed: [...(r.emailsUsed || [])],
        })),
      })),
    }));

    const count = await CardModel.countDocuments({ userId });
    const duplicated = new CardModel({
      userId,
      name: `${filteredSource.name} (Copy)`,
      description: filteredSource.description,
      icon: filteredSource.icon,
      color: filteredSource.color,
      category: filteredSource.category,
      order: count,
      items: clonedItems,
    });

    await duplicated.save();
    res.status(201).json(duplicated);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t duplicate your workspace right now. Please try again.', details: error.message });
  }
};

export const toggleFavoriteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const card = await CardModel.findOne({ _id: req.params.id, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }
    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t update your favorites right now. Please try again.', details: error.message });
  }
};

export const reorderCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { orderedIds } = req.body as { orderedIds: string[] };
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'Please provide a valid list for reordering.' });
      return;
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { 
          _id: id, 
          $or: [
            { userId },
            { sharedWith: { $elemMatch: { userId, role: 'editor' } } }
          ]
        },
        update: { $set: { order: index } },
      },
    }));

    await CardModel.bulkWrite(bulkOps);
    const updatedCards = await CardModel.find(getAccessQuery(userId)).sort({ order: 1 });
    const filteredCards = updatedCards.map(c => filterCardForUser(c, userId));
    res.json(filteredCards);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t save the new order. Please try again.', details: error.message });
  }
};
