import { Card, Item, Resource, SubGroup } from '../types';

const API_BASE_URL = 'https://work-resource-management-hub.onrender.com/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `HTTP error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const apiClient = {
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Cards
  getAllCards: () => fetchJson<Card[]>('/cards'),
  getCardById: (id: string) => fetchJson<Card>(`/cards/${id}`),
  createCard: (data: Omit<Card, 'id' | 'items' | 'createdAt' | 'updatedAt' | 'order'>) =>
    fetchJson<Card>('/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCard: (id: string, updates: Partial<Card>) =>
    fetchJson<Card>(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteCard: (id: string) =>
    fetchJson<{ message: string; id: string }>(`/cards/${id}`, {
      method: 'DELETE',
    }),
  duplicateCard: (id: string) =>
    fetchJson<Card>(`/cards/${id}/duplicate`, {
      method: 'POST',
    }),
  toggleFavorite: (id: string) =>
    fetchJson<Card>(`/cards/${id}/favorite`, {
      method: 'PATCH',
    }),
  reorderCards: (orderedIds: string[]) =>
    fetchJson<Card[]>('/cards/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    }),

  // Items
  addItem: (cardId: string, data: Partial<Item>) =>
    fetchJson<Item>(`/cards/${cardId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateItem: (cardId: string, itemId: string, updates: Partial<Item>) =>
    fetchJson<Item>(`/cards/${cardId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteItem: (cardId: string, itemId: string) =>
    fetchJson<{ message: string; itemId: string }>(`/cards/${cardId}/items/${itemId}`, {
      method: 'DELETE',
    }),
  moveItem: (cardId: string, itemId: string, targetCardId: string) =>
    fetchJson<{ message: string; item: Item }>(`/cards/${cardId}/items/${itemId}/move`, {
      method: 'POST',
      body: JSON.stringify({ targetCardId }),
    }),
  reorderItems: (cardId: string, orderedItemIds: string[]) =>
    fetchJson<Item[]>(`/cards/${cardId}/items/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedItemIds }),
    }),

  // SubGroups
  addSubGroup: (cardId: string, itemId: string, data: { name: string; description?: string }) =>
    fetchJson<SubGroup>(`/cards/${cardId}/items/${itemId}/subgroups`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSubGroup: (
    cardId: string,
    itemId: string,
    subGroupId: string,
    updates: { name?: string; description?: string }
  ) =>
    fetchJson<SubGroup>(`/cards/${cardId}/items/${itemId}/subgroups/${subGroupId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteSubGroup: (cardId: string, itemId: string, subGroupId: string) =>
    fetchJson<{ message: string; subGroupId: string }>(
      `/cards/${cardId}/items/${itemId}/subgroups/${subGroupId}`,
      {
        method: 'DELETE',
      }
    ),
  reorderSubGroups: (cardId: string, itemId: string, orderedSubGroupIds: string[]) =>
    fetchJson<SubGroup[]>(`/cards/${cardId}/items/${itemId}/subgroups/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedSubGroupIds }),
    }),

  // Resources
  addResource: (
    cardId: string,
    itemId: string,
    resource: Omit<Resource, 'id' | 'cardId' | 'itemId' | 'createdAt' | 'updatedAt'> & { subGroupId?: string }
  ) =>
    fetchJson<Resource>(`/cards/${cardId}/items/${itemId}/resources`, {
      method: 'POST',
      body: JSON.stringify(resource),
    }),
  updateResource: (cardId: string, itemId: string, resourceId: string, updates: Partial<Resource>) =>
    fetchJson<Resource>(`/cards/${cardId}/items/${itemId}/resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteResource: (cardId: string, itemId: string, resourceId: string) =>
    fetchJson<{ message: string; resourceId: string }>(
      `/cards/${cardId}/items/${itemId}/resources/${resourceId}`,
      {
        method: 'DELETE',
      }
    ),
  moveResource: (
    cardId: string,
    itemId: string,
    resourceId: string,
    targetCardId: string,
    targetItemId: string
  ) =>
    fetchJson<{ message: string; resource: Resource }>(
      `/cards/${cardId}/items/${itemId}/resources/${resourceId}/move`,
      {
        method: 'POST',
        body: JSON.stringify({ targetCardId, targetItemId }),
      }
    ),
  moveResourceSubGroup: (
    cardId: string,
    itemId: string,
    resourceId: string,
    targetSubGroupId: string | null
  ) =>
    fetchJson<{ message: string; item: Item }>(
      `/cards/${cardId}/items/${itemId}/resources/${resourceId}/move-subgroup`,
      {
        method: 'POST',
        body: JSON.stringify({ targetSubGroupId }),
      }
    ),
  reorderResources: (cardId: string, itemId: string, orderedResourceIds: string[], subGroupId?: string) =>
    fetchJson<Resource[]>(`/cards/${cardId}/items/${itemId}/resources/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedResourceIds, subGroupId }),
    }),
  recordResourceOpened: (resourceId: string) =>
    fetchJson<{ message: string }>(`/resources/${resourceId}/open`, {
      method: 'POST',
    }),

  // Seed / Reset
  seedDatabase: () => fetchJson<{ message: string; count: number }>('/seed', { method: 'POST' }),
};
