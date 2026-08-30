import {
  ArrowUpRight,
  Edit,
  FolderGit2,
  GripVertical,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useCards } from '../../hooks/useCards';
import { useReorderItems } from '../../hooks/useWorkspace';
import { Item } from '../../types';
import { cn } from '../../utils/cn';
import { ItemFormModal } from '../workspace/ItemFormModal';
import { ResourceFormModal } from '../workspace/ResourceFormModal';

interface FlatProjectItem {
  item: Item;
  cardId: string;
  cardName: string;
  cardColor: string;
}

export function ProjectsHubView() {
  const { data: cards = [] } = useCards();
  const reorderItemsMutation = useReorderItems();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewFormat, setViewFormat] = useState<'table' | 'cards'>('table');

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Modals
  const [editingItem, setEditingItem] = useState<{ cardId: string; item: Item } | null>(null);
  const [addResourceToItem, setAddResourceToItem] = useState<{
    cardId: string;
    itemId: string;
    itemName: string;
  } | null>(null);

  // Flatten all sub-projects / apps across workspaces safely
  const allProjects: FlatProjectItem[] = useMemo(() => {
    const list: FlatProjectItem[] = [];
    (cards || []).forEach((c) => {
      (c.items || []).forEach((item) => {
        list.push({
          item,
          cardId: c.id,
          cardName: c.name,
          cardColor: c.color,
        });
      });
    });
    return list;
  }, [cards]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allProjects.filter(({ item, cardName }) => {
      const resources = Array.isArray(item.resources) ? item.resources : [];
      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        cardName?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        resources.some(
          (r) =>
            r.name?.toLowerCase().includes(q) ||
            r.url?.toLowerCase().includes(q) ||
            r.emailsUsed?.some((e) => e.toLowerCase().includes(q))
        );

      return matchesSearch;
    });
  }, [allProjects, searchQuery]);

  const handleOpenUrl = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverItemId !== itemId) {
      setDragOverItemId(itemId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleDrop = (e: React.DragEvent, targetItem: FlatProjectItem) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetItem.item.id) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const sourceProject = allProjects.find((p) => p.item.id === draggedItemId);
    if (!sourceProject || sourceProject.cardId !== targetItem.cardId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    // Reorder inside the same workspace
    const workspaceCard = cards.find((c) => c.id === targetItem.cardId);
    if (!workspaceCard) return;

    const currentItems = [...(workspaceCard.items || [])];
    const srcIndex = currentItems.findIndex((i) => i.id === draggedItemId);
    const tgtIndex = currentItems.findIndex((i) => i.id === targetItem.item.id);

    if (srcIndex !== -1 && tgtIndex !== -1) {
      const [moved] = currentItems.splice(srcIndex, 1);
      currentItems.splice(tgtIndex, 0, moved);

      const orderedIds = currentItems.map((i) => i.id);
      reorderItemsMutation.mutate({
        cardId: targetItem.cardId,
        orderedItemIds: orderedIds,
      });
    }

    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subprojects, repos, workspace..."
            className="h-9.5 w-full rounded-xl border border-border bg-muted/30 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
          {/* Table / Cards Switcher */}
          <div className="flex items-center border border-border rounded-xl p-0.5 bg-muted/30 shrink-0">
            <button
              onClick={() => setViewFormat('table')}
              className={cn(
                'h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer',
                viewFormat === 'table'
                  ? 'bg-card text-primary shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewFormat('cards')}
              className={cn(
                'h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer',
                viewFormat === 'cards'
                  ? 'bg-card text-primary shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <span className="text-xs font-bold text-muted-foreground px-2.5 py-1.5 rounded-xl bg-muted/40 shrink-0 border border-border/40">
            {filteredProjects.length} Subprojects
          </span>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewFormat === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider select-none">
                <th className="py-3 px-2 text-center w-8"></th>
                <th className="py-3 px-3">Subproject / App Name</th>
                <th className="py-3 px-3">Workspace</th>
                <th className="py-3 px-3">GitHub Repository</th>
                <th className="py-3 px-3">Links Count</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50 text-primary" />
                    <p className="font-semibold text-foreground text-sm">No matching subprojects found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Try changing search terms.</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map(({ item, cardId, cardName }) => {
                  const isDragging = draggedItemId === item.id;
                  const isDragOver = dragOverItemId === item.id;
                  const resources = Array.isArray(item.resources) ? item.resources : [];

                  return (
                    <tr
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, item.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, { item, cardId, cardName, cardColor: '' })}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'group hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors',
                        isDragging && 'opacity-40 bg-primary/10',
                        isDragOver && 'border-t-2 border-primary'
                      )}
                    >
                      {/* Drag Handle */}
                      <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <span className="opacity-40 group-hover:opacity-100 text-muted-foreground cursor-grab active:cursor-grabbing inline-block">
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>
                      </td>

                      {/* Project Name */}
                      <td className="py-3 px-3 font-medium text-foreground max-w-[220px]">
                        <span className="font-bold text-xs truncate block">{item.name}</span>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5 font-normal">
                            {item.description}
                          </p>
                        )}
                      </td>

                      {/* Workspace */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border/50 truncate max-w-[150px]">
                          {cardName}
                        </span>
                      </td>

                      {/* GitHub */}
                      <td className="py-3 px-3">
                        {item.githubUrl ? (
                          <button
                            onClick={() => handleOpenUrl(item.githubUrl!)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <FolderGit2 className="h-3.5 w-3.5" />
                            <span>Repository</span>
                            <ArrowUpRight className="h-3 w-3 opacity-70" />
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>

                      {/* Links count */}
                      <td className="py-3 px-3">
                        <span className="text-xs text-muted-foreground font-mono">
                          {resources.length} links
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() =>
                              setAddResourceToItem({
                                cardId,
                                itemId: item.id,
                                itemName: item.name,
                              })
                            }
                            className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                            title="Add Link"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setEditingItem({ cardId, item })}
                            className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewFormat === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(({ item, cardId, cardName }) => {
            const resources = Array.isArray(item.resources) ? item.resources : [];

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase truncate block">
                        {cardName}
                      </span>
                      <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => setEditingItem({ cardId, item })}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 mt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-xs font-mono text-muted-foreground">
                    {resources.length} links
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAddResourceToItem({
                        cardId,
                        itemId: item.id,
                        itemName: item.name,
                      })
                    }
                    className="h-7 px-2 text-xs"
                  >
                    + Add Link
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Project Modal */}
      {editingItem && (
        <ItemFormModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          cardId={editingItem.cardId}
          cardCategory={cards.find((c) => c.id === editingItem.cardId)?.category}
          itemToEdit={editingItem.item}
        />
      )}

      {/* Add Resource to Project Modal */}
      {addResourceToItem && (
        <ResourceFormModal
          isOpen={!!addResourceToItem}
          onClose={() => setAddResourceToItem(null)}
          cardId={addResourceToItem.cardId}
          itemId={addResourceToItem.itemId}
          itemName={addResourceToItem.itemName}
        />
      )}
    </div>
  );
}
