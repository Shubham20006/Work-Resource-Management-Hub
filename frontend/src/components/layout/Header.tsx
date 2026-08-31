import { LogOut, Menu, Moon, Plus, Search, Sun, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Breadcrumbs } from './Breadcrumbs';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenAddCard: () => void;
}

export function Header({ onToggleSidebar, onOpenSearch, onOpenAddCard }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-6 shadow-2xs transition-colors shrink-0">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <Breadcrumbs />
      </div>

      {/* Right: Search, Theme Toggle, User Profile & Add Button */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 h-8.5 px-3 text-xs text-muted-foreground bg-muted/40 hover:bg-muted/80 border border-border rounded-xl transition-all w-36 sm:w-60 justify-between group shadow-2xs cursor-pointer"
          title="Search all workspaces, sheets, and links (⌘K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-primary group-hover:text-primary transition-colors shrink-0" />
            <span className="truncate">Search sheets, links...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center h-4.5 px-1.5 text-[10px] font-mono text-muted-foreground bg-card rounded border border-border shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="h-8.5 w-8.5 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border cursor-pointer shadow-2xs"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600" />
          )}
        </button>

        {/* User Pill & Logout */}
        {user && (
          <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-xl px-2.5 py-1">
            <div className="flex items-center gap-1.5 max-w-[140px] sm:max-w-[200px] truncate text-xs text-foreground font-medium">
              <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                {user.name ? user.name[0].toUpperCase() : <User className="h-3 w-3" />}
              </div>
              <span className="truncate hidden sm:inline" title={user.email}>
                {user.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="h-6 w-6 ml-1 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Add Workspace Button */}
        <button
          onClick={onOpenAddCard}
          className="flex items-center gap-1.5 h-8.5 px-3 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Workspace</span>
        </button>
      </div>
    </header>
  );
}
