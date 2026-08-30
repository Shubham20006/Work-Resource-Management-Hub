import React from 'react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useDeleteCard } from '../../hooks/useCards';
import { Card } from '../../types';

interface DeleteCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
}

export function DeleteCardDialog({ isOpen, onClose, card }: DeleteCardDialogProps) {
  const deleteMutation = useDeleteCard();

  if (!card) return null;

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(card.id);
      onClose();
    } catch (e) {
      // Error handled by mutation hook
    }
  };

  const items = Array.isArray(card.items) ? card.items : [];
  const totalResources = items.reduce(
    (acc, item) => acc + (Array.isArray(item.resources) ? item.resources.length : 0),
    0
  );

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Delete "${card.name}"?`}
      message={`Are you sure you want to delete this workspace? This will also remove ${items.length} sub-project item(s) and ${totalResources} linked resource(s). This action cannot be undone.`}
      confirmLabel="Delete Workspace"
      isDestructive
      isLoading={deleteMutation.isPending}
    />
  );
}
