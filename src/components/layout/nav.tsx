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

const allNavItems: { href: string; icon: React.ElementType; label: string; adminOnly?: boolean }[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/workers", icon: Users, label: "Users" },
  { href: "/ministries", icon: BookOpen, label: "Ministries" },
  { href: "/rooms", icon: Calendar, label: "Room Reservations" },
  { href: "/attendance", icon: ScanLine, label: "Attendance" },
  { href: "/meals", icon: Utensils, label: "Meal Stubs" },
  { href: "/approvals", icon: Vote, label: "Approvals" },
  { href: "/settings", icon: Cog, label: "Settings", adminOnly: true },
];

export function Nav({
  pathname,
  className,
}: {
  pathname: string;
  className?: string;
}) {
  const { isSuperAdmin } = useUserRole();

  const navItems = allNavItems.filter(item => {
    if (item.adminOnly) return isSuperAdmin;
    return true;
  });


  return (
    <nav className={cn("flex flex-col", className)}>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
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
