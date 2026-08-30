import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  LayoutDashboard,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCards, useReorderCards } from '../../hooks/useCards';
import { cn } from '../../utils/cn';
import { getColorClasses } from '../ui/ColorPicker';
import { IconRenderer } from '../ui/IconRenderer';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { data: cards = [] } = useCards();
  const reorderCardsMutation = useReorderCards();

  // Drag and Drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragOver = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCardId !== cardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCardId(null);
  };

  const handleDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetCardId) {
      setDraggedCardId(null);
      setDragOverCardId(null);
      return;
    }

    const sourceIndex = cards.findIndex((c) => c.id === draggedCardId);
    const targetIndex = cards.findIndex((c) => c.id === targetCardId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newCards = [...cards];
      const [movedItem] = newCards.splice(sourceIndex, 1);
      newCards.splice(targetIndex, 0, movedItem);

      const orderedIds = newCards.map((c) => c.id);
      reorderCardsMutation.mutate(orderedIds);
    }

    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/70 bg-card/95 backdrop-blur-xl transition-all duration-200 ease-in-out lg:static h-full shrink-0 overflow-hidden select-none',
          isCollapsed ? 'w-16' : 'w-60',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Brand Logo */}
        <div className="flex h-14 items-center justify-between px-3.5 border-b border-border/60 shrink-0">
          <Link
            to="/"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 group overflow-hidden"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary to-violet-500 flex items-center justify-center text-white shadow-md shadow-primary/30 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-sm tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                WorkHub
              </span>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onMobileClose}
            className="lg:hidden h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-6 w-6 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation List (Scrolls independently inside sidebar if many workspaces) */}
        <div className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Main Dashboard Link */}
          <div>
            <Link
              to="/"
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group',
                location.pathname === '/'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
              )}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          </div>

          {/* Workspaces List with Drag & Drop */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3 text-primary" />
                  <span>Workspaces</span>
                </span>
                <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded font-mono">
                  {cards.length}
                </span>
              </div>
            )}

            <div className="space-y-0.5 pt-0.5">
              {cards.map((card) => {
                const isActive = location.pathname === `/workspace/${card.id}`;
                const colorConfig = getColorClasses(card.color);
                const isDragging = draggedCardId === card.id;
                const isDragOver = dragOverCardId === card.id;

                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onDragOver={(e) => handleDragOver(e, card.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, card.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'group relative rounded-xl transition-all',
                      isDragging && 'opacity-40 scale-95',
                      isDragOver && 'border-t-2 border-primary pt-0.5'
                    )}
                  >
                    <Link
                      to={`/workspace/${card.id}`}
                      onClick={onMobileClose}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-medium transition-all group/link',
                        isActive
                          ? 'bg-accent text-foreground font-semibold border border-border/80 shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                      title={card.name}
                    >
                      {/* Drag Handle Icon on hover */}
                      {!isCollapsed && (
                        <span className="opacity-0 group-hover/link:opacity-60 text-muted-foreground cursor-grab active:cursor-grabbing -ml-1">
                          <GripVertical className="h-3 w-3" />
                        </span>
                      )}

                      <div
                        className={cn(
                          'h-5 w-5 rounded-md flex items-center justify-center text-white shrink-0 shadow-xs text-[9px]',
                          colorConfig.bgClass
                        )}
                      >
                        <IconRenderer name={card.icon} className="h-3 w-3" />
                      </div>

                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate text-xs">{card.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-1 font-mono">
                            {card.items.length}
                          </span>
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
