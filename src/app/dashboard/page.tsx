"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { writeBatch, doc, collection, serverTimestamp } from "firebase/firestore";

export default function DashboardPage() {
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();

    const initializeSystem = async () => {
        let adminUser;
        try {
            // 1. Create the admin user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, 'admin@system.com', 'password');
            adminUser = userCredential.user;
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                // If user already exists, try to sign in to get the user object
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, 'admin@system.com', 'password');
                    adminUser = userCredential.user;
                } catch (signInError: any) {
                    console.error("Failed to sign in existing admin:", signInError);
                    toast({
                        variant: "destructive",
                        title: "Initialization Failed",
                        description: "Admin user exists but failed to sign in. Check password.",
                    });
                    return;
                }
            } else {
                // Handle other auth errors
                console.error("System initialization failed:", error);
                toast({
                    variant: "destructive",
                    title: "Initialization Failed",
                    description: error.message || "An unknown error occurred during user creation.",
                });
                return;
            }
        }
        
        if (!adminUser) {
            toast({
                variant: "destructive",
                title: "Initialization Failed",
                description: "Could not retrieve admin user details.",
            });
            return;
        }

        try {
            // 2. Create a write batch for atomic Firestore operation
            const batch = writeBatch(firestore);

            // 3. Define roles data
            const roles = {
                admin: { name: 'Admin', privileges: ['create_user', 'delete_user', 'edit_all', 'manage_roles'] },
                editor: { name: 'Editor', privileges: ['edit_all'] },
                viewer: { name: 'Viewer', privileges: [] }
            };

            // 4. Add roles to the batch
            for (const [roleId, roleData] of Object.entries(roles)) {
                const roleRef = doc(firestore, 'roles', roleId);
                batch.set(roleRef, roleData);
            }
            
            // 5. Create the user document in Firestore, linking to the 'admin' role
            const userRef = doc(firestore, 'users', adminUser.uid);
            batch.set(userRef, {
                email: 'admin@system.com',
                roleId: 'admin',
                status: 'active',
                createdAt: serverTimestamp()
            });

            // 6. Commit the batch
            await batch.commit();

            toast({
                title: "System Initialized",
                description: "Admin account and roles have been created successfully.",
            });

        } catch (dbError: any) {
            console.error("Database seeding failed:", dbError);
            toast({
                variant: "destructive",
                title: "Database Seed Failed",
                description: "An error occurred while seeding the database.",
            });
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-headline font-bold tracking-tight">
                    Dashboard
                </h1>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                   {/* The System Seed card has been moved to the Settings page */}
                </div>
            </div>
        </AppLayout>
    );
}
