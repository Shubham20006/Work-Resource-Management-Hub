import { Router } from 'express';
import {
  addItem,
  addSubGroup,
  deleteItem,
  deleteSubGroup,
  moveItem,
  reorderItems,
  reorderSubGroups,
  updateItem,
  updateSubGroup,
} from '../controllers/itemController.js';

export const itemRouter = Router();

itemRouter.post('/:cardId/items', addItem);
itemRouter.put('/:cardId/items/reorder', reorderItems);
itemRouter.post('/:cardId/items/:itemId/move', moveItem);
itemRouter.put('/:cardId/items/:itemId', updateItem);
itemRouter.delete('/:cardId/items/:itemId', deleteItem);

// Sub-groups
itemRouter.post('/:cardId/items/:itemId/subgroups', addSubGroup);
itemRouter.put('/:cardId/items/:itemId/subgroups/reorder', reorderSubGroups);
itemRouter.put('/:cardId/items/:itemId/subgroups/:subGroupId', updateSubGroup);
itemRouter.delete('/:cardId/items/:itemId/subgroups/:subGroupId', deleteSubGroup);
