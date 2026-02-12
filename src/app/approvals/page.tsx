"use client";

import React, { useMemo } from "react";
import { collection, doc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, UserPlus, Calendar, UserCog, LoaderCircle, GanttChartSquare } from "lucide-react";
import type { ApprovalRequest } from "@/lib/types";
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { format, formatDistanceToNow, isAfter, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

type Status = 'Pending' | 'In Review' | 'Approved' | 'Rejected';

const getIconForType = (type: ApprovalRequest['type']) => {
    switch (type) {
        case 'New Worker': return <UserPlus className="h-5 w-5" />;
        case 'Profile Update': return <UserCog className="h-5 w-5" />;
        case 'Room Booking': return <Calendar className="h-5 w-5" />;
        default: return <UserPlus className="h-5 w-5" />;
    }
}

const KanbanCard = ({ request, onStatusChange }: { request: ApprovalRequest, onStatusChange: (request: ApprovalRequest, newStatus: Status) => void }) => {
    
    const canMoveToReview = request.status === 'Pending';
    const canDecide = request.status === 'In Review';
    const isDone = request.status === 'Approved' || request.status === 'Rejected';

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary mt-1">
                        {getIconForType(request.type)}
                    </div>
                    <div>
                        <CardTitle className="text-base">{request.details}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                            Requested by {request.requester} &bull; {request.date ? formatDistanceToNow(new Date((request.date as any).seconds * 1000), { addSuffix: true }) : ''}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Badge variant="secondary">{request.type}</Badge>
            </CardContent>
            {!isDone && (
                 <CardFooter className="flex justify-end gap-2">
                    {canMoveToReview && <Button size="sm" onClick={() => onStatusChange(request, 'In Review')}>Start Review</Button>}
                    {canDecide && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => onStatusChange(request, 'Rejected')}>
                                <X className="mr-2 h-4 w-4" /> Reject
                            </Button>
                            <Button size="sm" onClick={() => onStatusChange(request, 'Approved')}>
                                <Check className="mr-2 h-4 w-4" /> Approve
                            </Button>
                        </>
                    )}
                </CardFooter>
            )}
        </Card>
    );
};

const KanbanColumn = ({ title, requests, onStatusChange }: { title: string, requests: ApprovalRequest[], onStatusChange: (request: ApprovalRequest, newStatus: Status) => void }) => {
    return (
        <div className="w-80 shrink-0">
            <h2 className="text-lg font-semibold mb-2 px-1 flex items-center gap-2">
                {title} <Badge variant="secondary">{requests.length}</Badge>
            </h2>
            <div className="bg-muted/50 rounded-lg p-2 space-y-3 h-full">
                {requests.length > 0 ? requests.map(request => (
                    <KanbanCard 
                        key={request.id} 
                        request={request} 
                        onStatusChange={onStatusChange}
                    />
                )) : (
                    <div className="h-32 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No requests</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ApprovalsPage() {
    const firestore = useFirestore();
    const { isSuperAdmin, isLoading: isRoleLoading, realUserRole } = useUserRole();

    const canManageApprovals = useMemo(() => {
        if (isRoleLoading || !realUserRole) return false;
        return isSuperAdmin || !!realUserRole.privileges?.['manage_approvals'];
    }, [isRoleLoading, realUserRole, isSuperAdmin]);

    const approvalsRef = useMemoFirebase(() => {
        if (!canManageApprovals) return null;
        return collection(firestore, "approvals");
    }, [firestore, canManageApprovals]);

    const { data: requests, isLoading: approvalsLoading } = useCollection<ApprovalRequest>(approvalsRef);

    const isLoading = isRoleLoading || approvalsLoading;

    const handleStatusChange = (request: ApprovalRequest, newStatus: Status) => {
        if (!request.id) return;
        updateDocumentNonBlocking(doc(firestore, "approvals", request.id), { status: newStatus });

        // Handle side-effects on final approval/rejection
        if (newStatus === 'Approved' || newStatus === 'Rejected') {
            if (request.type === 'New Worker' && newStatus === 'Approved' && request.workerId) {
                const workerDocRef = doc(firestore, "users", request.workerId);
                updateDocumentNonBlocking(workerDocRef, { status: 'Active' });
            }
            if (request.type === 'Room Booking' && request.roomId && request.reservationId) {
              const reservationDocRef = doc(firestore, "rooms", request.roomId, "reservations", request.reservationId);
              updateDocumentNonBlocking(reservationDocRef, { status: newStatus });
            }
        }
    };
    
    const sortedRequests = useMemo(() => {
        return requests?.sort((a,b) => ((b.date as any)?.seconds || 0) - ((a.date as any)?.seconds || 0))
    }, [requests]);

    const pendingRequests = sortedRequests?.filter(r => r.status === 'Pending') || [];
    const inReviewRequests = sortedRequests?.filter(r => r.status === 'In Review') || [];
    
    // For done columns, only show recent items to avoid clutter
    const sevenDaysAgo = subDays(new Date(), 7);
    const approvedRequests = sortedRequests?.filter(r => r.status === 'Approved' && r.date && isAfter((r.date as any).toDate(), sevenDaysAgo)) || [];
    const rejectedRequests = sortedRequests?.filter(r => r.status === 'Rejected' && r.date && isAfter((r.date as any).toDate(), sevenDaysAgo)) || [];

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
            </AppLayout>
        );
    }

    if (!canManageApprovals) {
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
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <GanttChartSquare className="h-6 w-6" />
                    <h1 className="text-2xl font-headline font-bold">Approval Workflow</h1>
                </div>
            </div>
            
             <div className="flex-grow overflow-x-auto">
                <div className="flex gap-6 pb-4">
                    <KanbanColumn title="Pending" requests={pendingRequests} onStatusChange={handleStatusChange} />
                    <KanbanColumn title="In Review" requests={inReviewRequests} onStatusChange={handleStatusChange} />
                    <KanbanColumn title="Approved (Last 7 Days)" requests={approvedRequests} onStatusChange={handleStatusChange} />
                    <KanbanColumn title="Rejected (Last 7 Days)" requests={rejectedRequests} onStatusChange={handleStatusChange} />
                </div>
            </div>
        </AppLayout>
    );
}
