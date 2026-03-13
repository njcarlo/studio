"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  UtensilsCrossed,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@studio/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@studio/ui";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@studio/ui";
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
      { href: "/reservations/my", label: "My Reservations" },
      { href: "/reservations/new", label: "Reserve a Room" },
      {
        href: "/reservations/all",
        label: "All Reservations",
        permissionKey: "canApproveRoomReservation",
      },
    ],
  },
  {
    href: "/meals",
    icon: UtensilsCrossed,
    label: "Meal Stubs",
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
  {
    href: "/c2s",
    icon: HeartHandshake,
    label: "Connect 2 Souls",
    permissionKey: "canManageC2S",
  },
  {
    href: "/approvals",
    icon: ClipboardCheck,
    label: "Approvals",
    permissionKey: "canManageApprovals",
  },
  {
    href: "/workers",
    icon: Users,
    label: "Workers",
    subItems: [
      {
        href: "/workers",
        label: "Worker Management",
        permissionKey: "canManageWorkers",
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
        href: "/settings/venue-elements",
        label: "Venue Elements",
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
  const searchParams = useSearchParams();

  // Build the full current URL (path + query) for accurate active matching
  const currentUrl = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  /** Check if a given href is the active route */
  const isActiveHref = (href: string) => {
    if (href.includes("?")) {
      // For hrefs with query params, compare the full URL
      return currentUrl === href;
    }
    // For plain paths, compare pathname only
    return pathname === href;
  };

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

  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  return (
    <nav className={cn("flex flex-col", className)}>
      <SidebarMenu>
        {navItems.map((item) => {
          const visibleSubItems =
            item.subItems?.filter((sub) => hasAccess(sub.permissionKey)) || [];

          // No sub-items: simple link
          if (!item.subItems || visibleSubItems.length === 0) {
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveHref(item.href)}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Has sub-items and sidebar is collapsed: use DropdownMenu
          if (isCollapsed) {
            return (
              <SidebarMenuItem key={item.href}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="min-w-[200px]"
                  >
                    {/* Special case for Settings */}
                    {item.href === "/settings" &&
                      (hasAccess("canManageRoles") ||
                        hasAccess("canManageMinistries") ||
                        hasAccess("canManageFacilities")) && (
                        <DropdownMenuItem asChild>
                          <Link href={item.href}>General</Link>
                        </DropdownMenuItem>
                      )}

                    {visibleSubItems.map((subItem) => {
                      const visibleNestedItems =
                        subItem.subItems?.filter((nested) =>
                          hasAccess(nested.permissionKey),
                        ) || [];

                      if (visibleNestedItems.length > 0) {
                        return (
                          <DropdownMenuSub key={subItem.label}>
                            <DropdownMenuSubTrigger>
                              {subItem.label}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                {visibleNestedItems.map((nested) => (
                                  <DropdownMenuItem key={nested.href} asChild>
                                    <Link href={nested.href}>
                                      {nested.label}
                                    </Link>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        );
                      }

                      return (
                        <DropdownMenuItem
                          key={subItem.href + subItem.label}
                          asChild
                        >
                          <Link href={subItem.href}>{subItem.label}</Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }

          // Has sub-items and sidebar is expanded: use Collapsible
          return (
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
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {/* Special case for Settings: show 'General' link if top-level is clicked */}
                    {item.href === "/settings" &&
                      (hasAccess("canManageRoles") ||
                        hasAccess("canManageMinistries") ||
                        hasAccess("canManageFacilities")) && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActiveHref(item.href)}
                          >
                            <Link href={item.href}>
                              <span>General</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
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
                              pathname.startsWith(subItem.href.split("?")[0]) ||
                              visibleNestedItems.some((n) =>
                                isActiveHref(n.href),
                              )
                            }
                          >
                            <SidebarMenuSubItem className="flex flex-col">
                              <CollapsibleTrigger asChild>
                                <SidebarMenuSubButton className="justify-between w-full">
                                  <span>{subItem.label}</span>
                                  <ChevronRight className="size-3 shrink-0 transition-transform duration-200 data-[state=open]:rotate-90" />
                                </SidebarMenuSubButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub>
                                  {visibleNestedItems.map((nested) => (
                                    <SidebarMenuSubItem key={nested.href}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={isActiveHref(nested.href)}
                                      >
                                        <Link href={nested.href}>
                                          <span>{nested.label}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuSubItem>
                          </Collapsible>
                        );
                      }

                      return (
                        <SidebarMenuSubItem key={subItem.href + subItem.label}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActiveHref(subItem.href)}
                          >
                            <Link href={subItem.href}>
                              <span>{subItem.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
