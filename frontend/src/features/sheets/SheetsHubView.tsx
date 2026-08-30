import {
  ArrowUpDown,
  ArrowUpRight,
  Copy,
  Edit2,
  FileSpreadsheet,
  FileText,
  Folder,
  GripVertical,
  LayoutGrid,
  Search,
  Table as TableIcon,
  Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCards } from '../../hooks/useCards';
import { useDeleteResource, useReorderResources } from '../../hooks/useWorkspace';
import { Resource } from '../../types';
import { cn } from '../../utils/cn';
import { ResourceFormModal } from '../workspace/ResourceFormModal';

interface FlatSheetItem {
  resource: Resource;
  cardId: string;
  cardName: string;
  cardCategory?: string;
  itemId: string;
  itemName: string;
}

export function SheetsHubView() {
  const { data: cards = [] } = useCards();
  const deleteResourceMutation = useDeleteResource();
  const reorderResourcesMutation = useReorderResources();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('ALL');
  const [viewFormat, setViewFormat] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<'name' | 'workspace'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Drag and drop state
  const [draggedResId, setDraggedResId] = useState<string | null>(null);
  const [dragOverResId, setDragOverResId] = useState<string | null>(null);

  // Edit modal
  const [editingSheet, setEditingSheet] = useState<{
    cardId: string;
    itemId: string;
    itemName: string;
    resource: Resource;
  } | null>(null);

  // Flatten all Google Sheets, Docs, Forms, Drive links across all workspaces safely
  const allSheets: FlatSheetItem[] = useMemo(() => {
    const list: FlatSheetItem[] = [];
    (cards || []).forEach((c) => {
      (c.items || []).forEach((item) => {
        (item.resources || []).forEach((res) => {
          if (
            res.url?.includes('docs.google.com') ||
            res.url?.includes('drive.google.com') ||
            res.url?.includes('forms') ||
            res.url?.includes('classroom.google.com')
          ) {
            list.push({
              resource: res,
              cardId: c.id,
              cardName: c.name,
              cardCategory: c.category || 'Other',
              itemId: item.id,
              itemName: item.name,
            });
          }
        });
      });
    });
    return list;
  }, [cards]);

  // Unique Workspaces
  const workspaces = useMemo(() => {
    const map = new Map<string, string>();
    allSheets.forEach((s) => map.set(s.cardId, s.cardName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allSheets]);

  // Filtered and Sorted Sheets
  const filteredSheets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allSheets
      .filter((item) => {
        if (selectedWorkspace !== 'ALL' && item.cardId !== selectedWorkspace) {
          return false;
        }

        if (!q) return true;

        const matchesName = item.resource.name?.toLowerCase().includes(q) || false;
        const matchesCard = item.cardName?.toLowerCase().includes(q) || false;
        const matchesItem = item.itemName?.toLowerCase().includes(q) || false;
        const matchesDesc = item.resource.description?.toLowerCase().includes(q) || false;

        return matchesName || matchesCard || matchesItem || matchesDesc;
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortOrder === 'asc'
            ? (a.resource.name || '').localeCompare(b.resource.name || '')
            : (b.resource.name || '').localeCompare(a.resource.name || '');
        } else if (sortField === 'workspace') {
          return (a.cardName || '').localeCompare(b.cardName || '');
        }
        return 0;
      });
  }, [allSheets, searchQuery, selectedWorkspace, sortField, sortOrder]);

  const handleCopyLink = (e: React.MouseEvent, url: string, name: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success(`Copied link for "${name}"`);
  };

  const handleOpenSheet = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, resourceId: string) => {
    setDraggedResId(resourceId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', resourceId);
  };

  const handleDragOver = (e: React.DragEvent, resourceId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverResId !== resourceId) {
      setDragOverResId(resourceId);
    }
  };

  const handleDragLeave = () => {
    setDragOverResId(null);
  };

  const handleDrop = (e: React.DragEvent, targetItem: FlatSheetItem) => {
    e.preventDefault();
    if (!draggedResId || draggedResId === targetItem.resource.id) {
      setDraggedResId(null);
      setDragOverResId(null);
      return;
    }

    const sourceItem = allSheets.find((s) => s.resource.id === draggedResId);
    if (!sourceItem || sourceItem.itemId !== targetItem.itemId) {
      toast.info('Drag to reorder within the same sub-project');
      setDraggedResId(null);
      setDragOverResId(null);
      return;
    }

    // Reorder inside the same sub-project
    const itemInCard = cards.flatMap((c) => c.items || []).find((i) => i.id === targetItem.itemId);
    if (!itemInCard) return;

    const currentResources = [...(itemInCard.resources || [])];
    const srcIndex = currentResources.findIndex((r) => r.id === draggedResId);
    const tgtIndex = currentResources.findIndex((r) => r.id === targetItem.resource.id);

    if (srcIndex !== -1 && tgtIndex !== -1) {
      const [moved] = currentResources.splice(srcIndex, 1);
      currentResources.splice(tgtIndex, 0, moved);

      const orderedIds = currentResources.map((r) => r.id);
      reorderResourcesMutation.mutate({
        cardId: targetItem.cardId,
        itemId: targetItem.itemId,
        orderedResourceIds: orderedIds,
      });
    }

    setDraggedResId(null);
    setDragOverResId(null);
  };

  const handleDragEnd = () => {
    setDraggedResId(null);
    setDragOverResId(null);
  };

  const getSheetTypeIcon = (url: string) => {
    if (url?.includes('spreadsheets')) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
    }
    if (url?.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    if (url?.includes('drive.google.com/drive/folders')) {
      return <Folder className="h-4 w-4 text-amber-500" />;
    }
    if (url?.includes('forms')) {
      return <FileText className="h-4 w-4 text-purple-500" />;
    }
    return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search sheet title, group, workspace..."
            className="h-9.5 w-full rounded-xl border border-border bg-muted/30 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
          {/* Workspace Filter Dropdown */}
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="h-9 px-2.5 rounded-xl border border-border bg-muted/30 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer shrink-0"
          >
            <option value="ALL">All Workspaces ({allSheets.length})</option>
            {workspaces.map((w) => {
              const count = allSheets.filter((s) => s.cardId === w.id).length;
              return (
                <option key={w.id} value={w.id}>
                  {w.name} ({count})
                </option>
              );
            })}
          </select>

          {/* Table / Cards View Switcher */}
          <div className="flex items-center border border-border rounded-xl p-0.5 bg-muted/30 shrink-0">
            <button
              onClick={() => setViewFormat('table')}
              className={cn(
                'h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer',
                viewFormat === 'table'
                  ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs border border-border/80'
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
                  ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <span className="text-xs font-bold text-muted-foreground px-2.5 py-1.5 rounded-xl bg-muted/40 shrink-0 border border-border/40">
            {filteredSheets.length} Sheets
          </span>
        </div>
      </div>

      {/* TABLE VIEW WITH DRAG & DROP */}
      {viewFormat === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase text-[11px] tracking-wider select-none">
                <th className="py-3 px-2 text-center w-8"></th>
                <th className="py-3 px-2 w-8">Type</th>
                <th
                  onClick={() => {
                    setSortField('name');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Sheet / Document Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Workspace / Category</th>
                <th className="py-3 px-3">Group / Section</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredSheets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                    <p className="font-semibold text-foreground text-sm">No matching sheets found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Try clearing search filters.</p>
                  </td>
                </tr>
              ) : (
                filteredSheets.map((item) => {
                  const isDragging = draggedResId === item.resource.id;
                  const isDragOver = dragOverResId === item.resource.id;

                  return (
                    <tr
                      key={item.resource.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.resource.id)}
                      onDragOver={(e) => handleDragOver(e, item.resource.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, item)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleOpenSheet(item.resource.url)}
                      className={cn(
                        'group hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer',
                        isDragging && 'opacity-40 bg-emerald-500/10',
                        isDragOver && 'border-t-2 border-emerald-500'
                      )}
                    >
                      {/* Drag handle */}
                      <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <span className="opacity-40 group-hover:opacity-100 text-muted-foreground cursor-grab active:cursor-grabbing inline-block">
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>
                      </td>

                      {/* Type icon */}
                      <td className="py-2.5 px-2">
                        {getSheetTypeIcon(item.resource.url)}
                      </td>

                      {/* Sheet Name */}
                      <td className="py-2.5 px-3 font-medium text-foreground max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          <span className="font-bold text-xs truncate">{item.resource.name}</span>
                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-emerald-600 dark:text-emerald-400 shrink-0 transition-opacity" />
                        </div>
                        {item.resource.description && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-sm mt-0.5 font-normal">
                            {item.resource.description}
                          </p>
                        )}
                      </td>

                      {/* Workspace badge */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border/50 truncate max-w-[150px]">
                          {item.cardName}
                        </span>
                      </td>

                      {/* Sub-Project */}
                      <td className="py-2.5 px-3 text-muted-foreground font-medium truncate max-w-[160px]">
                        {item.itemName}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenSheet(item.resource.url)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                            title="Open Google Sheet"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </button>

                          <button
                            onClick={(e) =>
                              handleCopyLink(e, item.resource.url, item.resource.name)
                            }
                            className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                            title="Copy URL"
                          >
                            <Copy className="h-3 w-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSheet({
                                cardId: item.cardId,
                                itemId: item.itemId,
                                itemName: item.itemName,
                                resource: item.resource,
                              });
                            }}
                            className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit Sheet"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteResourceMutation.mutate({
                                cardId: item.cardId,
                                itemId: item.itemId,
                                resourceId: item.resource.id,
                              });
                            }}
                            className="h-7 w-7 rounded-lg border border-border bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Sheet"
                          >
                            <Trash2 className="h-3 w-3" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSheets.map((item) => (
            <div
              key={item.resource.id}
              onClick={() => handleOpenSheet(item.resource.url)}
              className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      {getSheetTypeIcon(item.resource.url)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase truncate block">
                        {item.cardName} • {item.itemName}
                      </span>
                      <h3 className="font-bold text-xs text-foreground truncate group-hover:text-emerald-600 transition-colors">
                        {item.resource.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {item.resource.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {item.resource.description}
                  </p>
                )}
              </div>

              <div className="pt-2.5 mt-3 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[160px]">
                  {item.resource.url?.replace(/^https?:\/\//, '') || ''}
                </span>

                <div className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Open</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Sheet Modal */}
      {editingSheet && (
        <ResourceFormModal
          isOpen={!!editingSheet}
          onClose={() => setEditingSheet(null)}
          cardId={editingSheet.cardId}
          itemId={editingSheet.itemId}
          itemName={editingSheet.itemName}
          resourceToEdit={editingSheet.resource}
        />
      )}
    </div>
  );
}
