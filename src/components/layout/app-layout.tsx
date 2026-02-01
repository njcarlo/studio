"use client";

import React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Nav } from "@/components/layout/nav";
import { UserNav } from "@/components/layout/user-nav";
import { Church } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  // We can't use `useSelectedLayoutSegment` here because it's a client component,
  // and this would break if we ever tried to use it in a server component.
  // Instead, we can get the path from the window object.
  const [pathname, setPathname] = React.useState("");
  React.useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Church className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold font-headline">COGApp</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <Nav pathname={pathname} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            {/* Can add breadcrumbs or page title here */}
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
