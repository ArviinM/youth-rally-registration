'use client'; // Sidebar likely needs client-side interactivity

import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar, // Corrected import based on shadcn docs
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader // Optional header
} from "@/components/ui/sidebar"; // Make sure path is correct
import { Home, UserPlus, Users, KanbanSquare, BarChart, Settings, LogOut, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have this from shadcn setup
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/context/AuthContext'; // Use relative path
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components

// Menu items definition
export const menuItems = [
  {
    groupLabel: "Management",
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        icon: Home,
      },
      {
        title: "Register Participant",
        href: "/dashboard/register",
        icon: UserPlus,
      },
      {
        title: "Manage Participants",
        href: "/dashboard/participants",
        icon: FileSpreadsheet,
      },
      {
        title: "View Groups",
        href: "/dashboard/groups",
        icon: Users,
      }
    ],
  },
  // You could add more groups here if needed
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth(); // Get signOut function and user
  const router = useRouter(); // Get router for redirect after sign out

  const handleLogout = async () => {
    await signOut();
    router.refresh();
  };

  const isActive = (href: string) => {
    // Handle exact match for dashboard overview
    if (href === '/dashboard') {
      return pathname === href;
    }
    // Handle prefix match for other routes
    return pathname?.startsWith(href);
  };

  // Get user initials for Avatar fallback
  const getInitials = (email: string | undefined): string => {
    if (!email) return '??';
    // Simple split on common separators, take first letter of first two parts
    const nameParts = email.split(/[@._-]/);
    if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else if (nameParts[0].length >= 2) {
        return (nameParts[0][0] + nameParts[0][1]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  return (
    <Sidebar className="w-64 flex-shrink-0 border-r p-4 flex flex-col">
      <SidebarHeader>
        <h2 className="text-xl font-bold tracking-tight text-primary">Family Camp Admin</h2>
      </SidebarHeader>
      <SidebarContent className="flex-grow">
        {menuItems.map((group) => (
          <SidebarGroup key={group.groupLabel}>
            {group.groupLabel && (
              <SidebarGroupLabel className="text-xs uppercase text-muted-foreground tracking-wider px-2">
                {group.groupLabel}
              </SidebarGroupLabel>
            )}
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "justify-start",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <div className="mt-auto pt-4 border-t space-y-2">
        {/* User Info with Avatar */}
        {user && (
            <div className="flex items-center space-x-2 px-2 py-2 rounded-md hover:bg-muted cursor-default">
                <Avatar className="h-8 w-8">
                    {/* Add AvatarImage if you store user avatar URLs later */}
                    {/* <AvatarImage src={user.user_metadata?.avatar_url || undefined} alt={user.email} /> */}
                    <AvatarFallback>{getInitials(user.user_metadata?.full_name || user.email)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground truncate" title={user.email}>
                    {user.email}
                </span>
            </div>
        )}
        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </Sidebar>
  );
}
