import { Request, Response } from 'express';
import { CardModel } from '../models/Card.js';

export const addResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardId, itemId } = req.params;
    const { name, description, url, emailsUsed, subGroupId } = req.body;

    if (!name || !url) {
      res.status(400).json({ error: 'Resource name and URL are required' });
      return;
    }

    const card = await CardModel.findById(cardId);
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Sub-project item not found' });
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
        res.status(404).json({ error: 'Sub-group not found' });
        return;
      }
      subGroup.resources.push(newResource as any);
      await card.save();
      const created = subGroup.resources[subGroup.resources.length - 1];
      res.status(201).json(created);
      return;
    }

    item.resources.push(newResource as any);
    await card.save();

    const created = item.resources[item.resources.length - 1];
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add resource', details: error.message });
  }
};

export const updateResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardId, itemId, resourceId } = req.params;
    const updates = req.body;

    const card = await CardModel.findById(cardId);
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Sub-project item not found' });
      return;
    }

    let resItem = (item.resources as any).id(resourceId);

    // If not found in direct item resources, search inside subGroups
    if (!resItem && item.subGroups) {
      for (const sg of item.subGroups) {
        const found = (sg.resources as any).id(resourceId);
        if (found) {
          resItem = found;
          break;
        }
      }
    }

    if (!resItem) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    if (updates.name !== undefined) resItem.name = updates.name;
    if (updates.description !== undefined) resItem.description = updates.description;
    if (updates.url !== undefined) resItem.url = updates.url;
    if (updates.emailsUsed !== undefined) resItem.emailsUsed = updates.emailsUsed;

    await card.save();
    res.json(resItem);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update resource', details: error.message });
  }
};

export const deleteResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardId, itemId, resourceId } = req.params;

    const card = await CardModel.findById(cardId);
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Sub-project item not found' });
      return;
    }

    // Check direct item resources
    const directFound = (item.resources as any).id(resourceId);
    if (directFound) {
      item.resources = (item.resources as any).filter((r: any) => r._id.toString() !== resourceId);
    } else if (item.subGroups) {
      // Check subGroups resources
      for (const sg of item.subGroups) {
        if ((sg.resources as any).id(resourceId)) {
          sg.resources = (sg.resources as any).filter((r: any) => r._id.toString() !== resourceId);
          break;
        }
      }
    }

    await card.save();
    res.json({ message: 'Resource deleted', resourceId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete resource', details: error.message });
  }
};

export const moveResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardId, itemId, resourceId } = req.params;
    const { targetCardId, targetItemId } = req.body;

    if (!targetCardId || !targetItemId) {
      res.status(400).json({ error: 'Target workspace (targetCardId) and target item (targetItemId) are required' });
      return;
    }

    const sourceCard = await CardModel.findById(cardId);
    if (!sourceCard) {
      res.status(404).json({ error: 'Source workspace not found' });
      return;
    }

    const sourceItem = (sourceCard.items as any).id(itemId);
    if (!sourceItem) {
      res.status(404).json({ error: 'Source item not found' });
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
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    const resData = resourceToMove.toObject();
    delete resData._id;

    // Remove from source item or subGroup
    if (isFromSubGroup && parentSubGroup) {
      parentSubGroup.resources = (parentSubGroup.resources as any).filter((r: any) => r._id.toString() !== resourceId);
    } else {
      sourceItem.resources = (sourceItem.resources as any).filter((r: any) => r._id.toString() !== resourceId);
    }
    await sourceCard.save();

    // Find target card & item
    let targetCard = sourceCard;
    if (cardId !== targetCardId) {
      const foundTarget = await CardModel.findById(targetCardId);
      if (!foundTarget) {
        res.status(404).json({ error: 'Target workspace not found' });
        return;
      }
      targetCard = foundTarget;
    }

    const targetItem = (targetCard.items as any).id(targetItemId);
    if (!targetItem) {
      res.status(404).json({ error: 'Target sub-project item not found' });
      return;
    }

    targetItem.resources.push(resData);
    await targetCard.save();

    res.json({
      message: `Resource moved to ${targetItem.name}`,
      resource: targetItem.resources[targetItem.resources.length - 1],
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to move resource', details: error.message });
  }
};

export const moveResourceBetweenGroupAndSubGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardId, itemId, resourceId } = req.params;
    const { targetSubGroupId } = req.body;

    const card = await CardModel.findById(cardId);
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Group item not found' });
      return;
    }

    let resourceData: any = null;

    // Find and remove resource from direct item resources
    const directIdx = item.resources.findIndex((r: any) => r._id.toString() === resourceId);
    if (directIdx !== -1) {
      resourceData = item.resources[directIdx].toObject();
      item.resources.splice(directIdx, 1);
    } else if (item.subGroups) {
      // Find and remove from sub-groups
      for (const sg of item.subGroups) {
        const sgIdx = sg.resources.findIndex((r: any) => r._id.toString() === resourceId);
        if (sgIdx !== -1) {
          resourceData = sg.resources[sgIdx].toObject();
          sg.resources.splice(sgIdx, 1);
          break;
        }
      }
    }

    if (!resourceData) {
      res.status(404).json({ error: 'Resource link not found' });
      return;
    }

    delete resourceData._id;

    // Insert into target location
    if (targetSubGroupId) {
      const targetSubGroup = (item.subGroups as any).id(targetSubGroupId);
      if (!targetSubGroup) {
        res.status(404).json({ error: 'Target sub-group not found' });
        return;
      }
      targetSubGroup.resources.push(resourceData);
    } else {
      item.resources.push(resourceData);
    }

    await card.save();
    res.json({ message: 'Link moved successfully', item });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to move resource', details: error.message });
  }
};

export const reorderResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardId, itemId } = req.params;
    const { orderedResourceIds, subGroupId } = req.body;

    if (!Array.isArray(orderedResourceIds)) {
      res.status(400).json({ error: 'orderedResourceIds must be an array' });
      return;
    }

    const card = await CardModel.findById(cardId);
    if (!card) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const item = (card.items as any).id(itemId);
    if (!item) {
      res.status(404).json({ error: 'Sub-project item not found' });
      return;
    }

    let targetResources = item.resources;
    if (subGroupId) {
      const subGroup = (item.subGroups as any).id(subGroupId);
      if (!subGroup) {
        res.status(404).json({ error: 'Sub-group not found' });
        return;
      }
      targetResources = subGroup.resources;
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

    await card.save();

    res.json({ message: 'Resources reordered successfully', resources: reordered });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reorder resources', details: error.message });
  }
};

export const recordResourceOpened = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resourceId } = req.params;
    const card = await CardModel.findOne({
      $or: [
        { 'items.resources._id': resourceId },
        { 'items.subGroups.resources._id': resourceId },
      ],
    });
    if (!card) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    res.json({ message: 'Recorded open timestamp' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record timestamp', details: error.message });
  }
};
