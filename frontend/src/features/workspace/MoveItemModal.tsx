import { AlertCircle, ArrowRight, FolderKanban, Layers } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { getColorClasses } from '../../components/ui/ColorPicker';
import { IconRenderer } from '../../components/ui/IconRenderer';
import { Modal } from '../../components/ui/Modal';
import { useCards } from '../../hooks/useCards';
import { useMoveItem } from '../../hooks/useWorkspace';
import { Item } from '../../types';
import { cn } from '../../utils/cn';

interface MoveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCardId: string;
  item: Item;
}

export function MoveItemModal({ isOpen, onClose, currentCardId, item }: MoveItemModalProps) {
  const { data: cards = [] } = useCards();
  const moveItemMutation = useMoveItem();

  const otherCards = cards.filter((c) => c.id !== currentCardId);
  const [selectedTargetCardId, setSelectedTargetCardId] = useState<string>(
    otherCards.length > 0 ? otherCards[0].id : ''
  );
  const [isConfirmed, setIsConfirmed] = useState(false);

  const targetCard = cards.find((c) => c.id === selectedTargetCardId);

  const handleMove = async () => {
    if (!selectedTargetCardId) return;
    try {
      await moveItemMutation.mutateAsync({
        cardId: currentCardId,
        itemId: item.id,
        targetCardId: selectedTargetCardId,
      });
      onClose();
    } catch (e) {
      // Handled by toast
    }
  };

  const resourceCount = item?.resources?.length || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Move Sub-Project to Another Workspace"
      description={`Transfer "${item.name}" and all its ${resourceCount} attached links.`}
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        {otherCards.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-border rounded-xl">
            <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">
              You don't have any other workspaces to move this sub-project to.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Select Destination Workspace:
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {otherCards.map((c) => {
                  const colorConfig = getColorClasses(c.color);
                  const isSelected = selectedTargetCardId === c.id;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedTargetCardId(c.id);
                        setIsConfirmed(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0',
                            colorConfig.bgClass
                          )}
                        >
                          <IconRenderer name={c.icon} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {c.items.length} sub-projects
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-xs font-semibold text-primary">Selected</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirmation Box */}
            {targetCard && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold">Confirm Move Action</p>
                    <p className="mt-0.5 leading-relaxed text-foreground/80">
                      Are you sure you want to move <strong>"{item.name}"</strong> ({resourceCount} links) to workspace <strong>"{targetCard.name}"</strong>?
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
                  <span className="font-medium">I understand and want to move this project</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
              <Button type="button" variant="secondary" onClick={onClose} disabled={moveItemMutation.isPending}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleMove}
                disabled={!selectedTargetCardId || !isConfirmed}
                isLoading={moveItemMutation.isPending}
                className="gap-1.5"
              >
                <span>Confirm Move</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
