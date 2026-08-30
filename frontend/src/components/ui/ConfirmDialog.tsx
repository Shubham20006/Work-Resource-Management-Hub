import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-medium text-foreground">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
