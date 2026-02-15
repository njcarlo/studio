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
  ChevronRight,
  HeartHandshake,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";

type NavSubItem = {
    href: string;
    label: string;
}
type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
  privilege?: boolean;
  subItems?: NavSubItem[];
};

const allNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/workers", icon: Users, label: "Workers" },
  { href: "/rooms", icon: Calendar, label: "Room Reservations" },
  { href: "/attendance", icon: ScanLine, label: "Attendance" },
  { href: "/meals", icon: Utensils, label: "Meal Stubs" },
  { href: "/approvals", icon: Vote, label: "Approvals", privilege: true },
  { 
    href: "/settings", 
    icon: Cog, 
    label: "Settings", 
    adminOnly: true,
    subItems: [
        { href: "/settings/roles", label: "Role Management" },
        { href: "/settings/ministries", label: "Ministry Management" }
    ]
  },
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
          !item.subItems || item.subItems.length === 0 ? (
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
          ) : (
            <Collapsible key={item.href} asChild>
                  <SidebarMenuItem className="flex flex-col">
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={pathname.startsWith(item.href)} className="justify-between w-full">
                            <div className="flex items-center gap-2">
                                <item.icon />
                                <span>{item.label}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                        <SidebarMenu className="pl-6 pt-1 w-full">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild size="sm" isActive={pathname === item.href}>
                                    <Link href={item.href}>
                                        <span>General</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {item.subItems.map((subItem) => (
                                <SidebarMenuItem key={subItem.href}>
                                    <SidebarMenuButton
                                        asChild
                                        size="sm"
                                        isActive={pathname === subItem.href}
                                        >
                                        <Link href={subItem.href}>
                                            <span>{subItem.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
          )
        ))}
      </SidebarMenu>
    </nav>
  );
}
