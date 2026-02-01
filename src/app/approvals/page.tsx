"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, UserPlus, Calendar, UserCog } from "lucide-react";
import { approvalRequests as initialApprovalRequests } from "@/lib/placeholder-data";
import type { ApprovalRequest } from "@/lib/types";

const getIconForType = (type: ApprovalRequest['type']) => {
    switch(type) {
        case 'New Worker': return <UserPlus className="h-5 w-5" />;
        case 'Profile Update': return <UserCog className="h-5 w-5" />;
        case 'Room Booking': return <Calendar className="h-5 w-5" />;
        default: return <UserPlus className="h-5 w-5" />;
    }
}

export default function ApprovalsPage() {
    const [requests, setRequests] = useState(initialApprovalRequests);

    const handleApproval = (id: string, approve: boolean) => {
        // In a real app, this would trigger an API call.
        // For now, we just remove it from the list.
        setRequests(requests.filter(req => req.id !== id));
        console.log(`Request ${id} ${approve ? 'approved' : 'denied'}.`);
    };

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Approval Workflow</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {requests.length > 0 ? requests.map(request => (
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
                             <p className="text-xs text-muted-foreground mt-2">{request.date.toLocaleDateString()}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleApproval(request.id, false)}>
                                <X className="mr-2 h-4 w-4" /> Deny
                            </Button>
                            <Button size="sm" onClick={() => handleApproval(request.id, true)}>
                                <Check className="mr-2 h-4 w-4" /> Approve
                            </Button>
                        </CardFooter>
                    </Card>
                )) : (
                    <div className="col-span-full text-center py-10">
                        <p className="text-muted-foreground">No pending approvals.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
