import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  UtensilsCrossed,
  QrCode,
  HeartHandshake,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { WorkerRole } from "@/lib/types";

const allRoles: WorkerRole[] = ['Volunteer', 'Clergy', 'Admin', 'Full-time', 'On-call', 'Ministry Head', 'Super Admin'];

const navItems: { href: string; icon: React.ElementType; label: string; roles: WorkerRole[] }[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: allRoles },
  { href: "/workers", icon: Users, label: "Worker Profiles", roles: ['Admin', 'Ministry Head', 'Super Admin'] },
  { href: "/ministries", icon: HeartHandshake, label: "Ministries", roles: ['Admin', 'Ministry Head', 'Super Admin'] },
  { href: "/approvals", icon: CheckSquare, label: "Approvals", roles: ['Admin', 'Ministry Head', 'Super Admin'] },
  { href: "/rooms", icon: Calendar, label: "Room Reservations", roles: allRoles },
  { href: "/meals", icon: UtensilsCrossed, label: "Mealstubs", roles: ['Admin', 'Super Admin'] },
  { href: "/attendance", icon: QrCode, label: "Attendance", roles: ['Admin', 'Super Admin'] },
];

export function Nav({
  pathname,
  className,
  userRole,
}: {
  pathname: string;
  className?: string;
  userRole: WorkerRole;
}) {
  const accessibleNavItems = navItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <nav className={cn("flex flex-col", className)}>
      <SidebarMenu>
        {accessibleNavItems.map((item) => (
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
