"use client";

import React from "react";
import { collection, doc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, UserPlus, Calendar, UserCog, LoaderCircle } from "lucide-react";
import type { ApprovalRequest } from "@/lib/types";
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getIconForType = (type: ApprovalRequest['type']) => {
    switch(type) {
        case 'New Worker': return <UserPlus className="h-5 w-5" />;
        case 'Profile Update': return <UserCog className="h-5 w-5" />;
        case 'Room Booking': return <Calendar className="h-5 w-5" />;
        default: return <UserPlus className="h-5 w-5" />;
    }
}

const ApprovalCard = ({ request, onApprove, onDeny }: { request: ApprovalRequest, onApprove: (request: ApprovalRequest) => void, onDeny: (request: ApprovalRequest) => void }) => (
    <Card>
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
             <p className="text-xs text-muted-foreground mt-2">{(request.date as any)?.seconds ? format(new Date((request.date as any).seconds * 1000), 'PP') : ''}</p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onDeny(request)}>
                <X className="mr-2 h-4 w-4" /> Deny
            </Button>
            <Button size="sm" onClick={() => onApprove(request)}>
                <Check className="mr-2 h-4 w-4" /> Approve
            </Button>
        </CardFooter>
    </Card>
);

const ApprovalList = ({ 
    requests, 
    isLoading, 
    emptyMessage, 
    onApprove, 
    onDeny 
}: { 
    requests: ApprovalRequest[] | undefined, 
    isLoading: boolean, 
    emptyMessage: string, 
    onApprove: (request: ApprovalRequest) => void, 
    onDeny: (request: ApprovalRequest) => void 
}) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {requests && requests.length > 0 ? requests.map(request => (
               <ApprovalCard 
                    key={request.id} 
                    request={request} 
                    onApprove={onApprove} 
                    onDeny={onDeny}
                />
            )) : (
                <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
            )}
        </div>
    )
};


export default function ApprovalsPage() {
    const firestore = useFirestore();
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();

    const approvalsRef = useMemoFirebase(() => {
        if (!isSuperAdmin) return null;
        return collection(firestore, "approvals");
    }, [firestore, isSuperAdmin]);

    const { data: requests, isLoading: approvalsLoading } = useCollection<ApprovalRequest>(approvalsRef);

    const isLoading = isRoleLoading || approvalsLoading;

    const handleApproval = (request: ApprovalRequest, newStatus: 'Approved' | 'Rejected') => {
        if (!request.id) return;
        updateDocumentNonBlocking(doc(firestore, "approvals", request.id), { status: newStatus });

        if (request.type === 'New Worker' && newStatus === 'Approved' && request.workerId) {
            const workerDocRef = doc(firestore, "users", request.workerId);
            updateDocumentNonBlocking(workerDocRef, { status: 'Active' });
        }
        
        if (request.type === 'Room Booking' && request.roomId && request.reservationId) {
          const reservationDocRef = doc(firestore, "rooms", request.roomId, "reservations", request.reservationId);
          updateDocumentNonBlocking(reservationDocRef, { status: newStatus });
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
            </AppLayout>
        );
    }

    if (!isSuperAdmin) {
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

    const onApprove = (request: ApprovalRequest) => handleApproval(request, 'Approved');
    const onDeny = (request: ApprovalRequest) => handleApproval(request, 'Rejected');

    const pendingRequests = requests?.filter(r => r.status === 'Pending');
    const workerMovementRequests = pendingRequests?.filter(r => r.type === 'New Worker' || r.type === 'Profile Update');
    const roomReservationRequests = pendingRequests?.filter(r => r.type === 'Room Booking');

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-headline font-bold">Approval Workflow</h1>
            </div>

            <Tabs defaultValue="worker">
                <TabsList className="grid w-full grid-cols-2 md:w-auto">
                    <TabsTrigger value="worker">Worker Movement</TabsTrigger>
                    <TabsTrigger value="room">Room Reservations</TabsTrigger>
                </TabsList>
                <TabsContent value="worker" className="mt-4">
                   <ApprovalList 
                        requests={workerMovementRequests}
                        isLoading={isLoading}
                        emptyMessage="No pending worker movement approvals."
                        onApprove={onApprove}
                        onDeny={onDeny}
                   />
                </TabsContent>
                <TabsContent value="room" className="mt-4">
                    <ApprovalList 
                        requests={roomReservationRequests}
                        isLoading={isLoading}
                        emptyMessage="No pending room reservation approvals."
                        onApprove={onApprove}
                        onDeny={onDeny}
                   />
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
