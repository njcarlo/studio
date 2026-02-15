"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Cog,
  Users,
  Calendar,
  ScanLine,
  Utensils,
  BookOpen,
  Vote,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";

type NavItem = { href: string; icon: React.ElementType; label: string; adminOnly?: boolean, privilege?: boolean };

const allNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/workers", icon: Users, label: "Workers" },
  { href: "/ministries", icon: BookOpen, label: "Ministries" },
  { href: "/rooms", icon: Calendar, label: "Room Reservations" },
  { href: "/attendance", icon: ScanLine, label: "Attendance" },
  { href: "/meals", icon: Utensils, label: "Meal Stubs" },
  { href: "/approvals", icon: Vote, label: "Approvals", privilege: true },
  { href: "/settings", icon: Cog, label: "Settings", adminOnly: true },
];

export function Nav({
  pathname,
  className,
}: {
  pathname: string;
  className?: string;
}) {
  const { isSuperAdmin, isLoading, needsSeeding, workerProfile } = useUserRole();

  const navItems = allNavItems.filter(item => {
    if (isLoading) return false;
    if (item.privilege) {
        return isSuperAdmin;
    }
    if (item.adminOnly) {
        // Show if super admin, or if the system needs initial setup, or if the current user has no role defined.
        // This prevents a user from being locked out if seeding fails to assign them the admin role.
        const hasNoRole = workerProfile && !workerProfile.roleId;
        return isSuperAdmin || needsSeeding || hasNoRole;
    }
    return true;
  });


  return (
    <nav className={cn("flex flex-col", className)}>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={{ children: item.label }}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
