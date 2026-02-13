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
import type { Permission } from "@/lib/permissions";

const allNavItems: { href: string; icon: React.ElementType; label: string; adminOnly?: boolean, privilege?: Permission }[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/workers", icon: Users, label: "Workers" },
  { href: "/ministries", icon: BookOpen, label: "Ministries" },
  { href: "/rooms", icon: Calendar, label: "Room Reservations" },
  { href: "/attendance", icon: ScanLine, label: "Attendance" },
  { href: "/meals", icon: Utensils, label: "Meal Stubs" },
  { href: "/approvals", icon: Vote, label: "Approvals", privilege: 'manage_approvals' },
  { href: "/settings", icon: Cog, label: "Settings", adminOnly: true },
];

export function Nav({
  pathname,
  className,
}: {
  pathname: string;
  className?: string;
}) {
  const { isSuperAdmin, realUserRole, isLoading, needsSeeding } = useUserRole();

  const navItems = allNavItems.filter(item => {
    if (isLoading) return false;
    if (item.privilege) {
        return isSuperAdmin || !!realUserRole?.privileges?.[item.privilege];
    }
    if (item.adminOnly) {
        // Show if super admin OR if the system needs initial setup
        return isSuperAdmin || needsSeeding;
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
