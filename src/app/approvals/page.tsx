"use client";

import React from "react";
import { collection, doc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, UserPlus, Calendar, UserCog, LoaderCircle } from "lucide-react";
import type { ApprovalRequest } from "@/lib/types";
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { format } from "date-fns";

const getIconForType = (type: ApprovalRequest['type']) => {
    switch(type) {
        case 'New Worker': return <UserPlus className="h-5 w-5" />;
        case 'Profile Update': return <UserCog className="h-5 w-5" />;
        case 'Room Booking': return <Calendar className="h-5 w-5" />;
        default: return <UserPlus className="h-5 w-5" />;
    }
}

export default function ApprovalsPage() {
    const firestore = useFirestore();
    const approvalsRef = useMemoFirebase(() => collection(firestore, "approvals"), [firestore]);
    const { data: requests, isLoading } = useCollection<ApprovalRequest>(approvalsRef);

    const handleApproval = (id: string, newStatus: 'Approved' | 'Rejected') => {
        if (!id) return;
        updateDocumentNonBlocking(doc(firestore, "approvals", id), { status: newStatus });
    };

    const pendingRequests = requests?.filter(r => r.status === 'pending');

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Approval Workflow</h1>
            </div>

            {isLoading && (
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {!isLoading && pendingRequests && pendingRequests.length > 0 ? pendingRequests.map(request => (
                    <Card key={request.id}>
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                    {getIconForType(request.type)}
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{request.type}</CardTitle>
                                    <CardDescription>
                                        Requested by {request.requester}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{request.details}</p>
                             <p className="text-xs text-muted-foreground mt-2">{request.date ? format(new Date(request.date), 'PP') : ''}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleApproval(request.id, 'Rejected')}>
                                <X className="mr-2 h-4 w-4" /> Deny
                            </Button>
                            <Button size="sm" onClick={() => handleApproval(request.id, 'Approved')}>
                                <Check className="mr-2 h-4 w-4" /> Approve
                            </Button>
                        </CardFooter>
                    </Card>
                )) : (
                    !isLoading && (
                        <div className="col-span-full text-center py-10">
                            <p className="text-muted-foreground">No pending approvals.</p>
                        </div>
                    )
                )}
            </div>
        </AppLayout>
    );
}
