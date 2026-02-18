'use client';

import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onNavigate={closeSidebar} />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <div id="pdf-content">
          {children}
        </div>
      </main>
    </div>
  );
}
