"use client";

import React, { useMemo, useState } from "react";
import { collection, doc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Calendar, UserCog, LoaderCircle, GanttChartSquare } from "lucide-react";
import type { ApprovalRequest } from "@/lib/types";
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const getIconForType = (type: ApprovalRequest['type']) => {
    switch (type) {
        case 'New Worker': return <UserPlus className="h-5 w-5" />;
        case 'Profile Update': return <UserCog className="h-5 w-5" />;
        case 'Room Booking': return <Calendar className="h-5 w-5" />;
        default: return <UserPlus className="h-5 w-5" />;
    }
}

const ApprovalRequestDetailsDialog = ({ request, open, onOpenChange }: { request: ApprovalRequest | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!request) return null;

    const getStatusBadge = (status: ApprovalRequest['status']) => {
        switch (status) {
            case 'Approved': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
            case 'Rejected': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
            case 'Pending':
            default:
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline flex items-center gap-2">
                        {getIconForType(request.type)}
                        {request.type} Request
                    </DialogTitle>
                    <DialogDescription>
                        Submitted by {request.requester}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Details</Label>
                        <p className="text-sm">{request.details}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Request Date</Label>
                        <p className="text-sm">{request.date ? format(new Date((request.date as any).seconds * 1000), 'PPp') : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <div>{getStatusBadge(request.status)}</div>
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const KanbanCard = ({ request, onUpdateStatus, canManage, onClick }: { request: ApprovalRequest, onUpdateStatus: (request: ApprovalRequest, status: 'Approved' | 'Rejected') => void, canManage: boolean, onClick: (request: ApprovalRequest) => void }) => {
    
    const handleUpdateClick = (e: React.MouseEvent, status: 'Approved' | 'Rejected') => {
        e.stopPropagation(); // Prevent card's onClick from firing
        onUpdateStatus(request, status);
    }
    
    return (
        <Card className="shadow-sm hover:shadow-lg transition-shadow bg-card cursor-pointer" onClick={() => onClick(request)}>
            <CardHeader className="p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-md text-primary mt-1">
                        {getIconForType(request.type)}
                    </div>
                    <div>
                        <CardTitle className="text-sm leading-snug">{request.details}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                            {request.requester} &bull; {request.date ? formatDistanceToNow(new Date((request.date as any).seconds * 1000), { addSuffix: true }) : ''}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Badge variant="outline">{request.type}</Badge>
            </CardContent>
            {canManage && request.status === 'Pending' && (
                 <CardContent className="p-4 pt-0 flex justify-end gap-2">
                    <Button size="sm" variant="destructive" onClick={(e) => handleUpdateClick(e, 'Rejected')}>
                        Reject
                    </Button>
                    <Button size="sm" onClick={(e) => handleUpdateClick(e, 'Approve')}>
                        Approve
                    </Button>
                </CardContent>
            )}
        </Card>
    );
};

const KanbanColumn = ({ title, requests, onUpdateStatus, canManage, onCardClick }: { title: string, requests: ApprovalRequest[], onUpdateStatus: (request: ApprovalRequest, status: 'Approved' | 'Rejected') => void, canManage: boolean, onCardClick: (request: ApprovalRequest) => void }) => {
    return (
        <div className="w-80 shrink-0">
            <h3 className="font-semibold mb-3 px-1 flex items-center justify-between text-sm uppercase text-muted-foreground">
                {title} <Badge variant="secondary" className="rounded-md">{requests.length}</Badge>
            </h3>
            <div className="bg-muted/40 rounded-lg p-1.5 space-y-1.5 h-full">
                {requests.length > 0 ? requests.map(request => (
                    <KanbanCard 
                        key={request.id} 
                        request={request}
                        onUpdateStatus={onUpdateStatus}
                        canManage={canManage}
                        onClick={onCardClick}
                    />
                )) : (
                    <div className="h-20 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">No requests</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ApprovalsPage() {
    const firestore = useFirestore();
    const { isSuperAdmin, isLoading: isRoleLoading, realUserRole } = useUserRole();
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);

    const canManageApprovals = useMemo(() => {
        if (isRoleLoading || !realUserRole) return false;
        return isSuperAdmin || !!realUserRole.privileges?.['manage_approvals'];
    }, [isRoleLoading, realUserRole, isSuperAdmin]);

    const approvalsRef = useMemoFirebase(() => {
        return collection(firestore, "approvals");
    }, [firestore]);

    const { data: requests, isLoading: approvalsLoading } = useCollection<ApprovalRequest>(approvalsRef);

    const isLoading = isRoleLoading || approvalsLoading;

    const handleUpdateRequestStatus = (request: ApprovalRequest, status: 'Approved' | 'Rejected') => {
        if (!request.id) return;
        updateDocumentNonBlocking(doc(firestore, "approvals", request.id), { status });

        // Handle side-effects on final approval/rejection
        if (status === 'Approved') {
            if (request.type === 'New Worker' && request.workerId) {
                const workerDocRef = doc(firestore, "users", request.workerId);
                updateDocumentNonBlocking(workerDocRef, { status: 'Active' });
            }
            if (request.type === 'Room Booking' && request.roomId && request.reservationId) {
              const reservationDocRef = doc(firestore, "rooms", request.roomId, "reservations", request.reservationId);
              updateDocumentNonBlocking(reservationDocRef, { status: 'Approved' });
            }
        } else if (status === 'Rejected') {
            if (request.type === 'Room Booking' && request.roomId && request.reservationId) {
                const reservationDocRef = doc(firestore, "rooms", request.roomId, "reservations", request.reservationId);
                updateDocumentNonBlocking(reservationDocRef, { status: 'Rejected' });
            }
        }
    };
    
    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
            </AppLayout>
        );
    }

    if (!canManageApprovals && requests?.filter(r => r.status === 'Pending').length === 0) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>No Pending Approvals</CardTitle>
                        <CardDescription>There are currently no items that require your approval.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }
    
    const sortedRequests = requests?.sort((a,b) => ((b.date as any)?.seconds || 0) - ((a.date as any)?.seconds || 0)) || [];
    const pendingRequests = sortedRequests.filter(r => r.status === 'Pending');
    const approvedRequests = sortedRequests.filter(r => r.status === 'Approved');
    const rejectedRequests = sortedRequests.filter(r => r.status === 'Rejected');

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <GanttChartSquare className="h-6 w-6" />
                    <h1 className="text-2xl font-headline font-bold">Approval Requests</h1>
                </div>
            </div>
            
             <div className="flex-grow overflow-x-auto">
                <div className="flex gap-6 pb-4">
                    <KanbanColumn 
                        title="Pending"
                        requests={pendingRequests}
                        onUpdateStatus={handleUpdateRequestStatus}
                        canManage={canManageApprovals}
                        onCardClick={setSelectedRequest}
                    />
                    <KanbanColumn 
                        title="Approved"
                        requests={approvedRequests}
                        onUpdateStatus={handleUpdateRequestStatus}
                        canManage={canManageApprovals}
                        onCardClick={setSelectedRequest}
                    />
                     <KanbanColumn 
                        title="Rejected"
                        requests={rejectedRequests}
                        onUpdateStatus={handleUpdateRequestStatus}
                        canManage={canManageApprovals}
                        onCardClick={setSelectedRequest}
                    />
                </div>
            </div>

             <ApprovalRequestDetailsDialog 
                request={selectedRequest}
                open={!!selectedRequest}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedRequest(null);
                    }
                }}
            />
        </AppLayout>
    );
}
