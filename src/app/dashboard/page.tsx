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

export default function DashboardPage() {
    const { userProfile, isLoading } = useUserRole();
    
    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-headline font-bold tracking-tight">
                    Dashboard
                </h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome, {userProfile?.firstName || 'User'}!</CardTitle>
                        <CardDescription>This is your application dashboard. More widgets and stats coming soon.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </AppLayout>
    );
}
