import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CardFormModal } from '../../features/dashboard/CardFormModal';
import { GlobalCommandDialog } from '../../features/search/GlobalCommandDialog';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Permanent Fixed Left Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Right Area: Header permanently pinned at top, Main scrolls inside */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAddCard={() => setIsAddCardOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 custom-scrollbar">
          <div className="max-w-7xl w-full mx-auto animate-fade-in pb-12">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Command/Search Dialog */}
      <GlobalCommandDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Add Workspace Modal */}
      <CardFormModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
      />
    </div>
  );
}
