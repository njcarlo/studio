"use client";

import React, { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Button } from "@studio/ui";
import { UserPlus, Calendar, UserCog, LoaderCircle, GanttChartSquare, CheckCircle2, XCircle, Clock, Search, Filter, Info, ChevronRight, User, ArrowRightLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Input } from "@studio/ui";
import { cn } from "@/lib/utils";
import { ApprovalRequest, Worker, Ministry } from "@studio/types";
import { useApprovals } from "@/hooks/use-approvals";
import { useWorkers } from "@/hooks/use-workers";
import { useMinistries } from "@/hooks/use-ministries";
import { useUserRole } from "@/hooks/use-user-role";
import { useApprovalMutations } from "@/hooks/use-approval-mutations";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@studio/ui";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@studio/ui";
import { Label } from "@studio/ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@studio/ui";

const getIconForType = (type: ApprovalRequest['type']) => {
    switch (type) {
        case 'New Worker': return <UserPlus className="h-5 w-5" />;
        case 'Profile Update': return <UserCog className="h-5 w-5" />;
        case 'Room Booking': return <Calendar className="h-5 w-5" />;
        case 'Ministry Change': return <ArrowRightLeft className="h-5 w-5" />;
        default: return <UserPlus className="h-5 w-5" />;
    }
}

const ApprovalRequestDetailsDialog = ({ request, open, onOpenChange, requesterWorker }: { request: ApprovalRequest | null, open: boolean, onOpenChange: (open: boolean) => void, requesterWorker?: Worker | null }) => {
    if (!request) return null;

    const getStatusBadge = (status: ApprovalRequest['status']) => {
        switch (status) {
            case 'Approved': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">Approved</Badge>;
            case 'Rejected': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">Rejected</Badge>;
            case 'Pending Ministry Approval': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">Pending Ministry</Badge>;
            case 'Pending Admin Approval': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">Pending Admin</Badge>;
            case 'Pending Outgoing Approval': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Pending Outgoing</Badge>;
            case 'Pending Incoming Approval': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Pending Incoming</Badge>;
            default: return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">Pending</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <div className={cn(
                    "h-24 flex items-end p-6",
                    request.status === 'Approved' ? "bg-green-600" : request.status === 'Rejected' ? "bg-red-600" : "bg-primary"
                )}>
                    <div className="flex items-center gap-4 text-white">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                            {getIconForType(request.type)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-headline leading-tight">{request.type}</h2>
                            <p className="text-white/80 text-sm">Request Details</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                            <AvatarImage src={requesterWorker?.avatarUrl} />
                            <AvatarFallback className="bg-primary/10 text-primary uppercase">
                                {request.requester.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Submitted By</p>
                            <p className="text-sm font-semibold">{request.requester}</p>
                            <p className="text-[10px] text-muted-foreground">
                                {request.date ? format(new Date(request.date as any), 'MMM d, yyyy • h:mm a') : 'N/A'}
                            </p>
                        </div>
                        <div className="ml-auto">
                            {getStatusBadge(request.status)}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                            <Info className="h-4 w-4" />
                            Description
                        </div>
                        <div className="p-4 rounded-xl bg-card border shadow-sm text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {request.details}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0">
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const KanbanCard = ({ request, onUpdateStatus, canManage, onClick, requesterWorker, isUpdating }: { request: ApprovalRequest, onUpdateStatus: (request: ApprovalRequest, status: 'Approved' | 'Rejected') => void, canManage: boolean, onClick: (request: ApprovalRequest) => void, requesterWorker?: Worker | null, isUpdating: boolean }) => {

    const handleUpdateClick = (e: React.MouseEvent, status: 'Approved' | 'Rejected') => {
        e.stopPropagation();
        onUpdateStatus(request, status);
    }

    return (
        <Card className="group relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/30" onClick={() => onClick(request)}>
            <div className={cn(
                "absolute top-0 left-0 w-1 h-full transition-transform group-hover:scale-y-110",
                request.status === 'Approved' ? "bg-green-500" : request.status === 'Rejected' ? "bg-red-500" : "bg-primary"
            )} />

            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0 shadow-sm border border-border">
                            <AvatarImage src={requesterWorker?.avatarUrl} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{request.requester.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                            <p className="text-[13px] font-semibold truncate">{request.requester}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {request.date ? formatDistanceToNow(new Date(request.date as any), { addSuffix: true }) : ''}
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium h-5 rounded-md shrink-0">
                        {request.type}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-1 italic">
                    "{request.details}"
                </p>
            </CardContent>

            {canManage && request.status.startsWith('Pending') && (
                <div className="px-4 pb-4 flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 flex-1 text-xs text-destructive hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                        onClick={(e) => handleUpdateClick(e, 'Rejected')}
                        disabled={isUpdating}
                    >
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Reject
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 text-xs border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary"
                        onClick={(e) => handleUpdateClick(e, 'Approved')}
                        disabled={isUpdating}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Approve
                    </Button>
                </div>
            )}

            <div className="absolute right-2 bottom-2 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary group-hover:right-3 transition-all">
                <ChevronRight className="h-4 w-4" />
            </div>
        </Card>
    );
};

const KanbanColumn = ({ title, requests, onUpdateStatus, checkCanManage, onCardClick, icon, workers, isUpdating }: { title: string, requests: ApprovalRequest[], onUpdateStatus: (request: ApprovalRequest, status: 'Approved' | 'Rejected') => void, checkCanManage: (request: ApprovalRequest) => boolean, onCardClick: (request: ApprovalRequest) => void, icon?: React.ReactNode, workers?: Worker[], isUpdating: boolean }) => {
    return (
        <div className="flex flex-col w-full min-w-[300px] max-w-sm">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-1.5 rounded-lg shadow-sm border",
                        title === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-200 shadow-amber-100" :
                            title === 'Approved' ? "bg-green-50 text-green-600 border-green-200 shadow-green-100" :
                                "bg-red-50 text-red-600 border-red-200 shadow-red-100"
                    )}>
                        {icon}
                    </div>
                    <h3 className="font-bold text-sm tracking-tight text-foreground/80">{title}</h3>
                </div>
                <Badge variant="outline" className="text-[11px] font-bold px-2 py-0 h-6 bg-muted">
                    {requests.length}
                </Badge>
            </div>

            <div className="bg-muted/30 rounded-2xl p-3 space-y-3 min-h-[500px] border border-border/50">
                {requests.length > 0 ? requests.map(request => {
                    const canManage = checkCanManage(request);
                    const requesterWorker = workers?.find(w => w.id === request.workerId);
                    return (
                        <KanbanCard
                            key={request.id}
                            request={request}
                            onUpdateStatus={onUpdateStatus}
                            canManage={canManage}
                            onClick={onCardClick}
                            requesterWorker={requesterWorker}
                            isUpdating={isUpdating}
                        />
                    )
                }) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center space-y-2 opacity-40">
                        <div className="p-3 bg-muted rounded-full">
                            <Clock className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-medium">No {title.toLowerCase()} requests</p>
                    </div>
                )}
            </div>
        </div>
    )
}

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

            <ApprovalRequestDetailsDialog
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
