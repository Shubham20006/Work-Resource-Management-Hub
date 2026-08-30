import { AlertCircle, ArrowRight, Layers, Link as LinkIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { getColorClasses } from '../../components/ui/ColorPicker';
import { IconRenderer } from '../../components/ui/IconRenderer';
import { Modal } from '../../components/ui/Modal';
import { useCards } from '../../hooks/useCards';
import { useMoveResource } from '../../hooks/useWorkspace';
import { Resource } from '../../types';
import { cn } from '../../utils/cn';

interface MoveResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCardId: string;
  currentItemId: string;
  resource: Resource;
}

export function MoveResourceModal({
  isOpen,
  onClose,
  currentCardId,
  currentItemId,
  resource,
}: MoveResourceModalProps) {
  const { data: cards = [] } = useCards();
  const moveResourceMutation = useMoveResource();

  const [selectedTargetCardId, setSelectedTargetCardId] = useState<string>(currentCardId);
  const targetCard = cards.find((c) => c.id === selectedTargetCardId);

  const availableItems = targetCard?.items || [];
  const [selectedTargetItemId, setSelectedTargetItemId] = useState<string>(() => {
    const valid = availableItems.find(
      (item) => !(selectedTargetCardId === currentCardId && item.id === currentItemId)
    );
    return valid ? valid.id : '';
  });

  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleCardChange = (cardId: string) => {
    setSelectedTargetCardId(cardId);
    const newTargetCard = cards.find((c) => c.id === cardId);
    const validItem = newTargetCard?.items.find(
      (item) => !(cardId === currentCardId && item.id === currentItemId)
    );
    setSelectedTargetItemId(validItem ? validItem.id : '');
    setIsConfirmed(false);
  };

  const handleMove = async () => {
    if (!selectedTargetCardId || !selectedTargetItemId) return;
    try {
      await moveResourceMutation.mutateAsync({
        cardId: currentCardId,
        itemId: currentItemId,
        resourceId: resource.id,
        targetCardId: selectedTargetCardId,
        targetItemId: selectedTargetItemId,
      });
      onClose();
    } catch (e) {
      // Handled by toast
    }
  };

  const targetItem = availableItems.find((i) => i.id === selectedTargetItemId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Move Link to Another Sub-Project"
      description={`Move "${resource.name}" to a different sub-project or workspace.`}
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        {/* Workspace Selection */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            1. Select Destination Workspace:
          </label>
          <select
            value={selectedTargetCardId}
            onChange={(e) => handleCardChange(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.items.length} sub-projects)
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Project Selection */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            2. Select Destination Sub-Project:
          </label>
          {availableItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic p-2 rounded-lg bg-muted/30">
              No sub-projects available in this workspace. Create one first!
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {availableItems.map((item) => {
                const isCurrent =
                  selectedTargetCardId === currentCardId && item.id === currentItemId;
                const isSelected = selectedTargetItemId === item.id;

                if (isCurrent) return null; // Can't move to same item

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedTargetItemId(item.id);
                      setIsConfirmed(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary font-bold'
                        : 'border-border bg-card hover:bg-muted text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {item.resources.length} links
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation */}
        {targetCard && targetItem && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
            <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold">Confirm Move</p>
                <p className="mt-0.5 leading-relaxed text-foreground/80">
                  Move <strong>"{resource.name}"</strong> to <strong>"{targetCard.name} → {targetItem.name}"</strong>?
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="font-medium">I confirm moving this link</span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <Button type="button" variant="secondary" onClick={onClose} disabled={moveResourceMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={!selectedTargetItemId || !isConfirmed}
            isLoading={moveResourceMutation.isPending}
            className="gap-1.5"
          >
            <span>Confirm Move</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
