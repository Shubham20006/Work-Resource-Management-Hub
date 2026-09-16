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

export const addResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { name, description, url, emailsUsed, subGroupId } = req.body;

    if (!name || !url) {
      res.status(400).json({ error: 'Please provide both a name and a link for the resource.' });
      return;
    }

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

    const newResource = {
      name,
      description: description || '',
      url,
      emailsUsed: Array.isArray(emailsUsed) ? emailsUsed : [],
    };

    if (subGroupId) {
      const subGroup = (item.subGroups as any).id(subGroupId);
      if (!subGroup) {
        res.status(404).json({ error: 'We couldn\'t find that sub-group.' });
        return;
      }
      
      if (!canEditSubGroup(card, item, subGroup, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to add resources here.' });
        return;
      }

      subGroup.resources.push(newResource as any);
      card.markModified('items');
      await card.save();
      const created = subGroup.resources[subGroup.resources.length - 1];
      res.status(201).json(created);
      return;
    }

    if (!canEditItem(card, item, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to add resources here.' });
      return;
    }

    item.resources.push(newResource as any);
    card.markModified('items');
    await card.save();

    const created = item.resources[item.resources.length - 1];
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t add the resource right now. Please try again.', details: error.message });
  }
};

export const updateResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId, resourceId } = req.params;
    const updates = req.body;

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

    let resItem = (item.resources as any).id(resourceId);
    let isFromSubGroup = false;
    let parentSubGroup: any = null;

    if (!resItem && item.subGroups) {
      for (const sg of item.subGroups) {
        const found = (sg.resources as any).id(resourceId);
        if (found) {
          resItem = found;
          isFromSubGroup = true;
          parentSubGroup = sg;
          break;
        }
      }
    }

    if (!resItem) {
      res.status(404).json({ error: 'We couldn\'t find that resource.' });
      return;
    }

    if (isFromSubGroup) {
      if (!canEditSubGroup(card, item, parentSubGroup, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to edit this resource.' });
        return;
      }
    } else {
      if (!canEditItem(card, item, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to edit this resource.' });
        return;
      }
    }

    if (updates.name !== undefined) resItem.name = updates.name;
    if (updates.description !== undefined) resItem.description = updates.description;
    if (updates.url !== undefined) resItem.url = updates.url;
    if (updates.emailsUsed !== undefined) resItem.emailsUsed = updates.emailsUsed;

    card.markModified('items');
    await card.save();
    res.json(resItem);
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t save your changes to this resource. Please try again.', details: error.message });
  }
};

export const deleteResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId, resourceId } = req.params;

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

    const directFound = (item.resources as any).id(resourceId);
    if (directFound) {
      if (!canEditItem(card, item, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to delete this resource.' });
        return;
      }
      item.resources = (item.resources as any).filter((r: any) => r._id.toString() !== resourceId);
    } else if (item.subGroups) {
      let foundSubGroup = null;
      for (const sg of item.subGroups) {
        if ((sg.resources as any).id(resourceId)) {
          foundSubGroup = sg;
          break;
        }
      }

      if (foundSubGroup) {
        if (!canEditSubGroup(card, item, foundSubGroup, userId)) {
          res.status(403).json({ error: 'You don\'t have permission to delete this resource.' });
          return;
        }
        foundSubGroup.resources = (foundSubGroup.resources as any).filter((r: any) => r._id.toString() !== resourceId);
      } else {
        res.status(404).json({ error: 'We couldn\'t find that resource.' });
        return;
      }
    }

    card.markModified('items');
    await card.save();
    res.json({ message: 'Resource deleted', resourceId });
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t delete the resource right now. Please try again.', details: error.message });
  }
};

export const moveResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId, resourceId } = req.params;
    const { targetCardId, targetItemId } = req.body;

    if (!targetCardId || !targetItemId) {
      res.status(400).json({ error: 'Please select both a destination workspace and item.' });
      return;
    }

    const sourceCard = await CardModel.findOne({ _id: cardId, ...getAccessQuery(userId) });
    if (!sourceCard) {
      res.status(404).json({ error: 'We couldn\'t find the original workspace.' });
      return;
    }

    const sourceItem = (sourceCard.items as any).id(itemId);
    if (!sourceItem) {
      res.status(404).json({ error: 'We couldn\'t find the original item.' });
      return;
    }

    let resourceToMove = (sourceItem.resources as any).id(resourceId);
    let isFromSubGroup = false;
    let parentSubGroup: any = null;

    if (!resourceToMove && sourceItem.subGroups) {
      for (const sg of sourceItem.subGroups) {
        const found = (sg.resources as any).id(resourceId);
        if (found) {
          resourceToMove = found;
          isFromSubGroup = true;
          parentSubGroup = sg;
          break;
        }
      }
    }

    if (!resourceToMove) {
      res.status(404).json({ error: 'We couldn\'t find that resource.' });
      return;
    }

    if (isFromSubGroup) {
      if (!canEditSubGroup(sourceCard, sourceItem, parentSubGroup, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to move this resource.' });
        return;
      }
    } else {
      if (!canEditItem(sourceCard, sourceItem, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to move this resource.' });
        return;
      }
    }

    const resData = resourceToMove.toObject();
    delete resData._id;

    if (isFromSubGroup && parentSubGroup) {
      parentSubGroup.resources = (parentSubGroup.resources as any).filter((r: any) => r._id.toString() !== resourceId);
    } else {
      sourceItem.resources = (sourceItem.resources as any).filter((r: any) => r._id.toString() !== resourceId);
    }
    sourceCard.markModified('items');
    await sourceCard.save();

    let targetCard = sourceCard;
    if (cardId !== targetCardId) {
      const foundTarget = await CardModel.findOne({ _id: targetCardId, ...getAccessQuery(userId) });
      if (!foundTarget) {
        res.status(404).json({ error: 'We couldn\'t find the destination workspace.' });
        return;
      }
      targetCard = foundTarget;
    }

    const targetItem = (targetCard.items as any).id(targetItemId);
    if (!targetItem) {
      res.status(404).json({ error: 'We couldn\'t find the destination item.' });
      return;
    }

    if (!canEditItem(targetCard, targetItem, userId)) {
      res.status(403).json({ error: 'You don\'t have permission to move resources there.' });
      return;
    }

    targetItem.resources.push(resData);
    targetCard.markModified('items');
    await targetCard.save();

    res.json({
      message: `Resource moved to ${targetItem.name}`,
      resource: targetItem.resources[targetItem.resources.length - 1],
    });
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t move the resource right now. Please try again.', details: error.message });
  }
};

export const moveResourceBetweenGroupAndSubGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId, resourceId } = req.params;
    const { targetSubGroupId } = req.body;

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

    let resourceData: any = null;
    let sourceIsSubGroup = false;
    let sourceSubGroup = null;

    const directIdx = item.resources.findIndex((r: any) => r._id.toString() === resourceId);
    if (directIdx !== -1) {
      resourceData = item.resources[directIdx].toObject();
    } else if (item.subGroups) {
      for (const sg of item.subGroups) {
        const sgIdx = sg.resources.findIndex((r: any) => r._id.toString() === resourceId);
        if (sgIdx !== -1) {
          resourceData = sg.resources[sgIdx].toObject();
          sourceIsSubGroup = true;
          sourceSubGroup = sg;
          break;
        }
      }
    }

    if (!resourceData) {
      res.status(404).json({ error: 'We couldn\'t find that resource.' });
      return;
    }

    if (sourceIsSubGroup) {
      if (!canEditSubGroup(card, item, sourceSubGroup, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to move this resource.' });
        return;
      }
    } else {
      if (!canEditItem(card, item, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to move this resource.' });
        return;
      }
    }

    if (targetSubGroupId) {
      const targetSubGroup = (item.subGroups as any).id(targetSubGroupId);
      if (!targetSubGroup) {
        res.status(404).json({ error: 'We couldn\'t find the destination sub-group.' });
        return;
      }
      if (!canEditSubGroup(card, item, targetSubGroup, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to move resources there.' });
        return;
      }
    } else {
      if (!canEditItem(card, item, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to move resources there.' });
        return;
      }
    }

    // Perform move
    if (sourceIsSubGroup && sourceSubGroup) {
      const sgIdx = sourceSubGroup.resources.findIndex((r: any) => r._id.toString() === resourceId);
      sourceSubGroup.resources.splice(sgIdx, 1);
    } else {
      const directIdx = item.resources.findIndex((r: any) => r._id.toString() === resourceId);
      item.resources.splice(directIdx, 1);
    }

    delete resourceData._id;

    if (targetSubGroupId) {
      const targetSubGroup = (item.subGroups as any).id(targetSubGroupId);
      targetSubGroup.resources.push(resourceData);
    } else {
      item.resources.push(resourceData);
    }

    card.markModified('items');
    await card.save();
    res.json({ message: 'Link moved successfully', item });
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t move the resource right now. Please try again.', details: error.message });
  }
};

export const reorderResources = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId, itemId } = req.params;
    const { orderedResourceIds, subGroupId } = req.body;

    if (!Array.isArray(orderedResourceIds)) {
      res.status(400).json({ error: 'Please provide a valid list for reordering.' });
      return;
    }

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

    let targetResources = item.resources;
    if (subGroupId) {
      const subGroup = (item.subGroups as any).id(subGroupId);
      if (!subGroup) {
        res.status(404).json({ error: 'We couldn\'t find that sub-group.' });
        return;
      }
      if (!canEditSubGroup(card, item, subGroup, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to change the order here.' });
        return;
      }
      targetResources = subGroup.resources;
    } else {
      if (!canEditItem(card, item, userId)) {
        res.status(403).json({ error: 'You don\'t have permission to change the order here.' });
        return;
      }
    }

    const resourceMap = new Map();
    targetResources.forEach((r: any) => {
      resourceMap.set(r._id.toString(), r);
    });

    const reordered: any[] = [];
    for (const id of orderedResourceIds) {
      if (resourceMap.has(id)) {
        reordered.push(resourceMap.get(id));
        resourceMap.delete(id);
      }
    }

    resourceMap.forEach((r) => reordered.push(r));

    if (subGroupId) {
      const subGroup = (item.subGroups as any).id(subGroupId);
      subGroup.resources = reordered;
    } else {
      item.resources = reordered;
    }

    card.markModified('items');
    await card.save();

    res.json({ message: 'Resources reordered successfully', resources: reordered });
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t save the new order. Please try again.', details: error.message });
  }
};

export const recordResourceOpened = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { resourceId } = req.params;
    
    // We can just check if any card contains this resource, we don't necessarily need strict access checks just to record a timestamp
    const card = await CardModel.findOne({
      $or: [
        { 'items.resources._id': resourceId },
        { 'items.subGroups.resources._id': resourceId },
      ],
    });
    if (!card) {
      res.status(404).json({ error: 'We couldn\'t find that resource.' });
      return;
    }

    res.json({ message: 'Recorded open timestamp' });
  } catch (error: any) {
    res.status(500).json({ error: 'We couldn\'t update the last opened time.', details: error.message });
  }
};
