import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[90px] w-full rounded-xl border border-input bg-card/60 px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/50 resize-y',
            error && 'border-destructive focus:ring-destructive/50 focus:border-destructive',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
