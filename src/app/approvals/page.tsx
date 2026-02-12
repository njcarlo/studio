"use client";

import React, { useMemo } from "react";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Calendar, UserCog, LoaderCircle, GanttChartSquare } from "lucide-react";
import type { ApprovalRequest, WorkflowState, WorkflowTransition } from "@/lib/types";
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getIconForType = (type: ApprovalRequest['type']) => {
    switch (type) {
        case 'New Worker': return <UserPlus className="h-5 w-5" />;
        case 'Profile Update': return <UserCog className="h-5 w-5" />;
        case 'Room Booking': return <Calendar className="h-5 w-5" />;
        default: return <UserPlus className="h-5 w-5" />;
    }
}

const KanbanCard = ({ request, transitions, onTransition }: { request: ApprovalRequest, transitions: WorkflowTransition[], onTransition: (request: ApprovalRequest, transition: WorkflowTransition) => void }) => {
    
    const possibleTransitions = transitions.filter(t => t.fromStateId === request.currentStateId);

    return (
        <Card className="shadow-sm hover:shadow-lg transition-shadow bg-card">
            <CardHeader className="p-3">
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
            <CardContent className="p-3 pt-0">
                <Badge variant="outline">{request.type}</Badge>
            </CardContent>
            {possibleTransitions.length > 0 && (
                 <CardFooter className="p-3 pt-0 flex justify-end gap-2">
                    {possibleTransitions.map(transition => (
                        <Button key={transition.id} size="sm" variant={transition.name === 'Reject' ? 'outline' : 'default'} onClick={() => onTransition(request, transition)}>
                            {transition.name}
                        </Button>
                    ))}
                </CardFooter>
            )}
        </Card>
    );
};

const KanbanColumn = ({ state, requests, transitions, onTransition }: { state: WorkflowState, requests: ApprovalRequest[], transitions: WorkflowTransition[], onTransition: (request: ApprovalRequest, transition: WorkflowTransition) => void }) => {
    return (
        <div className="w-72 shrink-0">
            <h3 className="font-semibold mb-3 px-1 flex items-center justify-between text-sm uppercase text-muted-foreground">
                {state.name} <Badge variant="secondary" className="rounded-md">{requests.length}</Badge>
            </h3>
            <div className="bg-muted/40 rounded-lg p-2 space-y-2 h-full">
                {requests.length > 0 ? requests.map(request => (
                    <KanbanCard 
                        key={request.id} 
                        request={request} 
                        transitions={transitions}
                        onTransition={onTransition}
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

    const canManageApprovals = useMemo(() => {
        if (isRoleLoading || !realUserRole) return false;
        return isSuperAdmin || !!realUserRole.privileges?.['manage_approvals'];
    }, [isRoleLoading, realUserRole, isSuperAdmin]);

    const approvalsRef = useMemoFirebase(() => {
        if (!canManageApprovals) return null;
        return collection(firestore, "approvals");
    }, [firestore, canManageApprovals]);

    const workflowStatesRef = useMemoFirebase(() => {
        if (!canManageApprovals) return null;
        return query(collection(firestore, "workflows", "default_workflow", "states"), orderBy('order'));
    }, [firestore, canManageApprovals]);

    const workflowTransitionsRef = useMemoFirebase(() => {
        if (!canManageApprovals) return null;
        return collection(firestore, "workflows", "default_workflow", "transitions");
    }, [firestore, canManageApprovals]);

    const { data: requests, isLoading: approvalsLoading } = useCollection<ApprovalRequest>(approvalsRef);
    const { data: workflowStates, isLoading: statesLoading } = useCollection<WorkflowState>(workflowStatesRef);
    const { data: workflowTransitions, isLoading: transitionsLoading } = useCollection<WorkflowTransition>(workflowTransitionsRef);

    const isLoading = isRoleLoading || approvalsLoading || statesLoading || transitionsLoading;

    const handleTransition = (request: ApprovalRequest, transition: WorkflowTransition) => {
        if (!request.id) return;
        updateDocumentNonBlocking(doc(firestore, "approvals", request.id), { currentStateId: transition.toStateId });

        // Handle side-effects on final approval/rejection
        const finalState = workflowStates?.find(s => s.id === transition.toStateId);
        if (finalState && (finalState.name === 'Approved' || finalState.name === 'Rejected')) {
            if (request.type === 'New Worker' && finalState.name === 'Approved' && request.workerId) {
                const workerDocRef = doc(firestore, "users", request.workerId);
                updateDocumentNonBlocking(workerDocRef, { status: 'Active' });
            }
            if (request.type === 'Room Booking' && request.roomId && request.reservationId) {
              const reservationDocRef = doc(firestore, "rooms", request.roomId, "reservations", request.reservationId);
              updateDocumentNonBlocking(reservationDocRef, { status: finalState.name as 'Approved' | 'Rejected' });
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
                    {workflowStates?.map(state => {
                        const stateRequests = requests?.filter(r => r.currentStateId === state.id).sort((a,b) => ((b.date as any)?.seconds || 0) - ((a.date as any)?.seconds || 0)) || [];
                        return (
                            <KanbanColumn 
                                key={state.id}
                                state={state}
                                requests={stateRequests}
                                transitions={workflowTransitions || []}
                                onTransition={handleTransition}
                            />
                        )
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
