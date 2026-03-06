"use client";

import React from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@studio/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@studio/ui';
import { Badge } from '@studio/ui';
import { LoaderCircle, CheckCircle2, Clock } from 'lucide-react';
import type { ApprovalRequest } from '@studio/types';
import Link from 'next/link';
import { Button } from '@studio/ui';

export function ApprovalsWidget() {
    const firestore = useFirestore();
    const approvalsRef = useMemoFirebase(() => query(collection(firestore, "approvals"), where("status", "==", "Pending")), [firestore]);
    const { data: approvals, isLoading } = useCollection<ApprovalRequest>(approvalsRef);

    if (isLoading) {
        return (
            <Card className="flex items-center justify-center p-8 h-[200px]">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    const ministryHeadPending = approvals?.filter(r => r.type === 'New Worker') || [];
    const departmentHeadPending = approvals?.filter(r => r.type === 'Profile Update') || [];
    const adminPending = approvals?.filter(r => r.type === 'Room Booking') || [];

    const categories = [
        { label: 'Ministry Head', count: ministryHeadPending.length, color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
        { label: 'Department Head', count: departmentHeadPending.length, color: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' },
        { label: 'Admin', count: adminPending.length, color: 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100' },
    ];

    return (
        <Card className="overflow-hidden border bg-gradient-to-br from-card to-secondary/5 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-headline font-bold">For Approval</CardTitle>
                        <CardDescription>Pending requests requiring attention</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-mono text-primary bg-primary/10 border-primary/20">{approvals?.length || 0} Total</Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <div key={cat.label} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${cat.color}`}>
                            <span className="text-3xl font-bold mb-1">{cat.count}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-center">{cat.label}</span>
                            {cat.count > 0 ? (
                                <div className="mt-2 text-[10px] flex items-center gap-1 font-medium italic">
                                    <Clock className="h-2 w-2" /> Needs Action
                                </div>
                            ) : (
                                <div className="mt-2 text-[10px] flex items-center gap-1 opacity-70 font-medium">
                                    <CheckCircle2 className="h-2 w-2" /> All Clear
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {approvals && approvals.length > 0 && (
                    <Button asChild variant="link" size="sm" className="w-full mt-4 h-8 text-primary font-semibold hover:no-underline hover:bg-primary/5 rounded-lg transition-colors">
                        <Link href="/approvals">
                            Manage All Approval Requests
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
