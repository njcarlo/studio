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
import { Church, Eye } from "lucide-react";
import type { WorkerRole } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserRole } from "@/hooks/use-user-role";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = React.useState("");
  const { viewAsRole, setViewAsRole, isSuperAdmin, allRoles } = useUserRole();

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
          <Nav pathname={pathname} userRole={viewAsRole} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1" />
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <Select value={viewAsRole} onValueChange={(role) => setViewAsRole(role as WorkerRole)}>
                    <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="View as Role" />
                    </SelectTrigger>
                    <SelectContent>
                        {allRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                                {role}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          )}
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
