import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-card border border-border/80 shadow-2xl p-6 z-10 animate-slide-up dark:bg-slate-900/95 dark:border-slate-800 my-auto',
          maxWidths[maxWidth]
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/50">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
