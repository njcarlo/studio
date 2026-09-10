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
  Package,
  ExternalLink,
  QrCode,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
  anyPermissionKeys?: Array<keyof Omit<
    UserRoleContextType,
    "needsSeeding" | "isLoading" | "allRoles" | "workerProfile"
  >>;
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
  { href: "/workers/my-qr", icon: QrCode, label: "My QR Code" },
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
        label: "Schedule Calendar",
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
        anyPermissionKeys: [
          "isMealStubAssigner",
          "canManageAllMealStubs",
          "isMinistryHead",
        ],
      },
      {
        href: "/meals?tab=reports",
        label: "Reports",
        anyPermissionKeys: [
          "isMealStubAssigner",
          "canManageAllMealStubs",
          "isMinistryHead",
          "canViewReports",
        ],
      },
    ],
  },
  {
    href: "/c2s",
    icon: HeartHandshake,
    label: "Connect 2 Souls",
    permissionKey: "canManageC2S",
    subItems: [
      {
        href: "/c2s?tab=overview",
        label: "Overview",
        permissionKey: "isSuperAdmin",
      },
      { href: "/c2s?tab=devotions", label: "Devotions" },
      { href: "/c2s?tab=mentees", label: "Mentees" },
      { href: "/c2s?tab=analytics", label: "Analytics" },
    ],
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
    permissionKey: "canManageWorkers",
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
    subItems: [
      { href: "/attendance?tab=personal", label: "Personal Log" },
      {
        href: "/attendance?tab=manual",
        label: "Manual Attendance",
        anyPermissionKeys: ["isMinistryHead", "canManageWorkers", "canOperateScanner"],
      },
      {
        href: "/attendance?tab=records",
        label: "Attendance Records",
        anyPermissionKeys: ["isMinistryHead", "canManageWorkers", "canOperateScanner"],
      },
    ],
  },
  {
    href: "/reports",
    icon: BarChart3,
    label: "Reports",
    permissionKey: "canViewReports",
    subItems: [
      { href: "/reports?tab=attendance",   label: "Attendance" },
      { href: "/reports?tab=meal-stubs",   label: "Meal Stub Claims" },
      { href: "/reports?tab=allocations",  label: "Allocations" },
      { href: "/reports?tab=reservations", label: "Reservations" },
    ],
  },
  {
    href: "/inventory",
    icon: Package,
    label: "Inventory",
    permissionKey: "canAccessInventory",
    subItems: [
      { href: "/inventory?tab=items", label: "Items & Catalog" },
      { href: "/inventory?tab=borrowings", label: "Borrowings" },
      { href: "/inventory?tab=logs", label: "Stock Logs" },
      { href: "/inventory?tab=categories", label: "Categories" },
      { href: "/inventory?tab=reports", label: "Reports & Analytics" },
      { href: "/inventory?tab=settings", label: "Settings & Checklists" },
    ],
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
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
  const { isLoading, needsSeeding, workerProfile, isSuperAdmin, isMinistryHead } = userRole;
  const searchParams = useSearchParams();

  // Build the full current URL (path + query) for accurate active matching
  const currentUrl = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  /** Check if a given href is the active route */
  const isActiveHref = (href: string) => {
    if (href.includes("?")) {
      if (href === "/inventory?tab=items" && pathname === "/inventory" && !searchParams.get("tab")) {
        return true;
      }
      if (href === "/c2s?tab=devotions" && pathname === "/c2s" && !searchParams.get("tab")) {
        return true;
      }
      return currentUrl === href;
    }
    return pathname === href;
  };

  const hasAccess = (
    key:
      | keyof Omit<
          UserRoleContextType,
          "needsSeeding" | "isLoading" | "allRoles" | "workerProfile"
        >
      | undefined,
    anyKeys?: Array<keyof Omit<
      UserRoleContextType,
      "needsSeeding" | "isLoading" | "allRoles" | "workerProfile"
    >>,
  ) => {
    if (isSuperAdmin) return true; // super admin sees everything
    if (anyKeys && anyKeys.length > 0) {
      return anyKeys.some((k) => userRole[k] === true);
    }
    if (!key) return true; // No permission required
    return userRole[key] === true;
  };

  const navItems = allNavItems.filter((item) => {
    if (isLoading) return false;
    if (isSuperAdmin) return true; // super admin sees all nav items

    // Settings: show only if user has access to at least one sub-item
    if (item.href === "/settings") {
      if (needsSeeding) return true; // Only show for seeding, not for missing role
      // Hide Settings for ministry heads (not super admin)
      if (isMinistryHead && !isSuperAdmin) return false;
      if (item.subItems && item.subItems.length > 0) {
        return item.subItems.some((sub) => hasAccess(sub.permissionKey, sub.anyPermissionKeys));
      }
      return false;
    }

    // Workers: show if user can manage workers
    if (item.href === "/workers") {
      return hasAccess("canManageWorkers");
    }

    return hasAccess(item.permissionKey);
  });

  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <nav className={cn("flex flex-col", className)}>
      <SidebarGroup>
        <SidebarGroupLabel className="uppercase tracking-wider text-[10px] font-semibold text-muted-foreground/60 px-3 mb-1">
          Menu
        </SidebarGroupLabel>
        <SidebarGroupContent>
      <SidebarMenu>
        {navItems.map((item) => {
          const visibleSubItems =
            item.subItems?.filter((sub) => hasAccess(sub.permissionKey, sub.anyPermissionKeys)) || [];

          // No sub-items: simple link
          if (!item.subItems || visibleSubItems.length === 0) {
            const isExternal = item.href.startsWith('http');
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={!isExternal && isActiveHref(item.href)}
                  tooltip={{ children: item.label }}
                >
                  {isExternal ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={handleNavClick}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                      <ExternalLink className="size-3 ml-auto opacity-50" />
                    </a>
                  ) : (
                    <Link href={item.href} onClick={handleNavClick}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Has sub-items and sidebar is collapsed: use DropdownMenu
          if (isCollapsed) {
            return (
              <SidebarMenuItem key={item.href}>
                <DropdownMenu modal={false}>
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
                          <Link href={item.href} onClick={handleNavClick}>General</Link>
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
                                    <Link href={nested.href} onClick={handleNavClick}>
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
                          <Link href={subItem.href} onClick={handleNavClick}>{subItem.label}</Link>
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
                            <Link href={item.href} onClick={handleNavClick}>
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
                                        <Link href={nested.href} onClick={handleNavClick}>
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
                            <Link href={subItem.href} onClick={handleNavClick}>
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
        </SidebarGroupContent>
      </SidebarGroup>
    </nav>
  );
}
