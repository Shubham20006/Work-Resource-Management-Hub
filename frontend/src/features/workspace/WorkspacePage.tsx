import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Edit,
  Edit2,
  ExternalLink,
  FolderGit2,
  FolderInput,
  FolderPlus,
  Globe,
  GripVertical,
  Mail,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getColorClasses } from '../../components/ui/ColorPicker';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { IconRenderer } from '../../components/ui/IconRenderer';
import { CardFormModal } from '../dashboard/CardFormModal';
import { DeleteCardDialog } from '../dashboard/DeleteCardDialog';
import { useCard } from '../../hooks/useCards';
import {
  useDeleteItem,
  useDeleteResource,
  useDeleteSubGroup,
  useMoveResourceSubGroup,
  useReorderItems,
  useReorderResources,
  useReorderSubGroups,
} from '../../hooks/useWorkspace';
import { Item, Resource, SubGroup } from '../../types';
import { cn } from '../../utils/cn';
import { ItemFormModal } from './ItemFormModal';
import { MoveItemModal } from './MoveItemModal';
import { ResourceFormModal } from './ResourceFormModal';
import { SubGroupFormModal } from './SubGroupFormModal';

export function WorkspacePage() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const { data: card, isLoading, isError } = useCard(cardId);

  // Mutations
  const deleteItemMutation = useDeleteItem();
  const deleteResourceMutation = useDeleteResource();
  const deleteSubGroupMutation = useDeleteSubGroup();
  const moveResourceSubGroupMutation = useMoveResourceSubGroup();
  const reorderItemsMutation = useReorderItems();
  const reorderResourcesMutation = useReorderResources();
  const reorderSubGroupsMutation = useReorderSubGroups();

  const [searchQuery, setSearchQuery] = useState('');

  // Accordion collapsed state: stores IDs of collapsed groups and sub-groups
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [isDeleteCardModalOpen, setIsDeleteCardModalOpen] = useState(false);

  // Item Modal state (Add / Edit Group)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  // Move Item modal state
  const [itemToMove, setItemToMove] = useState<Item | null>(null);

  // Sub-group Modal state
  const [subGroupModalTarget, setSubGroupModalTarget] = useState<{
    itemId: string;
    itemName: string;
    subGroupToEdit?: SubGroup | null;
  } | null>(null);

  // Resource Modal state (Add / Edit Link)
  const [resourceModalTarget, setResourceModalTarget] = useState<{
    itemId: string;
    itemName: string;
    subGroupId?: string;
    resourceToEdit?: Resource | null;
  } | null>(null);

  // Deletion confirm state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [subGroupToDelete, setSubGroupToDelete] = useState<{
    itemId: string;
    subGroupId: string;
    name: string;
  } | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<{
    itemId: string;
    resourceId: string;
    name: string;
  } | null>(null);

  // Drag and Drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedSubGroupId, setDraggedSubGroupId] = useState<string | null>(null);
  const [draggedResourceId, setDraggedResourceId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  const handleOpenUrl = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success(`Copied ${email}`);
  };

  const toggleAccordion = (id: string) => {
    setCollapsedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const colorConfig = card ? getColorClasses(card.color) : getColorClasses('indigo');
  const isProjects = card?.category === 'Projects';

  // Filtered items safely guarded
  const filteredItems = useMemo(() => {
    if (!card || !Array.isArray(card.items)) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return card.items;

    return card.items.filter((item) => {
      const matchesItemName = item.name?.toLowerCase().includes(q) || false;
      const matchesItemDesc = item.description?.toLowerCase().includes(q) || false;

      const resources = Array.isArray(item.resources) ? item.resources : [];
      const matchesResources = resources.some(
        (res) =>
          res.name?.toLowerCase().includes(q) ||
          res.description?.toLowerCase().includes(q) ||
          res.url?.toLowerCase().includes(q) ||
          res.emailsUsed?.some((e) => e.toLowerCase().includes(q))
      );

      const subGroups = Array.isArray(item.subGroups) ? item.subGroups : [];
      const matchesSubGroups = subGroups.some((sg) => {
        const matchesSgName = sg.name?.toLowerCase().includes(q) || false;
        const matchesSgDesc = sg.description?.toLowerCase().includes(q) || false;
        const sgRes = Array.isArray(sg.resources) ? sg.resources : [];
        const matchesSgRes = sgRes.some(
          (r) =>
            r.name?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.url?.toLowerCase().includes(q) ||
            r.emailsUsed?.some((e) => e.toLowerCase().includes(q))
        );
        return matchesSgName || matchesSgDesc || matchesSgRes;
      });

      return matchesItemName || matchesItemDesc || matchesResources || matchesSubGroups;
    });
  }, [card, searchQuery]);

  // All groups collapsed state check
  const allCollapsed = useMemo(() => {
    if (!filteredItems.length) return false;
    return filteredItems.every((item) => collapsedIds[item.id]);
  }, [filteredItems, collapsedIds]);

  const toggleExpandCollapseAll = () => {
    const nextState: Record<string, boolean> = {};
    const shouldCollapse = !allCollapsed;
    filteredItems.forEach((item) => {
      nextState[item.id] = shouldCollapse;
      if (Array.isArray(item.subGroups)) {
        item.subGroups.forEach((sg) => {
          nextState[sg.id] = shouldCollapse;
        });
      }
    });
    setCollapsedIds(nextState);
  };

  // Drag and Drop Handlers for Groups (Items)
  const handleGroupDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!card || !draggedItemId || draggedItemId === targetId) return;

    const currentIds = card.items.map((i) => i.id);
    const fromIdx = currentIds.indexOf(draggedItemId);
    const toIdx = currentIds.indexOf(targetId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const newIds = [...currentIds];
      const [moved] = newIds.splice(fromIdx, 1);
      newIds.splice(toIdx, 0, moved);
      reorderItemsMutation.mutate({ cardId: card.id, orderedItemIds: newIds });
    }
    setDraggedItemId(null);
  };

  // Drag and Drop Handlers for Sub-Groups
  const handleSubGroupDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedSubGroupId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSubGroupDrop = (
    e: React.DragEvent,
    itemId: string,
    targetSubGroupId: string,
    subGroups: SubGroup[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!card || !draggedSubGroupId || draggedSubGroupId === targetSubGroupId) return;

    const currentIds = subGroups.map((sg) => sg.id);
    const fromIdx = currentIds.indexOf(draggedSubGroupId);
    const toIdx = currentIds.indexOf(targetSubGroupId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const newIds = [...currentIds];
      const [moved] = newIds.splice(fromIdx, 1);
      newIds.splice(toIdx, 0, moved);
      reorderSubGroupsMutation.mutate({ cardId: card.id, itemId, orderedSubGroupIds: newIds });
    }
    setDraggedSubGroupId(null);
  };

  // Drag and Drop Handlers for Links (Resources)
  const handleResourceDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedResourceId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleResourceDrop = (
    e: React.DragEvent,
    itemId: string,
    targetResId: string,
    resources: Resource[],
    subGroupId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!card || !draggedResourceId || draggedResourceId === targetResId) return;

    const currentIds = resources.map((r) => r.id);
    const fromIdx = currentIds.indexOf(draggedResourceId);
    const toIdx = currentIds.indexOf(targetResId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const newIds = [...currentIds];
      const [moved] = newIds.splice(fromIdx, 1);
      newIds.splice(toIdx, 0, moved);
      reorderResourcesMutation.mutate({
        cardId: card.id,
        itemId,
        orderedResourceIds: newIds,
        subGroupId,
      });
    }
    setDraggedResourceId(null);
  };

  // Move link into a Sub-group via drag and drop
  const handleDropLinkOnSubGroup = (e: React.DragEvent, itemId: string, targetSubGroupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);
    if (!card || !draggedResourceId) return;

    moveResourceSubGroupMutation.mutate({
      cardId: card.id,
      itemId,
      resourceId: draggedResourceId,
      targetSubGroupId,
    });
    setDraggedResourceId(null);
  };

  // Move link to Direct Group links via drag and drop
  const handleDropLinkOnDirectGroup = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);
    if (!card || !draggedResourceId) return;

    moveResourceSubGroupMutation.mutate({
      cardId: card.id,
      itemId,
      resourceId: draggedResourceId,
      targetSubGroupId: null,
    });
    setDraggedResourceId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl bg-card border border-border p-6" />
        <div className="h-64 rounded-2xl bg-card border border-border" />
      </div>
    );
  }

  if (isError || !card) {
    return (
      <div className="text-center py-16 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <h2 className="text-lg font-bold text-destructive">Workspace Not Found</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          The requested workspace could not be found.
        </p>
        <Link to="/">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Workspaces</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditCardModalOpen(true)}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Workspace</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteCardModalOpen(true)}
            className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Workspace Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 text-xl',
                colorConfig.bgClass
              )}
            >
              <IconRenderer name={card.icon} className="h-6 w-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {card.name}
                </h1>
                {card.category && (
                  <Badge variant="secondary" size="md">
                    {card.category}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <Button
              onClick={() => {
                setItemToEdit(null);
                setIsAddItemModalOpen(true);
              }}
              className="gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isProjects ? 'Add Subproject' : 'Add Group'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar & Accordion Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isProjects
                ? 'Search projects, repos, URLs, emails...'
                : 'Search groups, sub-groups, sheets, URLs...'
            }
            className="h-9.5 w-full rounded-xl border border-border bg-muted/20 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <button
            onClick={toggleExpandCollapseAll}
            className="h-9 px-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title={allCollapsed ? 'Expand All Groups' : 'Collapse All Groups'}
          >
            {allCollapsed ? (
              <>
                <ChevronsUpDown className="h-3.5 w-3.5 text-primary" />
                <span>Expand All</span>
              </>
            ) : (
              <>
                <ChevronsDownUp className="h-3.5 w-3.5 text-primary" />
                <span>Collapse All</span>
              </>
            )}
          </button>

          <span className="text-xs font-semibold text-muted-foreground px-3 py-2 rounded-xl bg-muted/40 shrink-0 border border-border/40">
            {filteredItems.length}{' '}
            {isProjects
              ? filteredItems.length === 1
                ? 'Project'
                : 'Projects'
              : filteredItems.length === 1
                ? 'Group'
                : 'Groups'}
          </span>
        </div>
      </div>

      {/* Subprojects / Groups List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card p-6">
            <p className="text-sm font-bold text-foreground">
              No {isProjects ? 'projects' : 'groups'} found
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {searchQuery
                ? 'Try clearing your search query.'
                : isProjects
                  ? 'Add your first subproject (e.g. "Review AI", "Content AI").'
                  : 'Add your first group (e.g. "Student Details", "Attendance").'}
            </p>
            {!searchQuery && (
              <Button
                size="sm"
                onClick={() => {
                  setItemToEdit(null);
                  setIsAddItemModalOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>{isProjects ? 'Add Subproject' : 'Add Group'}</span>
              </Button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isItemCollapsed = !!collapsedIds[item.id];
            const directResources = Array.isArray(item.resources) ? item.resources : [];
            const subGroups = Array.isArray(item.subGroups) ? item.subGroups : [];

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleGroupDragStart(e, item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleGroupDrop(e, item.id)}
                className={cn(
                  'rounded-2xl border border-border bg-card overflow-hidden shadow-2xs transition-all duration-200',
                  draggedItemId === item.id && 'opacity-40 border-primary border-dashed ring-2 ring-primary/30'
                )}
              >
                {/* Group / Subproject Accordion Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 border-b border-border/60 gap-3 select-none">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-0.5 rounded transition-colors shrink-0"
                      title="Drag to reorder group"
                    >
                      <GripVertical className="h-4.5 w-4.5" />
                    </div>

                    {/* Accordion Toggle Button */}
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className="p-1 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                      title={isItemCollapsed ? 'Expand Group' : 'Collapse Group'}
                    >
                      {isItemCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      )}
                    </button>

                    <div onClick={() => toggleAccordion(item.id)} className="cursor-pointer min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-extrabold text-base text-foreground hover:text-primary transition-colors">
                          {item.name}
                        </h2>
                        <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border/60">
                          {directResources.length +
                            subGroups.reduce((acc, sg) => acc + (sg.resources?.length || 0), 0)}{' '}
                          links
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap pl-7 sm:pl-0">
                    {/* Non-Projects category: Direct Sheet/Resource URL Open Button */}
                    {!isProjects && item.resourceUrl && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenUrl(item.resourceUrl!)}
                        className="h-8 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        <span>Open</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {/* Projects category: GitHub Repository Open Button */}
                    {isProjects && item.githubUrl && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenUrl(item.githubUrl!)}
                        className="h-8 px-3 text-xs gap-1.5 cursor-pointer font-semibold border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <FolderGit2 className="h-3.5 w-3.5" />
                        <span>GitHub Repository</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </Button>
                    )}

                    {/* Add Sub-group */}
                    <button
                      onClick={() =>
                        setSubGroupModalTarget({
                          itemId: item.id,
                          itemName: item.name,
                          subGroupToEdit: null,
                        })
                      }
                      className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Add a nested sub-group under this group"
                    >
                      <FolderPlus className="h-3.5 w-3.5 text-primary" />
                      <span className="hidden sm:inline">Add Sub-group</span>
                    </button>

                    {/* Move Group to another workspace */}
                    <button
                      onClick={() => setItemToMove(item)}
                      className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Move to another workspace"
                    >
                      <FolderInput className="h-3.5 w-3.5 text-primary" />
                      <span className="hidden sm:inline">Move</span>
                    </button>

                    {/* Edit Group */}
                    <button
                      onClick={() => {
                        setItemToEdit(item);
                        setIsAddItemModalOpen(true);
                      }}
                      className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit Group"
                    >
                      <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {/* Add Direct Link */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setResourceModalTarget({
                          itemId: item.id,
                          itemName: item.name,
                          resourceToEdit: null,
                        })
                      }
                      className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Link</span>
                    </Button>

                    {/* Delete Item */}
                    <button
                      onClick={() => setItemToDelete({ id: item.id, name: item.name })}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete Group"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Accordion Content Body */}
                {!isItemCollapsed && (
                  <div className="p-4 space-y-4">
                    {/* Sub-groups Sections */}
                    {subGroups.length > 0 && (
                      <div className="space-y-3">
                        {subGroups.map((sg) => {
                          const isSubGroupCollapsed = !!collapsedIds[sg.id];
                          const sgResources = Array.isArray(sg.resources) ? sg.resources : [];
                          const isDragTarget = dragOverTargetId === sg.id;

                          return (
                            <div
                              key={sg.id}
                              draggable
                              onDragStart={(e) => handleSubGroupDragStart(e, sg.id)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (draggedResourceId && dragOverTargetId !== sg.id) {
                                  setDragOverTargetId(sg.id);
                                }
                              }}
                              onDragLeave={() => {
                                if (dragOverTargetId === sg.id) setDragOverTargetId(null);
                              }}
                              onDrop={(e) => {
                                if (draggedResourceId) {
                                  handleDropLinkOnSubGroup(e, item.id, sg.id);
                                } else if (draggedSubGroupId) {
                                  handleSubGroupDrop(e, item.id, sg.id, subGroups);
                                }
                              }}
                              className={cn(
                                'rounded-xl border border-primary/20 bg-muted/15 overflow-hidden shadow-2xs transition-all duration-200',
                                draggedSubGroupId === sg.id &&
                                'opacity-40 border-primary border-dashed ring-2 ring-primary/30',
                                isDragTarget && 'ring-2 ring-primary border-primary bg-primary/10 scale-[1.01]'
                              )}
                            >
                              {/* Sub-group Accordion Header & Drop Target */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2.5 bg-muted/40 border-b border-border/50 gap-2 select-none">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-0.5 rounded transition-colors shrink-0"
                                    title="Drag to reorder sub-group"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>

                                  <button
                                    onClick={() => toggleAccordion(sg.id)}
                                    className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                                    title={isSubGroupCollapsed ? 'Expand Sub-group' : 'Collapse Sub-group'}
                                  >
                                    {isSubGroupCollapsed ? (
                                      <ChevronRight className="h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5 text-primary" />
                                    )}
                                  </button>

                                  <div
                                    onClick={() => toggleAccordion(sg.id)}
                                    className="cursor-pointer min-w-0 flex items-center gap-2 flex-wrap"
                                  >
                                    <span className="font-bold text-sm text-foreground hover:text-primary transition-colors">
                                      📁 {sg.name}
                                    </span>
                                    <span className="text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded-full bg-background border border-border/60">
                                      {sgResources.length} links
                                    </span>
                                    {sg.description && (
                                      <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-xs">
                                        - {sg.description}
                                      </span>
                                    )}
                                    {draggedResourceId && (
                                      <span className="text-[10px] font-semibold text-primary animate-pulse bg-primary/10 px-2 py-0.5 rounded-full border border-primary/30">
                                        Drop link here to move
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Sub-group Actions */}
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pl-6 sm:pl-0">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      setResourceModalTarget({
                                        itemId: item.id,
                                        itemName: `${item.name} > ${sg.name}`,
                                        subGroupId: sg.id,
                                        resourceToEdit: null,
                                      })
                                    }
                                    className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Add Link</span>
                                  </Button>

                                  <button
                                    onClick={() =>
                                      setSubGroupModalTarget({
                                        itemId: item.id,
                                        itemName: item.name,
                                        subGroupToEdit: sg,
                                      })
                                    }
                                    className="h-7 w-7 rounded-md border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                                    title="Edit Sub-group"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>

                                  <button
                                    onClick={() =>
                                      setSubGroupToDelete({
                                        itemId: item.id,
                                        subGroupId: sg.id,
                                        name: sg.name,
                                      })
                                    }
                                    className="h-7 w-7 rounded-md border border-border/60 bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
                                    title="Delete Sub-group"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Sub-group Links List */}
                              {!isSubGroupCollapsed && (
                                <div className="p-3 bg-card/60">
                                  {sgResources.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic py-2 text-center">
                                      No links in this sub-group. Drag a link here or click "+ Add Link".
                                    </p>
                                  ) : (
                                    <div className="divide-y divide-border/40">
                                      {sgResources.map((res) => (
                                        <div
                                          key={res.id}
                                          draggable
                                          onDragStart={(e) => handleResourceDragStart(e, res.id)}
                                          onDragOver={(e) => e.preventDefault()}
                                          onDrop={(e) =>
                                            handleResourceDrop(e, item.id, res.id, sgResources, sg.id)
                                          }
                                          className={cn(
                                            'py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg transition-all duration-150',
                                            draggedResourceId === res.id &&
                                            'opacity-40 border-primary border-dashed ring-1 ring-primary/30'
                                          )}
                                        >
                                          <div className="flex items-start gap-2 min-w-0">
                                            <div
                                              className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground p-0.5 mt-0.5 rounded transition-colors shrink-0"
                                              title="Drag to reorder or move link to another sub-group"
                                            >
                                              <GripVertical className="h-3.5 w-3.5" />
                                            </div>

                                            <div className="min-w-0 space-y-0.5">
                                              <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs sm:text-sm text-foreground">
                                                  {res.name}
                                                </span>
                                              </div>
                                              {res.description && (
                                                <p className="text-[11px] text-muted-foreground">
                                                  {res.description}
                                                </p>
                                              )}
                                              {/* Emails Used Chips */}
                                              {Array.isArray(res.emailsUsed) && res.emailsUsed.length > 0 && (
                                                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> Emails:
                                                  </span>
                                                  {res.emailsUsed.map((email) => (
                                                    <button
                                                      key={email}
                                                      onClick={() => handleCopyEmail(email)}
                                                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-foreground border border-border/60 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                                                      title="Click to copy email"
                                                    >
                                                      {email}
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                            <Button
                                              size="sm"
                                              onClick={() => handleOpenUrl(res.url)}
                                              className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                                            >
                                              <span>Open</span>
                                              <Globe className="h-3 w-3" />
                                            </Button>

                                            <button
                                              onClick={() =>
                                                setResourceModalTarget({
                                                  itemId: item.id,
                                                  itemName: `${item.name} > ${sg.name}`,
                                                  subGroupId: sg.id,
                                                  resourceToEdit: res,
                                                })
                                              }
                                              className="h-7 w-7 rounded-md border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                                              title="Edit Link"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </button>

                                            <button
                                              onClick={() =>
                                                setResourceToDelete({
                                                  itemId: item.id,
                                                  resourceId: res.id,
                                                  name: res.name,
                                                })
                                              }
                                              className="h-7 w-7 rounded-md border border-border/60 bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
                                              title="Delete Link"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Direct Links Section (also a drop zone for moving back to direct group links) */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedResourceId && dragOverTargetId !== `direct-${item.id}`) {
                          setDragOverTargetId(`direct-${item.id}`);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTargetId === `direct-${item.id}`) setDragOverTargetId(null);
                      }}
                      onDrop={(e) => handleDropLinkOnDirectGroup(e, item.id)}
                      className={cn(
                        'p-2 rounded-xl border border-transparent transition-all duration-200',
                        dragOverTargetId === `direct-${item.id}` &&
                        'border-primary/50 bg-primary/5 ring-2 ring-primary/30'
                      )}
                    >
                      {subGroups.length > 0 && (
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                          <span>Direct Group Links</span>
                          {draggedResourceId && (
                            <span className="text-[10px] font-semibold text-primary animate-pulse">
                              Drop link here to move to Direct Links
                            </span>
                          )}
                        </div>
                      )}

                      {directResources.length === 0 && subGroups.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-border/60 rounded-xl bg-muted/10">
                          <p className="text-xs text-muted-foreground">No links added under this group.</p>
                          <div className="flex items-center justify-center gap-3 mt-2">
                            <button
                              onClick={() =>
                                setSubGroupModalTarget({
                                  itemId: item.id,
                                  itemName: item.name,
                                  subGroupToEdit: null,
                                })
                              }
                              className="text-xs text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                            >
                              <FolderPlus className="h-3.5 w-3.5" /> Create Sub-group
                            </button>
                            <span className="text-muted-foreground text-xs">•</span>
                            <button
                              onClick={() =>
                                setResourceModalTarget({
                                  itemId: item.id,
                                  itemName: item.name,
                                  resourceToEdit: null,
                                })
                              }
                              className="text-xs text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Direct Link
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="divide-y divide-border/60">
                          {directResources.map((res) => (
                            <div
                              key={res.id}
                              draggable
                              onDragStart={(e) => handleResourceDragStart(e, res.id)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) =>
                                handleResourceDrop(e, item.id, res.id, directResources)
                              }
                              className={cn(
                                'py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-xl transition-all duration-150',
                                draggedResourceId === res.id &&
                                'opacity-40 border-primary border-dashed ring-2 ring-primary/30'
                              )}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div
                                  className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-0.5 mt-0.5 rounded transition-colors shrink-0"
                                  title="Drag link into a sub-group or reorder"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>

                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-foreground">
                                      {res.name}
                                    </span>
                                  </div>

                                  {res.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {res.description}
                                    </p>
                                  )}

                                  {/* Emails Used Chips */}
                                  {Array.isArray(res.emailsUsed) && res.emailsUsed.length > 0 && (
                                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> Emails Used:
                                      </span>
                                      {res.emailsUsed.map((email) => (
                                        <button
                                          key={email}
                                          onClick={() => handleCopyEmail(email)}
                                          className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted/60 text-foreground border border-border/60 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                                          title="Click to copy email"
                                        >
                                          {email}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Link Actions */}
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenUrl(res.url)}
                                  className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
                                >
                                  <span>Open</span>
                                  <Globe className="h-3.5 w-3.5" />
                                </Button>

                                <button
                                  onClick={() =>
                                    setResourceModalTarget({
                                      itemId: item.id,
                                      itemName: item.name,
                                      resourceToEdit: res,
                                    })
                                  }
                                  className="h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                                  title="Edit Link"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  onClick={() =>
                                    setResourceToDelete({
                                      itemId: item.id,
                                      resourceId: res.id,
                                      name: res.name,
                                    })
                                  }
                                  className="h-8 w-8 rounded-lg border border-border bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
                                  title="Delete Link"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Workspace Edit Modal */}
      <CardFormModal
        isOpen={isEditCardModalOpen}
        onClose={() => setIsEditCardModalOpen(false)}
        cardToEdit={card}
      />

      {/* Workspace Delete Dialog */}
      <DeleteCardDialog
        isOpen={isDeleteCardModalOpen}
        onClose={() => {
          setIsDeleteCardModalOpen(false);
          navigate('/');
        }}
        card={card}
      />

      {/* Add / Edit Item (Subproject / Group) Modal */}
      <ItemFormModal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setItemToEdit(null);
        }}
        cardId={card.id}
        cardCategory={card.category}
        itemToEdit={itemToEdit}
      />

      {/* Move Subproject / Group Modal */}
      {itemToMove && (
        <MoveItemModal
          isOpen={!!itemToMove}
          onClose={() => setItemToMove(null)}
          currentCardId={card.id}
          item={itemToMove}
        />
      )}

      {/* Add / Edit Sub-group Modal */}
      {subGroupModalTarget && (
        <SubGroupFormModal
          isOpen={!!subGroupModalTarget}
          onClose={() => setSubGroupModalTarget(null)}
          cardId={card.id}
          itemId={subGroupModalTarget.itemId}
          itemName={subGroupModalTarget.itemName}
          subGroupToEdit={subGroupModalTarget.subGroupToEdit}
        />
      )}

      {/* Add / Edit Link Modal */}
      {resourceModalTarget && (
        <ResourceFormModal
          isOpen={!!resourceModalTarget}
          onClose={() => setResourceModalTarget(null)}
          cardId={card.id}
          itemId={resourceModalTarget.itemId}
          itemName={resourceModalTarget.itemName}
          subGroupId={resourceModalTarget.subGroupId}
          resourceToEdit={resourceModalTarget.resourceToEdit}
        />
      )}

      {/* Delete Item Confirm Dialog */}
      {itemToDelete && (
        <ConfirmDialog
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={() => {
            deleteItemMutation.mutate({
              cardId: card.id,
              itemId: itemToDelete.id,
            });
            setItemToDelete(null);
          }}
          title={`Delete "${itemToDelete.name}"?`}
          message="Are you sure you want to delete this group/subproject and all its links and sub-groups?"
          confirmLabel="Delete"
          isDestructive
        />
      )}

      {/* Delete Sub-group Confirm Dialog */}
      {subGroupToDelete && (
        <ConfirmDialog
          isOpen={!!subGroupToDelete}
          onClose={() => setSubGroupToDelete(null)}
          onConfirm={() => {
            deleteSubGroupMutation.mutate({
              cardId: card.id,
              itemId: subGroupToDelete.itemId,
              subGroupId: subGroupToDelete.subGroupId,
            });
            setSubGroupToDelete(null);
          }}
          title={`Delete Sub-group "${subGroupToDelete.name}"?`}
          message="Are you sure you want to delete this sub-group and all links inside it?"
          confirmLabel="Delete Sub-group"
          isDestructive
        />
      )}

      {/* Delete Link Confirm Dialog */}
      {resourceToDelete && (
        <ConfirmDialog
          isOpen={!!resourceToDelete}
          onClose={() => setResourceToDelete(null)}
          onConfirm={() => {
            deleteResourceMutation.mutate({
              cardId: card.id,
              itemId: resourceToDelete.itemId,
              resourceId: resourceToDelete.resourceId,
            });
            setResourceToDelete(null);
          }}
          title={`Delete Link "${resourceToDelete.name}"?`}
          message="Are you sure you want to delete this link?"
          confirmLabel="Delete Link"
          isDestructive
        />
      )}
    </div>
  );
}
