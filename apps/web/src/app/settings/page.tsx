"use client";

import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@studio/ui";
import { LoaderCircle, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { claimSystemAdmin } from "@/actions/db";


export default function SettingsPage() {
    const {
        isLoading,
        needsSeeding,
        workerProfile,
        canManageRoles,
        canManageMinistries,
        canManageFacilities
    } = useUserRole();
    const { user } = useAuthStore();
    const { toast } = useToast();

    // System Initializer — seeds the default role set and promotes the current
    // user to Admin. Server-side, this only succeeds while no roles exist yet.
    const initializeSystem = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Not Logged In" });
            return;
        }
        const res = await claimSystemAdmin();
        if (!res.success) {
            toast({ variant: "destructive", title: "Database Seed Failed", description: res.error || "Could not seed the database." });
            return;
        }
        toast({ title: "System Initialized", description: "Default roles have been created. Please refresh." });
    };

    const canAccess = canManageRoles || canManageMinistries || canManageFacilities || needsSeeding || (workerProfile && !workerProfile.roleId);

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!user) {
        return <AppLayout><Card><CardHeader><CardTitle>Not Logged In</CardTitle><CardDescription>You must be logged in to access this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    if (!canAccess) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">General Settings</h1>
            </div>
            <p className="text-muted-foreground">Manage core application settings.</p>

            <div className="mt-4 space-y-6">
                {needsSeeding && (
                    <Card className="border-amber-500 bg-amber-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-700"><AlertTriangle /> Initial Setup Required</CardTitle>
                            <CardDescription>
                                Your application has not been initialized. Click the button below to create the default roles and make your account the master administrator.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={initializeSystem} variant="default">Initialize System</Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Meal Stub Allocation</CardTitle>
                        <CardDescription>
                            Configure weekly meal stub limits for each ministry.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" asChild>
                            <a href="/settings/meal-stubs">Manage Allocation</a>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>More Settings</CardTitle>
                        <CardDescription>
                            More general settings will be available here in the future.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </AppLayout>
    );
}
