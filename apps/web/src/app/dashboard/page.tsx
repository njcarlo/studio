"use client";

import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@studio/ui";
import { useUser } from "@studio/database";
import { useUserRole } from "@/hooks/use-user-role";
import { LoaderCircle } from "lucide-react";
import { ViewerDashboard } from "@/components/dashboard/viewer-dashboard";
import { ApprovalsWidget } from "@/components/dashboard/approvals-widget";
import { MinistryDashboard } from "@/components/dashboard/ministry-dashboard";

export default function DashboardPage() {
    const { user } = useUser();
    const { workerProfile, isLoading, canManageApprovals, isMinistryHead, isMinistryApprover, isSuperAdmin } = useUserRole();

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    const userName = workerProfile?.firstName || user?.displayName || user?.email?.split('@')[0] || 'User';

    const showMinistryDashboard = (isMinistryHead || isMinistryApprover) && !isSuperAdmin;

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-muted-foreground mb-1 uppercase tracking-wider text-xs font-semibold">Dashboard</p>
                        <h1 className="text-3xl font-headline font-bold tracking-tight">
                            Welcome back, {userName}!
                        </h1>
                    </div>
                </div>

                {isSuperAdmin && canManageApprovals && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <ApprovalsWidget />
                    </div>
                )}

                {showMinistryDashboard && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <MinistryDashboard />
                    </div>
                )}

                {/* Everyone gets the core user dashboard widgets (QR code, bookings) */}
                <ViewerDashboard />
            </div>
        </AppLayout>
    );
}
