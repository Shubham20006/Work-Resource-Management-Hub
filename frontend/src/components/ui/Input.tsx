import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'flex h-11 w-full rounded-xl border border-input bg-card/60 px-3.5 py-2 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-destructive focus:ring-destructive/50 focus:border-destructive',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-destructive font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
