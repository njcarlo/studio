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
import { LoaderCircle, AlertTriangle } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";


export default function SettingsPage() {
    const { isSuperAdmin, isLoading, needsSeeding, workerProfile } = useUserRole();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // System Initializer
    const initializeSystem = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Not Logged In" });
            return;
        }
        try {
            const batch = writeBatch(firestore);
            
            // 1. Roles
            const rolesData = {
                admin: { name: 'Admin' },
                approver: { name: 'Approver' },
                editor: { name: 'Editor' },
                viewer: { name: 'Viewer' }
            };
            for (const [roleId, roleData] of Object.entries(rolesData)) {
                batch.set(doc(firestore, 'roles', roleId), roleData);
            }
            
            // Set current user as admin
            const adminWorkerData = {
                roleId: 'admin',
                status: 'Active',
                email: user.email,
                firstName: user.email?.split('@')[0] || 'Admin',
                lastName: 'User',
                avatarUrl: `https://picsum.photos/seed/${user.uid.slice(0, 5)}/100/100`,
                createdAt: serverTimestamp(),
            };
            batch.set(doc(firestore, 'workers', user.uid), adminWorkerData, { merge: true });

            await batch.commit();
            toast({ title: "System Initialized", description: "Default roles have been created. Please refresh." });
        } catch (dbError: any) {
            toast({ variant: "destructive", title: "Database Seed Failed", description: dbError.message || "Could not seed the database." });
            console.error(dbError);
        }
    };

    const canAccess = isSuperAdmin || needsSeeding || (workerProfile && !workerProfile.roleId);

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
