import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { CardModel } from '../models/Card.js';

export const addItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId } = req.params;
    const { name, description, githubUrl, resourceUrl } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Item name is required' });
      return;
    }

    const card = await CardModel.findOne({ _id: cardId, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
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
    };

    card.items.push(newItem as any);
    await card.save();

    const createdItem = card.items[card.items.length - 1];
    res.status(201).json(createdItem);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add item', details: error.message });
  }
};

export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { name, description, githubUrl, resourceUrl, order } = req.body;

    const card = await CardModel.findOne({ _id: cardId, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (githubUrl !== undefined) item.githubUrl = githubUrl;
    if (resourceUrl !== undefined) item.resourceUrl = resourceUrl;
    if (order !== undefined) item.order = order;

    await card.save();
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update item', details: error.message });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;

    const card = await CardModel.findOne({ _id: cardId, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    card.items = (card.items as any).filter((item: any) => item._id.toString() !== itemId);
    await card.save();

    res.json({ message: 'Item deleted successfully', itemId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete item', details: error.message });
  }
};

export const moveItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { targetCardId } = req.body;

    if (!targetCardId) {
      res.status(400).json({ error: 'Target workspace (targetCardId) is required' });
      return;
    }

    if (cardId === targetCardId) {
      res.status(400).json({ error: 'Source and target workspaces are the same' });
      return;
    }

    const sourceCard = await CardModel.findOne({ _id: cardId, userId });
    if (!sourceCard) {
      res.status(404).json({ error: 'Source workspace not found' });
      return;
    }

    const targetCard = await CardModel.findOne({ _id: targetCardId, userId });
    if (!targetCard) {
      res.status(404).json({ error: 'Target workspace not found' });
      return;
    }

    const itemToMove = (sourceCard.items as any).id(itemId);
    if (!itemToMove) {
      res.status(404).json({ error: 'Item not found in source workspace' });
      return;
    }

    const itemData = itemToMove.toObject();
    delete itemData._id;

    // Remove from source
    sourceCard.items = (sourceCard.items as any).filter((item: any) => item._id.toString() !== itemId);
    await sourceCard.save();

    // Append to target
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

    const card = await CardModel.findOne({ _id: cardId, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
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
    res.status(500).json({ error: 'Failed to reorder items', details: error.message });
  }
};

// Sub-group handlers
export const addSubGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Sub-group name is required' });
      return;
    }

    const card = await CardModel.findOne({ _id: cardId, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Group item not found' });
      return;
    }

    if (!item.subGroups) item.subGroups = [];

    const newSubGroup = {
      name,
      description: description || '',
      order: item.subGroups.length,
      resources: [],
    };

    item.subGroups.push(newSubGroup as any);
    await card.save();

    const created = item.subGroups[item.subGroups.length - 1];
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add sub-group', details: error.message });
  }
};

export const updateSubGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId, subGroupId } = req.params;
    const { name, description } = req.body;

    const card = await CardModel.findOne({ _id: cardId, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Group item not found' });
      return;
    }

    const subGroup = (item.subGroups as any).id(subGroupId);
    if (!subGroup) {
      res.status(404).json({ error: 'Sub-group not found' });
      return;
    }

    if (name !== undefined) subGroup.name = name;
    if (description !== undefined) subGroup.description = description;

    await card.save();
    res.json(subGroup);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update sub-group', details: error.message });
  }
};

export const deleteSubGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId, subGroupId } = req.params;

    const card = await CardModel.findOne({ _id: cardId, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Group item not found' });
      return;
    }

    item.subGroups = (item.subGroups as any).filter((sg: any) => sg._id.toString() !== subGroupId);
    await card.save();

    res.json({ message: 'Sub-group deleted successfully', subGroupId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete sub-group', details: error.message });
  }
};

export const reorderSubGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { orderedSubGroupIds } = req.body as { orderedSubGroupIds: string[] };

    const card = await CardModel.findOne({ _id: cardId, userId });
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Group item not found' });
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
    res.status(500).json({ error: 'Failed to reorder sub-groups', details: error.message });
  }
};
