import { Router } from 'express';
import {
  addResource,
  deleteResource,
  moveResource,
  moveResourceBetweenGroupAndSubGroup,
  recordResourceOpened,
  reorderResources,
  updateResource,
} from '../controllers/resourceController.js';

export const resourceRouter = Router();

// Nested resources routes: /api/cards/:cardId/items/:itemId/resources
resourceRouter.post('/:cardId/items/:itemId/resources', addResource);
resourceRouter.put('/:cardId/items/:itemId/resources/reorder', reorderResources);
resourceRouter.post('/:cardId/items/:itemId/resources/:resourceId/move', moveResource);
resourceRouter.post(
  '/:cardId/items/:itemId/resources/:resourceId/move-subgroup',
  moveResourceBetweenGroupAndSubGroup
);
resourceRouter.put('/:cardId/items/:itemId/resources/:resourceId', updateResource);
resourceRouter.delete('/:cardId/items/:itemId/resources/:resourceId', deleteResource);

// Direct timestamp tracking: /api/resources/:resourceId/open
resourceRouter.post('/resources/:resourceId/open', recordResourceOpened);
