import { FolderKanban, Plus, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useCards } from '../../hooks/useCards';
import { Card } from '../../types';
import { cn } from '../../utils/cn';
import { CardFormModal } from './CardFormModal';
import { DashboardCardItem } from './DashboardCardItem';
import { DeleteCardDialog } from './DeleteCardDialog';

const CATEGORY_TABS = ['All', 'Projects', 'Academic', 'Sheets', 'CFP', 'Other'];

export function DashboardPage() {
  const { data: cards = [], isLoading, isError } = useCards();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  // Filter cards by search query & category tab
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Category filter
      if (selectedCategory !== 'All' && card.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = card.name.toLowerCase().includes(q);
        const matchesDesc = card.description.toLowerCase().includes(q);
        const matchesItems = card.items.some((item) => item.name.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesItems) return false;
      }

      return true;
    });
  }, [cards, searchQuery, selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingCard(null);
    setIsFormModalOpen(true);
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setIsFormModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            WorkHub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Centralized place to quickly access your Google Sheets, project URLs, and repositories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={handleOpenAddModal} size="md" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Add Workspace</span>
          </Button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces or projects..."
            className="h-9.5 w-full rounded-xl border border-border bg-muted/20 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0',
                selectedCategory === cat
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-border/60 bg-card p-5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center py-10 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <p className="text-sm font-bold text-destructive">Failed to load workspaces.</p>
          <p className="text-xs text-muted-foreground mt-1">Please ensure your backend server is running.</p>
        </div>
      )}

      {/* Workspace Cards Grid */}
      {!isLoading && !isError && (
        <div>
          {filteredCards.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card p-6">
              <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-bold text-foreground">No workspaces found</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try clearing your search or category filter.'
                  : 'Create your first workspace to store and organize your important links.'}
              </p>
              {!searchQuery && selectedCategory === 'All' && (
                <Button size="sm" onClick={handleOpenAddModal}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Workspace
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCards.map((card) => (
                <DashboardCardItem
                  key={card.id}
                  card={card}
                  onEdit={handleEditCard}
                  onDelete={(card) => setDeletingCard(card)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Workspace Modal */}
      <CardFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCard(null);
        }}
        cardToEdit={editingCard}
      />

      {/* Delete Confirmation Modal */}
      <DeleteCardDialog
        isOpen={!!deletingCard}
        onClose={() => setDeletingCard(null)}
        card={deletingCard}
      />
    </div>
  );
}
