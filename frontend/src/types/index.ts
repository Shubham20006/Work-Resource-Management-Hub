export type WorkspaceCategory = 'Projects' | 'Academic' | 'Sheets' | 'CFP' | 'Other';

export interface Resource {
  id: string;
  itemId?: string;
  cardId?: string;
  subGroupId?: string;
  name: string;
  description?: string;
  url: string;
  emailsUsed?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubGroup {
  id: string;
  itemId?: string;
  cardId?: string;
  name: string;
  description?: string;
  order?: number;
  resources: Resource[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  id: string;
  cardId?: string;
  name: string;
  description?: string;
  githubUrl?: string; // App / Project GitHub Repo (for Projects category)
  resourceUrl?: string; // Sheet / Resource direct URL (for non-Projects category)
  order?: number;
  resources: Resource[];
  subGroups?: SubGroup[];
  createdAt?: string;
  updatedAt?: string;
}

export type SortOption = 'updated-desc' | 'updated-asc' | 'name-asc' | 'name-desc' | 'resources-desc' | 'custom-order';

export interface Card {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  order?: number;
  isFavorite?: boolean;
  items: Item[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CardFilter {
  searchQuery: string;
  category?: string;
  sortBy?: SortOption;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password?: string;
}

