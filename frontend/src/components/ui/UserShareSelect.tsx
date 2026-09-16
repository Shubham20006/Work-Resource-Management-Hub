import { Search, UserPlus, X } from 'lucide-react';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { SharedWith, User } from '../../types';
import { cn } from '../../utils/cn';

interface UserShareSelectProps {
  value: SharedWith[];
  onChange: (value: SharedWith[]) => void;
  currentUserEmail?: string;
}

export function UserShareSelect({ value, onChange, currentUserEmail }: UserShareSelectProps) {
  const { data: users = [], isLoading } = useUsers();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.email !== currentUserEmail &&
        !value.some((v) => v.userId === user.id) &&
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, value, searchTerm, currentUserEmail]);

  const handleAddUser = (user: User) => {
    onChange([...value, { userId: user.id, role: 'viewer' }]);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    onChange(value.filter((v) => v.userId !== userId));
  };

  const handleRoleChange = (userId: string, role: 'viewer' | 'editor') => {
    onChange(
      value.map((v) =>
        v.userId === userId ? { ...v, role } : v
      )
    );
  };

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-foreground">Share With Users</label>
      
      {/* Selected Users */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((shared) => {
            const user = users.find((u) => u.id === shared.userId);
            if (!user) return null;
            return (
              <div
                key={shared.userId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl border border-border bg-muted/20"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate text-foreground">{user.name}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={shared.role}
                    onChange={(e) => handleRoleChange(shared.userId, e.target.value as 'viewer' | 'editor')}
                    className="h-7 text-xs bg-card border border-border rounded-lg px-2 focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(shared.userId)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add User Dropdown */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex items-center h-10 w-full rounded-xl border border-border bg-card px-3 shadow-2xs transition-all cursor-text",
            isOpen && "ring-2 ring-primary/40 border-primary"
          )}
        >
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/70"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>

        {isOpen && (
          <div className="absolute z-50 top-full mt-1.5 w-full rounded-xl border border-border bg-card shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Loading users...</div>
            ) : availableUsers.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">No users found</div>
            ) : (
              <div className="p-1">
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleAddUser(user)}
                    className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                    </div>
                    <UserPlus className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
