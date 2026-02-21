"use client";

import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { useUser } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { LoaderCircle } from "lucide-react";
import { ViewerDashboard } from "@/components/dashboard/viewer-dashboard";
import { ApprovalsWidget } from "@/components/dashboard/approvals-widget";

export default function DashboardPage() {
    const { user } = useUser();
    const { workerProfile, isLoading, canManageApprovals } = useUserRole();

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    const userName = workerProfile?.firstName || user?.displayName || user?.email?.split('@')[0] || 'User';

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

                {canManageApprovals && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <ApprovalsWidget />
                    </div>
                )}

                {/* Everyone gets the core user dashboard widgets (QR code, bookings) */}
                <ViewerDashboard />
            </div>
        </AppLayout>
    );
}
