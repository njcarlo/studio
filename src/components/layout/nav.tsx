"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  Users,
  CalendarDays,
  UserCheck,
  ClipboardCheck,
  ChevronRight,
  HeartHandshake,
  BarChart3,
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
import { useUserRole, type UserRoleContextType } from "@/hooks/use-user-role";

type NavSubItem = {
  href: string;
  label: string;
  permissionKey?: keyof Omit<
    UserRoleContextType,
    "needsSeeding" | "isLoading" | "allRoles" | "workerProfile"
  >;
  subItems?: NavSubItem[];
};

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  permissionKey?: keyof Omit<
    UserRoleContextType,
    "needsSeeding" | "isLoading" | "allRoles" | "workerProfile"
  >;
  subItems?: NavSubItem[];
};

const allNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    href: "/workers",
    icon: Users,
    label: "Workers",
    subItems: [
      { href: "/workers/my-qr", label: "My QR Code" },
      {
        href: "/workers",
        label: "View and Update Workers",
        permissionKey: "canManageWorkers",
      },
      {
        href: "/meals",
        label: "Meal Stub",
        permissionKey: "canViewMealStubs",
        subItems: [
          { href: "/meals?tab=view", label: "View Meal Stub" },
          {
            href: "/meals?tab=assign",
            label: "Assign Meal Stub",
            permissionKey: "isMealStubAssigner",
          },
        ],
      },
    ],
  },
  {
    href: "/reservations",
    icon: CalendarDays,
    label: "Room Reservations",
    subItems: [
      {
        href: "/reservations/masterview",
        label: "Schedule Masterview",
        permissionKey: "canViewScheduleMasterview",
      },
      {
        href: "/reservations/masterview/daily",
        label: "Daily View",
        permissionKey: "canViewScheduleMasterview",
      },
      { href: "/reservations/calendar", label: "View Schedules" },
      { href: "/reservations/my", label: "My reservations" },
      { href: "/reservations/new", label: "Reserve a room" },
      {
        href: "/reservations/all",
        label: "All Reservations",
        permissionKey: "canApproveRoomReservation",
      },
    ],
  },
  {
    href: "/attendance",
    icon: UserCheck,
    label: "Attendance",
    permissionKey: "canViewAttendance",
  },

  {
    href: "/approvals",
    icon: ClipboardCheck,
    label: "Approvals",
    permissionKey: "canManageApprovals",
  },
  {
    href: "/c2s",
    icon: HeartHandshake,
    label: "Connect 2 Souls",
    permissionKey: "canManageC2S",
  },
  {
    href: "/reports",
    icon: BarChart3,
    label: "Reports",
    permissionKey: "canViewReports",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    subItems: [
      {
        href: "/settings/roles",
        label: "Role Management",
        permissionKey: "canManageRoles",
      },
      {
        href: "/settings/departments",
        label: "Department Management",
        permissionKey: "canManageMinistries",
      },
      {
        href: "/settings/ministries",
        label: "Ministry Management",
        permissionKey: "canManageMinistries",
      },
      {
        href: "/settings/meal-stubs",
        label: "Meal Stub Allocation",
        permissionKey: "canManageMinistries",
      },
      {
        href: "/settings/rooms",
        label: "Facilities Management",
        permissionKey: "canManageFacilities",
      },
      {
        href: "/settings/transaction-logs",
        label: "Transaction Logs",
        permissionKey: "isSuperAdmin",
      },
    ],
  },
];

export function Nav({
  pathname,
  className,
}: {
  pathname: string;
  className?: string;
}) {
  const userRole = useUserRole();
  const { isLoading, needsSeeding, workerProfile } = userRole;

  const hasAccess = (
    key:
      | keyof Omit<
          UserRoleContextType,
          "needsSeeding" | "isLoading" | "allRoles" | "workerProfile"
        >
      | undefined,
  ) => {
    if (!key) return true; // No permission required
    return userRole[key] === true;
  };

  const navItems = allNavItems.filter((item) => {
    if (isLoading) return false;

    // For settings, show if user has access to any sub-item or the main settings page itself
    if (item.href === "/settings") {
      const hasNoRole = workerProfile && !workerProfile.roleId;
      if (needsSeeding || hasNoRole) return true;

      if (item.subItems && item.subItems.length > 0) {
        return item.subItems.some((sub) => hasAccess(sub.permissionKey));
      }
    }

    // For workers, show if user can see their own QR or manage others
    if (item.href === "/workers") return true;

    return hasAccess(item.permissionKey);
  });

  return (
    <nav className={cn("flex flex-col", className)}>
      <SidebarMenu>
        {navItems.map((item) => {
          const visibleSubItems =
            item.subItems?.filter((sub) => hasAccess(sub.permissionKey)) || [];

          return !item.subItems || visibleSubItems.length === 0 ? (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <Collapsible
              key={item.href}
              asChild
              defaultOpen={pathname.startsWith(item.href)}
            >
              <SidebarMenuItem className="flex flex-col">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    className="justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="size-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <SidebarMenu className="pl-6 pt-1 w-full">
                    {/* Special case for Settings: show 'General' link if top-level is clicked */}
                    {item.href === "/settings" &&
                      (hasAccess("canManageRoles") ||
                        hasAccess("canManageMinistries") ||
                        hasAccess("canManageFacilities")) && (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                          >
                            <Link href={item.href}>
                              <span>General</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}

                    {visibleSubItems.map((subItem) => {
                      const visibleNestedItems =
                        subItem.subItems?.filter((nested) =>
                          hasAccess(nested.permissionKey),
                        ) || [];

                      if (visibleNestedItems.length > 0) {
                        return (
                          <Collapsible
                            key={subItem.label}
                            asChild
                            defaultOpen={
                              pathname.startsWith(subItem.href) ||
                              visibleNestedItems.some(
                                (n) => pathname === n.href,
                              )
                            }
                          >
                            <SidebarMenuItem className="flex flex-col">
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="justify-between w-full">
                                  <span>{subItem.label}</span>
                                  <ChevronRight className="size-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-90" />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent asChild>
                                <SidebarMenu className="pl-4 pt-1 w-full border-l border-primary/10 ml-1">
                                  {visibleNestedItems.map((nested) => (
                                    <SidebarMenuItem key={nested.href}>
                                      <SidebarMenuButton
                                        asChild
                                        isActive={pathname === nested.href}
                                      >
                                        <Link href={nested.href}>
                                          <span>{nested.label}</span>
                                        </Link>
                                      </SidebarMenuButton>
                                    </SidebarMenuItem>
                                  ))}
                                </SidebarMenu>
                              </CollapsibleContent>
                            </SidebarMenuItem>
                          </Collapsible>
                        );
                      }

                      return (
                        <SidebarMenuItem key={subItem.href + subItem.label}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === subItem.href}
                          >
                            <Link href={subItem.href}>
                              <span>{subItem.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
