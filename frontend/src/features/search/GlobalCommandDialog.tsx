import {
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getColorClasses } from '../../components/ui/ColorPicker';
import { IconRenderer } from '../../components/ui/IconRenderer';
import { useCards } from '../../hooks/useCards';
import { cn } from '../../utils/cn';

interface GlobalCommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalCommandDialog({ isOpen, onClose }: GlobalCommandDialogProps) {
  const navigate = useNavigate();
  const { data: cards = [] } = useCards();
  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query on open
  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        cards: cards.slice(0, 4),
        resources: [],
        items: [],
      };
    }

    const matchedCards = cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );

    const matchedItems: Array<{ item: any; card: any }> = [];
    const matchedResources: Array<{ resource: any; item: any; card: any }> = [];

    cards.forEach((card) => {
      card.items.forEach((item) => {
        if (item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)) {
          matchedItems.push({ item, card });
        }
        item.resources.forEach((res) => {
          if (
            res.name.toLowerCase().includes(q) ||
            res.url.toLowerCase().includes(q) ||
            res.description?.toLowerCase().includes(q) ||
            res.emailsUsed?.some((e: string) => e.toLowerCase().includes(q))
          ) {
            matchedResources.push({ resource: res, item, card });
          }
        });
      });
    });

    return {
      cards: matchedCards,
      items: matchedItems,
      resources: matchedResources,
    };
  }, [query, cards]);

  if (!isOpen) return null;

  const handleSelectCard = (cardId: string) => {
    navigate(`/workspace/${cardId}`);
    onClose();
  };

  const handleOpenResource = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const totalResults =
    searchResults.cards.length + searchResults.items.length + searchResults.resources.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:pt-20">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-slide-up">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspaces, groups, sheets, URLs, emails..."
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {totalResults === 0 && query ? (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">No resources or workspaces found for "{query}".</p>
            </div>
          ) : null}

          {/* Cards / Workspaces */}
          {searchResults.cards.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                <span>Workspaces ({searchResults.cards.length})</span>
                {!query && <span className="text-[10px] lowercase text-primary font-normal">Quick Access</span>}
              </div>
              <div className="space-y-1">
                {searchResults.cards.map((card) => {
                  const colorConfig = getColorClasses(card.color);
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleSelectCard(card.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-accent transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs',
                            colorConfig.bgClass
                          )}
                        >
                          <IconRenderer name={card.icon} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-foreground truncate block group-hover:text-primary transition-colors">
                            {card.name}
                          </span>
                          <p className="text-xs text-muted-foreground truncate">{card.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {card.items?.length || 0} items
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direct Resources & Links */}
          {searchResults.resources.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Links & URLs ({searchResults.resources.length})
              </div>
              <div className="space-y-1.5">
                {searchResults.resources.map(({ resource, item, card }) => (
                  <div
                    key={resource.id}
                    onClick={() => handleOpenResource(resource.url)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-accent transition-colors group cursor-pointer border border-transparent hover:border-border"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-medium text-sm text-foreground truncate block group-hover:text-primary transition-colors">
                        {resource.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
                        <span>{card.name}</span>
                        <span>•</span>
                        <span>{item.name}</span>
                        <span>•</span>
                        <span className="truncate text-primary font-mono text-[11px]">
                          {resource.url}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-muted-foreground group-hover:text-primary">
                      <span className="text-xs hidden sm:inline-block">Open</span>
                      <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subprojects / Groups */}
          {searchResults.items.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Subprojects & Groups ({searchResults.items.length})
              </div>
              <div className="space-y-1">
                {searchResults.items.map(({ item, card }) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectCard(card.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-accent transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium text-sm text-foreground truncate block group-hover:text-primary transition-colors">
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate block">
                          in {card.name} • {item.resources?.length || 0} links
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border text-[10px]">↵</kbd> select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border text-[10px]">esc</kbd> close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            <span>Links open in new tab</span>
          </div>
        </div>
      </div>
    </div>
  );
}
