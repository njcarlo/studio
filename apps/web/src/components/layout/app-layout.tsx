"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import {
  LoaderCircle,
  Info,
  X,
  LayoutDashboard,
  Users,
  Calendar as CalendarIcon,
  Menu,
} from "lucide-react";
import Image from "next/image";
import { useUser } from "@studio/database";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@studio/ui";
import { useSidebar } from "@studio/ui";

const MobileSidebarTrigger = () => {
  const { setOpenMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      className="flex-1 h-full flex flex-col justify-center items-center gap-1 rounded-none text-muted-foreground hover:text-foreground"
      onClick={() => setOpenMobile(true)}
    >
      <Menu className="h-5 w-5" />
      <span className="text-[10px] font-medium leading-none">More</span>
    </Button>
  );
};

const ImpersonationBanner = () => {
  const { impersonatedWorkerId, stopImpersonation } = useImpersonation();
  const { workerProfile } = useUserRole(); // This will be the impersonated profile

  if (!impersonatedWorkerId) {
    return null;
  }

  return (
    <div className="bg-yellow-400 text-yellow-900 p-2 text-center text-sm font-semibold flex items-center justify-center gap-4">
      <Info className="h-5 w-5" />
      <span>
        You are viewing as{" "}
        <strong>
          {workerProfile?.firstName} {workerProfile?.lastName}
        </strong>
        . All actions are still performed as an administrator.
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={stopImpersonation}
        className="hover:bg-yellow-500"
      >
        <X className="mr-2 h-4 w-4" />
        Exit View-As Mode
      </Button>
    </div>
  );
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const currentPathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // While auth is loading, show a full-screen loader
  if (isUserLoading) {
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
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Image
                src="/cog-logo.png"
                alt="COG Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg font-semibold font-headline">
                COG App
              </span>
            </div>
            <SidebarTrigger className="hidden md:flex" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <Nav pathname={currentPathname} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <ImpersonationBanner />
        <header className="flex h-14 md:h-[60px] items-center gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-40 pt-[env(safe-area-inset-top)] box-content">
          <div className="md:hidden flex items-center gap-2">
            <Image
              src="/cog-logo.png"
              alt="COG Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="text-sm font-semibold font-headline">COG App</span>
          </div>
          <div className="w-full flex-1" />
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex justify-around items-center z-50 pb-[env(safe-area-inset-bottom)] box-content">
        <Button
          variant="ghost"
          className="flex-1 h-full flex flex-col justify-center items-center gap-1 rounded-none data-[active=true]:text-primary"
          data-active={currentPathname === "/dashboard"}
          onClick={() => router.push("/dashboard")}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Home</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 h-full flex flex-col justify-center items-center gap-1 rounded-none data-[active=true]:text-primary"
          data-active={currentPathname.startsWith("/workers")}
          onClick={() => router.push("/workers")}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Workers</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 h-full flex flex-col justify-center items-center gap-1 rounded-none data-[active=true]:text-primary"
          data-active={currentPathname.startsWith("/reservations")}
          onClick={() => router.push("/reservations/calendar")}
        >
          <CalendarIcon className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Rooms</span>
        </Button>

        {/* Connects with Sidebar to open the side menu */}
        <MobileSidebarTrigger />
      </div>
    </SidebarProvider>
  );
}
