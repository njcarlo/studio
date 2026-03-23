"use client";

import React, { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Button } from "@studio/ui";
import { UserPlus, Calendar, UserCog, LoaderCircle, GanttChartSquare, CheckCircle2, XCircle, Clock, Search, Filter, ChevronRight, ArrowRightLeft } from "lucide-react";
import { Input } from "@studio/ui";
import { cn } from "@/lib/utils";
import { ApprovalRequest, Worker, Ministry } from "@studio/types";
import { useApprovals } from "@/hooks/use-approvals";
import { useWorkers } from "@/hooks/use-workers";
import { useMinistries } from "@/hooks/use-ministries";
import { useUserRole } from "@/hooks/use-user-role";
import { useApprovalMutations } from "@/hooks/use-approval-mutations";
import { ApprovalDetailsDialog } from "@/components/approvals/approval-details-dialog";
import { KanbanColumn } from "@/components/approvals/kanban-column";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@studio/ui";

export default function ApprovalsPage() {
    const { canManageApprovals, canApproveAllRequests, canApproveRoomReservation, workerProfile, isLoading: isRoleLoading, isSuperAdmin } = useUserRole();
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);

    // SQL Hooks
    const { approvals: requests, isLoading: approvalsLoading } = useApprovals();
    const { workers, isLoading: workersLoading } = useWorkers();
    const { ministries, isLoading: ministriesLoading } = useMinistries();

    // Mutations
    const { updateStatus, isUpdating } = useApprovalMutations();

    const isLoading = isRoleLoading || approvalsLoading || workersLoading || ministriesLoading;

    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");

    const filteredRequests = useMemo(() => {
        let results = [...(requests || [])] as ApprovalRequest[];

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            results = results.filter(r =>
                r.requester.toLowerCase().includes(lower) ||
                r.details.toLowerCase().includes(lower)
            );
        }

        if (filterType !== 'all') {
            results = results.filter(r => r.type === filterType);
        }

        return results.sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime());
    }, [requests, searchTerm, filterType]);

    const checkIsApprover = (request: ApprovalRequest) => {
        if (!workerProfile) return false;
        if (!request.workerId) return false;

        const targetWorker = workers?.find(w => w.id === request.workerId);
        if (!targetWorker) return false;

        const majorMinistry = ministries?.find(m => m.id === targetWorker.majorMinistryId);
        const minorMinistry = ministries?.find(m => m.id === targetWorker.minorMinistryId);

        return (majorMinistry?.approverId === workerProfile.id) ||
            (majorMinistry?.headId === workerProfile.id) ||
            (minorMinistry?.approverId === workerProfile.id) ||
            (minorMinistry?.headId === workerProfile.id);
    };

    const checkCanManage = (request: ApprovalRequest) => {
        const isApprover = checkIsApprover(request);
        if (canApproveAllRequests || isSuperAdmin) return true;

        if (request.type === 'Ministry Change') {
            if (!workerProfile) return false;

            if (request.status === 'Pending Outgoing Approval') {
                const oldMajor = ministries.find(m => m.id === request.oldMajorId);
                const oldMinor = ministries.find(m => m.id === request.oldMinorId);
                return (oldMajor?.headId === workerProfile.id || oldMajor?.approverId === workerProfile.id ||
                    oldMinor?.headId === workerProfile.id || oldMinor?.approverId === workerProfile.id);
            }

            if (request.status === 'Pending Incoming Approval') {
                const newMajor = ministries.find(m => m.id === request.newMajorId);
                const newMinor = ministries.find(m => m.id === request.newMinorId);
                return (newMajor?.headId === workerProfile.id || newMajor?.approverId === workerProfile.id ||
                    newMinor?.headId === workerProfile.id || newMinor?.approverId === workerProfile.id);
            }
        }

        if (request.type === 'Room Booking' && request.status === 'Pending Admin Approval') {
            return canApproveRoomReservation && (canApproveAllRequests || isSuperAdmin);
        }

        return isApprover;
    };

    const handleUpdateRequestStatus = (request: ApprovalRequest, status: 'Approved' | 'Rejected') => {
        if (!request.id) return;
        if (!checkCanManage(request)) return;

        // Multi-stage Room Booking approval handling
        if (request.type === 'Room Booking' && status === 'Approved') {
            if (request.status === 'Pending Ministry Approval' || request.status === 'Pending') {
                updateStatus({ request, status: 'Pending Admin Approval' });
                return;
            }
        }

        // Multi-stage Ministry Change approval handling
        if (request.type === 'Ministry Change' && status === 'Approved') {
            if (request.status === 'Pending Outgoing Approval') {
                updateStatus({ request, status: 'Pending Incoming Approval', options: { outgoingApproved: true } });
                return;
            }
        }

        updateStatus({ request, status });
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
            </AppLayout>
        );
    }

    const hasAnyApproverRole = ministries?.some(m => m.approverId === workerProfile?.id || m.headId === workerProfile?.id);
    const canViewPage = canManageApprovals || canApproveRoomReservation || hasAnyApproverRole;
    if (!canViewPage) {
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


    const pendingRequests = filteredRequests.filter(r => r.status.startsWith('Pending'));
    const approvedRequests = filteredRequests.filter(r => r.status === 'Approved');
    const rejectedRequests = filteredRequests.filter(r => r.status === 'Rejected');

    const stats = {
        total: requests?.length || 0,
        pending: requests?.filter(r => r.status.startsWith('Pending')).length || 0,
        approved: requests?.filter(r => r.status === 'Approved').length || 0,
        rejected: requests?.filter(r => r.status === 'Rejected').length || 0,
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl text-primary shadow-inner">
                            <GanttChartSquare className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-headline font-bold tracking-tight">Approvals</h1>
                            <p className="text-sm text-muted-foreground font-medium">Manage and review incoming requests.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                placeholder="Search requests..."
                                className="pl-9 w-64 bg-muted/40 border-border/50 focus-within:bg-background transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-40 bg-muted/40 border-border/50">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                    <SelectValue placeholder="All Types" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="New Worker">New Worker</SelectItem>
                                <SelectItem value="Profile Update">Profile Update</SelectItem>
                                <SelectItem value="Room Booking">Room Booking</SelectItem>
                                <SelectItem value="Ministry Change">Ministry Change</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Requests', value: stats.total, icon: GanttChartSquare, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
                        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                        { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                        { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                    ].map((stat, i) => (
                        <Card key={i} className={cn("border-none shadow-sm transition-transform hover:scale-[1.02]", stat.bg)}>
                            <div className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">{stat.label}</p>
                                    <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
                                </div>
                                <div className={cn("p-2 rounded-xl border bg-white shadow-sm", stat.border)}>
                                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="overflow-x-auto pb-4 -mx-6 px-6">
                    <div className="flex gap-8 min-w-[1000px] justify-start items-start">
                        <KanbanColumn
                            title="Pending"
                            icon={<Clock className="h-4 w-4" />}
                            requests={pendingRequests}
                            onUpdateStatus={handleUpdateRequestStatus}
                            checkCanManage={checkCanManage}
                            onCardClick={setSelectedRequest}
                            workers={workers}
                            isUpdating={isUpdating}
                        />
                        <KanbanColumn
                            title="Approved"
                            icon={<CheckCircle2 className="h-4 w-4" />}
                            requests={approvedRequests}
                            onUpdateStatus={handleUpdateRequestStatus}
                            checkCanManage={checkCanManage}
                            onCardClick={setSelectedRequest}
                            workers={workers}
                            isUpdating={isUpdating}
                        />
                        <KanbanColumn
                            title="Rejected"
                            icon={<XCircle className="h-4 w-4" />}
                            requests={rejectedRequests}
                            onUpdateStatus={handleUpdateRequestStatus}
                            checkCanManage={checkCanManage}
                            onCardClick={setSelectedRequest}
                            workers={workers}
                            isUpdating={isUpdating}
                        />
                    </div>
                </div>
            </div>

            <ApprovalDetailsDialog
                request={selectedRequest}
                open={!!selectedRequest}
                requesterWorker={workers?.find(w => w.id === selectedRequest?.workerId)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedRequest(null);
                    }
                }}
            />
        </AppLayout>
    );
}
