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

const canEditCard = (card: any, userId: string | undefined) => {
  return card.userId?.toString() === userId || card.sharedWith?.some((sw: any) => sw.userId?.toString() === userId && sw.role === 'editor');
};

const canEditItem = (card: any, item: any, userId: string | undefined) => {
  if (canEditCard(card, userId)) return true;
  return item.sharedWith?.some((sw: any) => sw.userId?.toString() === userId && sw.role === 'editor');
};

const canEditSubGroup = (card: any, item: any, subGroup: any, userId: string | undefined) => {
  if (canEditItem(card, item, userId)) return true;
  return subGroup.sharedWith?.some((sw: any) => sw.userId?.toString() === userId && sw.role === 'editor');
};

export const addItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId } = req.params;
    const { name, description, githubUrl, resourceUrl, sharedWith } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Please provide a name for the item.' });
      return;
    }

    const card = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }

    if (!canEditCard(card, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to add items here.' });
      return;
    }

    const newItem = {
      name,
      description: description || '',
      githubUrl: githubUrl || '',
      resourceUrl: resourceUrl || '',
      order: card.items.length,
      resources: [],
      subGroups: [],
      sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
    };

    card.items.push(newItem as any);
    await card.save();

    const createdItem = card.items[card.items.length - 1];
    res.status(201).json(createdItem);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t add the item right now. Please try again.', details: error.message });
  }
};

export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { name, description, githubUrl, resourceUrl, order, sharedWith } = req.body;

    const card = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'We couldn\'t find that item. It may have been deleted.' });
      return;
    }

    if (!canEditItem(card, item, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to edit this item.' });
      return;
    }

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (githubUrl !== undefined) item.githubUrl = githubUrl;
    if (resourceUrl !== undefined) item.resourceUrl = resourceUrl;
    if (order !== undefined) item.order = order;
    if (sharedWith !== undefined) item.sharedWith = sharedWith;

    await card.save();
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t save changes to this item. Please try again.', details: error.message });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;

    const card = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'We couldn\'t find that item. It may have been deleted.' });
      return;
    }

    if (!canEditItem(card, item, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to delete this item.' });
      return;
    }

    card.items = (card.items as any).filter((i: any) => i._id.toString() !== itemId);
    await card.save();

    res.json({ message: 'Item deleted successfully', itemId });
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t delete the item right now. Please try again.', details: error.message });
  }
};

export const moveItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { targetCardId } = req.body;

    if (!targetCardId) {
      res.status(400).json({ error: 'Please select a destination workspace.' });
      return;
    }

    if (cardId === targetCardId) {
      res.status(400).json({ error: 'The item is already in that workspace.' });
      return;
    }

    const sourceCard = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!sourceCard) {
      res.status(404).json({ error: 'We couldn\'t find the original workspace.' });
      return;
    }

    const itemToMove = (sourceCard.items as any).id(itemId);
    if (!itemToMove) {
      res.status(404).json({ error: 'We couldn\'t find the original item.' });
      return;
    }

    if (!canEditItem(sourceCard, itemToMove, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to move this item.' });
      return;
    }

    const targetCard = await CardModel.findOne({ _id: targetCardId, ...getAccessQuery(userId) });
    if (!targetCard) {
      res.status(404).json({ error: 'We couldn\'t find the destination workspace.' });
      return;
    }

    if (!canEditCard(targetCard, userId)) {
      res.status(403).json({ error: 'Unauthorized to add items to the target workspace' });
      return;
    }

    const itemData = itemToMove.toObject();
    delete itemData._id;

    sourceCard.items = (sourceCard.items as any).filter((item: any) => item._id.toString() !== itemId);
    await sourceCard.save();

    (itemData as any).order = targetCard.items.length;
    targetCard.items.push(itemData as any);
    await targetCard.save();

    res.json({
      message: `Sub-project moved to ${targetCard.name}`,
      item: targetCard.items[targetCard.items.length - 1],
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to move item', details: error.message });
  }
};

export const reorderItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId } = req.params;
    const { orderedItemIds } = req.body as { orderedItemIds: string[] };

    const card = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }

    // Checking if the user can reorder items (requires editing the card)
    if (!canEditCard(card, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to change the order here.' });
      return;
    }

    const itemMap = new Map<string, any>((card.items as any).map((i: any) => [i._id.toString(), i]));
    const reordered: any[] = [];

    orderedItemIds.forEach((id, idx) => {
      const item = itemMap.get(id);
      if (item) {
        item.order = idx;
        reordered.push(item);
        itemMap.delete(id);
      }
    });

    itemMap.forEach((item: any) => {
      item.order = reordered.length;
      reordered.push(item);
    });

    card.items = reordered as any;
    await card.save();
    res.json(card.items);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t save the new order. Please try again.', details: error.message });
  }
};

// Sub-group handlers
export const addSubGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { name, description, sharedWith } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Please provide a name for the sub-group.' });
      return;
    }

    const card = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'We couldn\'t find that group.' });
      return;
    }

    if (!canEditItem(card, item, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to add sub-groups here.' });
      return;
    }

    if (!item.subGroups) item.subGroups = [];

    const newSubGroup = {
      name,
      description: description || '',
      order: item.subGroups.length,
      resources: [],
      sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
    };

    item.subGroups.push(newSubGroup as any);
    await card.save();

    const created = item.subGroups[item.subGroups.length - 1];
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t add the sub-group right now. Please try again.', details: error.message });
  }
};

export const updateSubGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId, subGroupId } = req.params;
    const { name, description, sharedWith } = req.body;

    const card = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'We couldn\'t find that group.' });
      return;
    }

    const subGroup = (item.subGroups as any).id(subGroupId);
    if (!subGroup) {
      res.status(404).json({ error: 'We couldn\'t find that sub-group.' });
      return;
    }

    if (!canEditSubGroup(card, item, subGroup, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to edit this sub-group.' });
      return;
    }

    if (name !== undefined) subGroup.name = name;
    if (description !== undefined) subGroup.description = description;
    if (sharedWith !== undefined) subGroup.sharedWith = sharedWith;

    await card.save();
    res.json(subGroup);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t save changes to this sub-group. Please try again.', details: error.message });
  }
};

export const deleteSubGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId, subGroupId } = req.params;

    const card = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'We couldn\'t find that group.' });
      return;
    }

    const subGroup = (item.subGroups as any).id(subGroupId);
    if (!subGroup) {
      res.status(404).json({ error: 'We couldn\'t find that sub-group.' });
      return;
    }

    if (!canEditSubGroup(card, item, subGroup, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to delete this sub-group.' });
      return;
    }

    item.subGroups = (item.subGroups as any).filter((sg: any) => sg._id.toString() !== subGroupId);
    await card.save();

    res.json({ message: 'Sub-group deleted successfully', subGroupId });
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t delete the sub-group right now. Please try again.', details: error.message });
  }
};

export const reorderSubGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { orderedSubGroupIds } = req.body as { orderedSubGroupIds: string[] };

    const card = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that workspace. It may have been deleted.' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'We couldn\'t find that group.' });
      return;
    }

    if (!canEditItem(card, item, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to change the order here.' });
      return;
    }

    const sgMap = new Map<string, any>((item.subGroups as any).map((sg: any) => [sg._id.toString(), sg]));
    const reordered: any[] = [];

    orderedSubGroupIds.forEach((id, idx) => {
      const sg = sgMap.get(id);
      if (sg) {
        sg.order = idx;
        reordered.push(sg);
        sgMap.delete(id);
      }
    });

    sgMap.forEach((sg: any) => {
      sg.order = reordered.length;
      reordered.push(sg);
    });

    item.subGroups = reordered as any;
    await card.save();
    res.json(item.subGroups);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t save the new order. Please try again.', details: error.message });
  }
};
