"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
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
import { Church, LoaderCircle } from "lucide-react";
import { useUser } from "@/firebase";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const currentPathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();


  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
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
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Church className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold font-headline">COGApp</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <Nav pathname={currentPathname} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1" />
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
