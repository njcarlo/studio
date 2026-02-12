"use client";

import React from "react";
import { writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { LoaderCircle, Shield } from "lucide-react";
import { allPermissions } from "@/lib/permissions";
import { useFirestore, useAuth } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();

    // System Seeder
    const initializeSystem = async () => {
        let adminUser;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, 'njcarlo@gmail.com', 'password');
            adminUser = userCredential.user;
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, 'njcarlo@gmail.com', 'password');
                    adminUser = userCredential.user;
                } catch (signInError: any) {
                    toast({ variant: "destructive", title: "Initialization Failed", description: "Admin user exists but failed to sign in." });
                    return;
                }
            } else {
                toast({ variant: "destructive", title: "Initialization Failed", description: error.message || "An unknown error occurred." });
                return;
            }
        }
        
        if (!adminUser) {
            toast({ variant: "destructive", title: "Initialization Failed", description: "Could not retrieve admin user." });
            return;
        }

        try {
            const batch = writeBatch(firestore);
            const rolesData = {
                admin: { name: 'Admin', privileges: allPermissions.reduce((acc, p) => ({ ...acc, [p]: true }), {}) },
                editor: { name: 'Editor', privileges: { 'manage_content': true } },
                viewer: { name: 'Viewer', privileges: {} }
            };
            for (const [roleId, roleData] of Object.entries(rolesData)) {
                batch.set(doc(firestore, 'roles', roleId), roleData);
            }
            batch.set(doc(firestore, 'users', adminUser.uid), {
                email: 'njcarlo@gmail.com',
                firstName: 'Admin',
                lastName: 'User',
                roleId: 'admin',
                status: 'Active',
                createdAt: serverTimestamp()
            });
            await batch.commit();
            toast({ title: "System Initialized", description: "Admin account and default roles have been created." });
        } catch (dbError: any) {
            toast({ variant: "destructive", title: "Database Seed Failed", description: "Could not seed the database." });
        }
    };

    if (isRoleLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!isSuperAdmin) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">System Settings</h1>
            </div>
            <p className="text-muted-foreground">Manage core application settings.</p>

            <div className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield /> System Seed</CardTitle>
                        <CardDescription>
                            Initialize the system with default roles and an admin user. This is a one-time operation that can be run again to reset roles.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={initializeSystem}>
                            Initialize System
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
