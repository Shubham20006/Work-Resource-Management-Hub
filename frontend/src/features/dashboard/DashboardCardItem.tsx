import { Edit2, ExternalLink, Trash2 } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { getColorClasses } from '../../components/ui/ColorPicker';
import { IconRenderer } from '../../components/ui/IconRenderer';
import { Card } from '../../types';
import { cn } from '../../utils/cn';

interface DashboardCardItemProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
}

export function DashboardCardItem({ card, onEdit, onDelete }: DashboardCardItemProps) {
  const navigate = useNavigate();
  const colorConfig = getColorClasses(card.color);

  const isProjects = card.category === 'Projects';
  const itemCountLabel = isProjects
    ? `${card.items.length} ${card.items.length === 1 ? 'Project' : 'Projects'}`
    : `${card.items.length} ${card.items.length === 1 ? 'Group' : 'Groups'}`;

  const handleOpenWorkspace = () => {
    navigate(`/workspace/${card.id}`);
  };

  return (
    <div
      onClick={handleOpenWorkspace}
      className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer shadow-2xs"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0',
                colorConfig.bgClass
              )}
            >
              <IconRenderer name={card.icon} className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                {card.name}
              </h3>
              {card.category && (
                <Badge variant="secondary" size="sm" className="mt-0.5 font-medium">
                  {card.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEdit(card)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Edit Workspace"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(card)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title="Delete Workspace"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 min-h-[34px]">
          {card.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
        <span className="font-semibold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
          {itemCountLabel}
        </span>

        <button
          onClick={handleOpenWorkspace}
          className="inline-flex items-center gap-1.5 font-bold text-xs text-primary hover:underline cursor-pointer"
        >
          <span>Open Workspace</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
