import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  UtensilsCrossed,
  QrCode,
  Church,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/workers", icon: Users, label: "Worker Profiles" },
  { href: "/approvals", icon: CheckSquare, label: "Approvals" },
  { href: "/rooms", icon: Calendar, label: "Room Reservations" },
  { href: "/meals", icon: UtensilsCrossed, label: "Mealstubs" },
  { href: "/attendance", icon: QrCode, label: "Attendance" },
];

export function Nav({
  pathname,
  className,
}: {
  pathname: string;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col", className)}>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
