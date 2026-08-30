import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../services/apiClient';
import { Item, Resource } from '../types';
import { CARD_KEYS } from './useCards';

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: Partial<Item> }) =>
      apiClient.addItem(cardId, data as any),
    onSuccess: (newItem, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success(`Group "${newItem.name}" added`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add item');
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, itemId, updates }: { cardId: string; itemId: string; updates: Partial<Item> }) =>
      apiClient.updateItem(cardId, itemId, updates),
    onSuccess: (updatedItem, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success(`Group "${updatedItem.name}" updated!`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update item');
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, itemId }: { cardId: string; itemId: string }) =>
      apiClient.deleteItem(cardId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success('Group deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete item');
    },
  });
}

export function useMoveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      targetCardId,
    }: {
      cardId: string;
      itemId: string;
      targetCardId: string;
    }) => apiClient.moveItem(cardId, itemId, targetCardId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      toast.success(res.message || 'Group moved successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to move group');
    },
  });
}

export function useReorderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, orderedItemIds }: { cardId: string; orderedItemIds: string[] }) =>
      apiClient.reorderItems(cardId, orderedItemIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success('Groups reordered');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reorder groups');
    },
  });
}

// SubGroups Hooks
export function useAddSubGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      data,
    }: {
      cardId: string;
      itemId: string;
      data: { name: string; description?: string };
    }) => apiClient.addSubGroup(cardId, itemId, data),
    onSuccess: (newSubGroup, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success(`Sub-group "${newSubGroup.name}" created!`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add sub-group');
    },
  });
}

export function useUpdateSubGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      subGroupId,
      updates,
    }: {
      cardId: string;
      itemId: string;
      subGroupId: string;
      updates: { name?: string; description?: string };
    }) => apiClient.updateSubGroup(cardId, itemId, subGroupId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success('Sub-group updated!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update sub-group');
    },
  });
}

export function useDeleteSubGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      subGroupId,
    }: {
      cardId: string;
      itemId: string;
      subGroupId: string;
    }) => apiClient.deleteSubGroup(cardId, itemId, subGroupId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success('Sub-group deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete sub-group');
    },
  });
}

export function useReorderSubGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      orderedSubGroupIds,
    }: {
      cardId: string;
      itemId: string;
      orderedSubGroupIds: string[];
    }) => apiClient.reorderSubGroups(cardId, itemId, orderedSubGroupIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success('Sub-groups reordered');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reorder sub-groups');
    },
  });
}

export function useAddResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      resource,
    }: {
      cardId: string;
      itemId: string;
      resource: Omit<Resource, 'id' | 'cardId' | 'itemId' | 'createdAt' | 'updatedAt'> & {
        subGroupId?: string;
      };
    }) => apiClient.addResource(cardId, itemId, resource),
    onSuccess: (newRes, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success(`Link "${newRes.name}" added`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add link');
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      resourceId,
      updates,
    }: {
      cardId: string;
      itemId: string;
      resourceId: string;
      updates: Partial<Resource>;
    }) => apiClient.updateResource(cardId, itemId, resourceId, updates),
    onSuccess: (updatedRes, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success(`Link "${updatedRes.name}" updated!`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update link');
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, itemId, resourceId }: { cardId: string; itemId: string; resourceId: string }) =>
      apiClient.deleteResource(cardId, itemId, resourceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success('Link removed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete link');
    },
  });
}

export function useMoveResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      resourceId,
      targetCardId,
      targetItemId,
    }: {
      cardId: string;
      itemId: string;
      resourceId: string;
      targetCardId: string;
      targetItemId: string;
    }) => apiClient.moveResource(cardId, itemId, resourceId, targetCardId, targetItemId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      toast.success(res.message || 'Link moved successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to move link');
    },
  });
}

export function useMoveResourceSubGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      resourceId,
      targetSubGroupId,
    }: {
      cardId: string;
      itemId: string;
      resourceId: string;
      targetSubGroupId: string | null;
    }) => apiClient.moveResourceSubGroup(cardId, itemId, resourceId, targetSubGroupId),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success('Link moved to sub-group!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to move link to sub-group');
    },
  });
}

export function useReorderResources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      itemId,
      orderedResourceIds,
      subGroupId,
    }: {
      cardId: string;
      itemId: string;
      orderedResourceIds: string[];
      subGroupId?: string;
    }) => apiClient.reorderResources(cardId, itemId, orderedResourceIds, subGroupId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CARD_KEYS.detail(variables.cardId) });
      toast.success('Links reordered');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reorder links');
    },
  });
}
