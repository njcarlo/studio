"use client";

import React from "react";
import { writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { LoaderCircle, Shield, AlertTriangle } from "lucide-react";
import { allPermissions } from "@/lib/permissions";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/types";

export default function SettingsPage() {
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Check if the admin role exists to determine if seeding is needed.
    const adminRoleRef = useMemoFirebase(() => doc(firestore, 'roles', 'admin'), [firestore]);
    const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<Role>(adminRoleRef);

    const initializeSystem = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to initialize the system." });
            return;
        }

        try {
            const batch = writeBatch(firestore);
            
            // Define roles with the correct map structure for privileges
            const rolesData = {
                admin: { name: 'Admin', privileges: allPermissions.reduce((acc, p) => ({ ...acc, [p]: true }), {}) },
                editor: { name: 'Editor', privileges: { 'manage_content': true } },
                viewer: { name: 'Viewer', privileges: {} }
            };

            for (const [roleId, roleData] of Object.entries(rolesData)) {
                batch.set(doc(firestore, 'roles', roleId), roleData);
            }
            
            // Set the current user as the admin
            batch.set(doc(firestore, 'users', user.uid), {
                roleId: 'admin',
                status: 'Active',
            }, { merge: true });

            await batch.commit();
            toast({ title: "System Initialized", description: "You are now an administrator. Please refresh the page for changes to take effect." });
        } catch (dbError: any) {
            console.error("Database Seed Failed:", dbError);
            toast({ variant: "destructive", title: "Database Seed Failed", description: "Could not seed the database. Check console for details." });
        }
    };

    const isLoading = isRoleLoading || isAdminRoleLoading || isUserLoading;

    // A user can access this page if they are already an admin,
    // OR if the admin role doesn't exist yet (which implies the system needs seeding).
    const needsSeeding = !adminRole && !isAdminRoleLoading;
    const canAccess = isSuperAdmin || needsSeeding;

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!user) {
         return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Not Logged In</CardTitle>
                        <CardDescription>You must be logged in to access this page.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }
    
    if (!canAccess) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">System Settings</h1>
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
                            <Button onClick={initializeSystem} variant="default">
                                Initialize System
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield /> System Seed</CardTitle>
                        <CardDescription>
                            This will create (or reset) the default user roles ('Admin', 'Editor', 'Viewer'). It will also ensure the currently logged-in user has the 'Admin' role. This can be used to recover admin access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={initializeSystem}>
                            Initialize / Reset System
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
