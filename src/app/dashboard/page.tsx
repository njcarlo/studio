"use client";

import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { useUserRole } from "@/hooks/use-user-role";
import { LoaderCircle } from "lucide-react";
import { ViewerDashboard } from "@/components/dashboard/viewer-dashboard";

export default function DashboardPage() {
    const { workerProfile, isLoading } = useUserRole();

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-headline font-bold tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">Welcome back, {workerProfile?.firstName || 'User'}!</p>
                    </div>
                </div>

                {/* Everyone gets the core user dashboard widgets (QR code, bookings) */}
                <ViewerDashboard />
            </div>
        </AppLayout>
    );
}
