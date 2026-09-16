import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });
}
