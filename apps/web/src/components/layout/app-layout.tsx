"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from "@studio/ui";
import { Nav } from "@/components/layout/nav";
import { UserNav } from "@/components/layout/user-nav";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import {
  LoaderCircle,
  Info,
  X,
  LayoutDashboard,
  Users,
  Calendar as CalendarIcon,
  Menu,
  QrCode,
  Package,
  HeartHandshake,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@studio/store";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@studio/ui";
import { useSidebar } from "@studio/ui";

const MobileSidebarTrigger = () => {
  const { setOpenMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      className="flex-1 h-full flex flex-col justify-center items-center gap-1 rounded-none text-muted-foreground hover:text-foreground active:scale-95 transition-all"
      onClick={() => setOpenMobile(true)}
    >
      <Menu className="h-5 w-5" />
      <span className="text-[10px] font-medium leading-none">More</span>
    </Button>
  );
};

const HeaderMobileTrigger = () => {
  const { setOpenMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 -ml-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all md:hidden shrink-0"
      onClick={() => setOpenMobile(true)}
      aria-label="Open Navigation Menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
};

import { useMinistries } from "@/hooks/use-ministries";

const ImpersonationBanner = () => {
  const { impersonatedWorkerId, stopImpersonation } = useImpersonation();
  const { workerProfile, allRoles, isMinistryHead } = useUserRole();
  const { allMinistries } = useMinistries();

  if (!impersonatedWorkerId) {
    return null;
  }

  const userMinistry = allMinistries?.find(
    (m: any) =>
      m.id === workerProfile?.majorMinistryId ||
      m.headId === workerProfile?.id ||
      m.approverId === workerProfile?.id
  );
  const headDept = userMinistry?.department || "Outreach";

  const rawRole = (allRoles?.find((r: any) => r.id === workerProfile?.roleId)?.name || "").toLowerCase();
  const isHead = isMinistryHead || rawRole.includes("head") || Boolean(allMinistries && workerProfile?.id && allMinistries.some((m: any) => m.headId === workerProfile.id));

  let indicatorLabel = "";
  if (isHead) {
    indicatorLabel = `Ministry Head • ${headDept} Department`;
  } else {
    const clusterLabel = userMinistry?.name || (workerProfile as any)?.department || "Outreach";
    indicatorLabel = `Mentor • ${clusterLabel}`;
  }

  return (
    <div className="bg-amber-400 text-amber-950 p-2 text-center text-sm font-semibold flex items-center justify-center gap-3 flex-wrap shadow-sm">
      <Info className="h-4 w-4" />
      <span>
        You are viewing as{" "}
        <strong>
          {workerProfile?.firstName} {workerProfile?.lastName}
        </strong>{" "}
        <span className="bg-amber-100 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-full text-xs font-bold shadow-xs">
          {indicatorLabel}
        </span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={stopImpersonation}
        className="hover:bg-amber-500/80 text-xs h-7 px-2 font-bold"
      >
        <X className="mr-1.5 h-3.5 w-3.5" />
        Exit View-As Mode
      </Button>
    </div>
  );
};


function ScrollReset({
  mainRef,
  currentPathname,
}: {
  mainRef: React.RefObject<HTMLElement | null>;
  currentPathname: string;
}) {
  const searchParams = useSearchParams();

  // Always reset scroll to the top of the page when pathname or searchParams (tabs) change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentPathname, searchParams?.toString(), mainRef]);

  return null;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const currentPathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useAuthStore();
  const { isSuperAdmin, isMinistryHead } = useUserRole();
  const mainRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // Listen for tab switch events or clicks on tab elements
  useEffect(() => {
    const handleScrollTop = () => {
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: "instant" });
      }
    };

    window.addEventListener("app:scroll-to-top", handleScrollTop);

    const handleTabClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Never scroll when clicking inside or on any dropdown, select, popover, combobox, or menu
      if (
        target.closest('[role="combobox"]') ||
        target.closest('[role="listbox"]') ||
        target.closest('[role="option"]') ||
        target.closest('[role="menu"]') ||
        target.closest('[role="menuitem"]') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[data-radix-select-viewport]') ||
        target.closest('[data-radix-select-trigger]') ||
        target.closest('button[aria-haspopup]')
      ) {
        return;
      }

      // Only scroll to top if clicking an actual tab switch button in a tab list
      const isActualTab =
        target.closest('[role="tab"]') ||
        target.closest('.tab-trigger') ||
        target.closest('button[data-tab]') ||
        target.closest('a[href*="tab="]') ||
        target.closest('button[aria-selected]') ||
        target.closest('[data-state="active"]');

      if (isActualTab) {
        setTimeout(() => {
          if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: "instant" });
          }
        }, 15);
      }
    };

    window.addEventListener("click", handleTabClick, true);

    return () => {
      window.removeEventListener("app:scroll-to-top", handleScrollTop);
      window.removeEventListener("click", handleTabClick, true);
    };
  }, []);

  // Mobile Bottom Navigation Tabs by Role
  const mobileNavTabs = useMemo(() => {
    // 1. Admin Account:
    // Stock Monitoring and C2S placed below existing items
    if (isSuperAdmin) {
      return [
        {
          id: "home",
          label: "Home",
          icon: LayoutDashboard,
          href: "/dashboard",
          isActive: currentPathname === "/dashboard" || currentPathname === "/",
        },
        {
          id: "my-qr",
          label: "My QR",
          icon: QrCode,
          href: "/workers/my-qr",
          isActive: currentPathname.startsWith("/workers/my-qr"),
        },
        {
          id: "rooms",
          label: "Rooms",
          icon: CalendarIcon,
          href: "/reservations/all",
          isActive: currentPathname.startsWith("/reservations"),
        },
        {
          id: "stock",
          label: "Stock Monitoring",
          icon: Package,
          href: "/inventory",
          isActive: currentPathname.startsWith("/inventory"),
        },
        {
          id: "c2s",
          label: "C2S",
          icon: HeartHandshake,
          href: "/c2s",
          isActive: currentPathname.startsWith("/c2s"),
        },
      ];
    }

    // 2. Ministry Head Account:
    // Add Attendance (linking to Attendance record) and C2S tab to mobile navigation
    if (isMinistryHead) {
      return [
        {
          id: "home",
          label: "Home",
          icon: LayoutDashboard,
          href: "/dashboard",
          isActive: currentPathname === "/dashboard" || currentPathname === "/",
        },
        {
          id: "my-qr",
          label: "My QR",
          icon: QrCode,
          href: "/workers/my-qr",
          isActive: currentPathname.startsWith("/workers/my-qr"),
        },
        {
          id: "attendance",
          label: "Attendance",
          icon: UserCheck,
          href: "/attendance?tab=records",
          isActive: currentPathname.startsWith("/attendance"),
        },
        {
          id: "rooms",
          label: "Rooms",
          icon: CalendarIcon,
          href: "/reservations/my",
          isActive: currentPathname.startsWith("/reservations"),
        },
        {
          id: "c2s",
          label: "C2S",
          icon: HeartHandshake,
          href: "/c2s",
          isActive: currentPathname.startsWith("/c2s"),
        },
      ];
    }

    // 3. Worker Account:
    // Home, My QR, Rooms, C2S (matching MH)
    return [
      {
        id: "home",
        label: "Home",
        icon: LayoutDashboard,
        href: "/dashboard",
        isActive: currentPathname === "/dashboard" || currentPathname === "/",
      },
      {
        id: "my-qr",
        label: "My QR",
        icon: QrCode,
        href: "/workers/my-qr",
        isActive: currentPathname.startsWith("/workers/my-qr"),
      },
      {
        id: "rooms",
        label: "Rooms",
        icon: CalendarIcon,
        href: "/reservations/my",
        isActive: currentPathname.startsWith("/reservations"),
      },
      {
        id: "c2s",
        label: "C2S",
        icon: HeartHandshake,
        href: "/c2s",
        isActive: currentPathname.startsWith("/c2s"),
      },
    ];
  }, [isSuperAdmin, isMinistryHead, currentPathname]);


  // While auth is loading, show a full-screen loader if there is no cached user yet
  if (isUserLoading && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If there's no user, we are in the process of redirecting, so don't render the layout
  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <ScrollReset mainRef={mainRef} currentPathname={currentPathname} />
      </Suspense>
      <Sidebar collapsible="icon" className="border-r-0 border-none">
        <SidebarHeader className="pb-1.5 px-3 pt-2.5 sticky top-0 z-10 bg-sidebar">
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:hidden">
              <Image
                src="/church-logo.png"
                alt="COG Logo"
                width={50}
                height={50}
                className="w-12 h-12 object-contain shrink-0"
                priority
              />
              <span
                className="font-extrabold font-headline tracking-tight text-white translate-y-0.5 leading-none brand-title"
                style={{ fontSize: "28px" }}
              >
                COG APP
              </span>
            </div>
            <SidebarTrigger className="flex text-white/80 hover:text-white hover:bg-white/10" />
          </div>
          <div className="h-[1px] bg-white/15 mx-1.5 mt-2.5 mb-1 group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <SidebarContent className="overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Suspense fallback={<div className="p-4" />}>
            <Nav pathname={currentPathname} />
          </Suspense>
        </SidebarContent>
      </Sidebar>
      {/* Fixed Header - mobile only. Desktop uses the sidebar header instead. */}
      <header className="md:hidden flex h-14 items-center gap-2.5 border-b border-border/50 bg-white/95 dark:bg-card/95 backdrop-blur-md px-3 fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] box-content shadow-2xs">
        <div className="flex items-center gap-2.5 shrink-0">
          <HeaderMobileTrigger />
          <div className="flex items-center gap-2">
            <Image
              src="/church-logo.png"
              alt="COG Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
              priority
            />
            <span
              className="font-extrabold font-headline tracking-tight brand-title"
              style={{ fontSize: "22px" }}
            >
              COG APP
            </span>
          </div>
        </div>
        <div className="w-full flex-1" />
        <ThemeToggle variant="compact" />
        <UserNav />
      </header>

      <SidebarInset className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0 min-w-0 max-w-full flex flex-col h-screen overflow-hidden">
        <ImpersonationBanner />
        {/* Desktop header bar (inside SidebarInset, sticky) */}
        <header className="hidden md:flex h-[52px] items-center gap-3 border-b border-border/50 bg-white/95 dark:bg-card/95 backdrop-blur-md px-4 lg:px-6 sticky top-0 z-40 shrink-0 shadow-2xs">
          <div className="w-full flex-1" />
          <ThemeToggle variant="compact" />
          <UserNav />
        </header>
        {/* Mobile spacer so content doesn't hide behind fixed header */}
        <div className="md:hidden h-14 shrink-0 pt-[env(safe-area-inset-top)] box-content" />
        <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col gap-4 p-3 sm:p-4 lg:gap-6 lg:p-6 min-w-0 max-w-full">
          {children}
        </main>
      </SidebarInset>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border/60 z-50 pb-[env(safe-area-inset-bottom)] box-content shadow-lg overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-full h-full items-center justify-around min-w-full">
          {mobileNavTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch={true}
                className={cn(
                  "flex-1 min-w-[56px] h-full flex flex-col justify-center items-center gap-1 px-1 rounded-none text-muted-foreground hover:text-foreground active:scale-95 transition-all select-none cursor-pointer",
                  tab.isActive ? "text-primary font-bold" : "hover:text-foreground"
                )}
                data-active={tab.isActive}
              >
                <Icon className={cn("h-5 w-5 shrink-0", tab.isActive && "text-primary")} />
                <span className="text-[10px] font-semibold leading-[1.15] text-center max-w-full px-0.5">
                  {tab.id === 'stock' ? (
                    <>
                      <span className="block leading-none">Stock</span>
                      <span className="block leading-none mt-0.5">Monitoring</span>
                    </>
                  ) : (
                    <span className="truncate block max-w-full leading-none">{tab.label}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </SidebarProvider>
  );
}
