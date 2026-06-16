"use client";

import React from "react";
import { useUserRole } from "@/hooks/use-user-role";
import { ApprovalsWidget } from "@/components/dashboard/approvals-widget";
import { MinistryDashboard } from "@/components/dashboard/ministry-dashboard";
import { ViewerDashboard } from "@/components/dashboard/viewer-dashboard";

interface Props {
  /** Pre-rendered by the Server Component — shown immediately with no flash. */
  firstName: string;
  /** Server-derived super-admin flag used while Zustand is still hydrating. */
  serverIsSuperAdmin: boolean;
}

export function DashboardClient({ firstName, serverIsSuperAdmin }: Props) {
  const {
    isLoading,
    isSuperAdmin,
    canManageApprovals,
    isMinistryHead,
    isMinistryApprover,
  } = useUserRole();

  // While Zustand is still hydrating we use the server-derived value so the
  // page never flickers from "no widgets" → "widgets".
  const effectiveSuperAdmin = isLoading ? serverIsSuperAdmin : isSuperAdmin;
  const showMinistryDashboard =
    !effectiveSuperAdmin && (isMinistryHead || isMinistryApprover);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground mb-1 uppercase tracking-wider text-xs font-semibold">
            Dashboard
          </p>
          {/* Greeting is server-rendered HTML — visible before any JS executes. */}
          <h1 className="text-3xl font-headline font-bold tracking-tight">
            Welcome back, {firstName}!
          </h1>
        </div>
      </div>

      {effectiveSuperAdmin && canManageApprovals && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <ApprovalsWidget />
        </div>
      )}

      {showMinistryDashboard && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <MinistryDashboard />
        </div>
      )}

      <ViewerDashboard />
    </div>
  );
}
