'use client'; // Layout using SidebarProvider needs to be a client component

import React from 'react';
import { usePathname } from 'next/navigation'; // Import usePathname
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar, menuItems } from "@/components/dashboard-sidebar"; // Import menuItems
// Removed unused Button and PanelLeft
// import { Button } from '@/components/ui/button';
// import { PanelLeft } from 'lucide-react';

// Infer type for menu items for clarity
type MenuItem = typeof menuItems[number]['items'][number];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Find the current page title from menuItems
  let currentPageTitle = 'Dashboard'; // Default title
  for (const group of menuItems) {
    const foundItem = group.items.find((item: MenuItem) => {
      // Exact match for overview, prefix match for others
      return item.href === '/dashboard' ? pathname === item.href : pathname?.startsWith(item.href)
    });
    if (foundItem) {
      currentPageTitle = foundItem.title;
      break;
    }
  }

  return (
    <SidebarProvider> {/* Wrap the layout content */}
      <div className="flex min-h-screen w-full bg-muted/40">
        <DashboardSidebar />
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            {/* Default Sidebar Trigger */}
            <SidebarTrigger /> {/* Added md:hidden like before */}
            {/* You can add other header elements here like breadcrumbs or user menu */}
            <h1 className="flex-1 text-xl font-semibold tracking-tight">
              {currentPageTitle} {/* Display dynamic title */}
            </h1>
          </header>
          <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children} {/* Page content renders here */}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 