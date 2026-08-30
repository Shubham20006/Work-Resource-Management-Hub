import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../services/apiClient';
import { Card } from '../types';

export const CARD_KEYS = {
  all: ['cards'] as const,
  detail: (id: string) => ['cards', id] as const,
};

export function useCards() {
  return useQuery({
    queryKey: CARD_KEYS.all,
    queryFn: () => apiClient.getAllCards(),
    staleTime: 1000 * 60 * 2, // 2 mins
  });
}

export function useCard(id?: string) {
  return useQuery({
    queryKey: CARD_KEYS.detail(id || ''),
    queryFn: () => (id ? apiClient.getCardById(id) : null),
    enabled: !!id,
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Card, 'id' | 'items' | 'createdAt' | 'updatedAt' | 'order'>) =>
      apiClient.createCard(data),
    onSuccess: (newCard) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      toast.success(`Workspace "${newCard.name}" created successfully!`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create workspace');
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Card, 'id' | 'createdAt'>> }) =>
      apiClient.updateCard(id, updates),
    onSuccess: (updatedCard) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(updatedCard.id) });
      toast.success(`Workspace "${updatedCard.name}" updated!`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update workspace');
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => apiClient.deleteCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      toast.success('Workspace deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete workspace');
    },
  });
}

export function useDuplicateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => apiClient.duplicateCard(cardId),
    onSuccess: (clonedCard) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      toast.success(`Workspace duplicated as "${clonedCard.name}"!`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to duplicate workspace');
    },
  });
}

export function useToggleFavoriteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => apiClient.toggleFavorite(cardId),
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      if (card.isFavorite) {
        toast.success(`Added "${card.name}" to favorites`);
      } else {
        toast.info(`Removed "${card.name}" from favorites`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update favorite status');
    },
  });
}

export function useReorderCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) => apiClient.reorderCards(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      toast.success('Workspaces reordered');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reorder workspaces');
    },
  });
}

export function useResetCards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.seedDatabase(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      toast.success('Workspaces reset to demo data in database');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to seed database');
    },
  });
}
