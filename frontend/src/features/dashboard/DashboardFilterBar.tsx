import {
  ArrowUpDown,
  Filter,
  Grid,
  List,
  Search,
  X,
} from 'lucide-react';
import React from 'react';
import { CardFilter, SortOption } from '../../types';
import { cn } from '../../utils/cn';

interface DashboardFilterBarProps {
  filter: CardFilter;
  onFilterChange: (filter: CardFilter) => void;
  categories: string[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function DashboardFilterBar({
  filter,
  onFilterChange,
  categories,
  viewMode,
  onViewModeChange,
}: DashboardFilterBarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, searchQuery: e.target.value });
  };

  const handleCategoryChange = (category?: string) => {
    onFilterChange({ ...filter, category });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, sortBy: e.target.value as SortOption });
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Top row: Search input + View switcher + Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={handleSearchChange}
            placeholder="Filter cards by title, tag, or description..."
            className="h-10 w-full rounded-xl border border-border bg-card/60 pl-10 pr-9 text-xs sm:text-sm text-foreground shadow-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
          {filter.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <select
              value={filter.sortBy}
              onChange={handleSortChange}
              className="h-10 pl-3 pr-8 rounded-xl border border-border bg-card/60 text-xs font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="updated-desc">Recently Updated</option>
              <option value="updated-asc">Oldest Updated</option>
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="resources-desc">Most Resources</option>
              <option value="custom-order">Custom Layout</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 pointer-events-none h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {/* Grid / List Switcher */}
          <div className="flex items-center p-1 rounded-xl border border-border bg-card/60">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => handleCategoryChange(undefined)}
          className={cn(
            'text-xs px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap border',
            !filter.category
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card/60 text-muted-foreground border-border/70 hover:bg-accent hover:text-foreground'
          )}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap border',
              filter.category === cat
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-card/60 text-muted-foreground border-border/70 hover:bg-accent hover:text-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
