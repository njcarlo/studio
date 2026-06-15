"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { HeartHandshake } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import MyGroupTab from "../MyGroupTab";

export default function MyGroupPage() {
  const { isMentor, isSuperAdmin, isLoading } = useUserRole();

  if (!isLoading && !isMentor && !isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <HeartHandshake className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-center max-w-md">
            You don't have permission to access this page. Contact an
            administrator to request access.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">
            My Group
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your Connect 2 Souls group, mentees, and sessions.
          </p>
        </div>
        <MyGroupTab />
      </div>
    </AppLayout>
  );
}
