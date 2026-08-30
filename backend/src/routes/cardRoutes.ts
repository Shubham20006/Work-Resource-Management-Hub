import { Router } from 'express';
import {
  createCard,
  deleteCard,
  duplicateCard,
  getAllCards,
  getCardById,
  reorderCards,
  toggleFavoriteCard,
  updateCard,
} from '../controllers/cardController.js';

export const cardRouter = Router();

cardRouter.get('/', getAllCards);
cardRouter.get('/:id', getCardById);
cardRouter.post('/', createCard);
cardRouter.put('/reorder', reorderCards);
cardRouter.put('/:id', updateCard);
cardRouter.delete('/:id', deleteCard);
cardRouter.post('/:id/duplicate', duplicateCard);
cardRouter.patch('/:id/favorite', toggleFavoriteCard);
