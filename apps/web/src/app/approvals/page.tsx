"use client";

import React, { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Button } from "@studio/ui";
import {
  LoaderCircle, GanttChartSquare, CheckCircle2, XCircle, Clock,
  Search, Filter, MoreHorizontal, SlidersHorizontal,
  LayoutList, LayoutGrid, KanbanSquare,
} from "lucide-react";
import { Input } from "@studio/ui";
import { cn } from "@/lib/utils";
import type { ApprovalRequest, Worker, Ministry } from "@studio/types";
import { useApprovals } from "@/hooks/use-approvals";
import { useWorkers } from "@/hooks/use-workers";
import { useMinistries } from "@/hooks/use-ministries";
import { useUserRole } from "@/hooks/use-user-role";
import { useApprovalMutations } from "@/hooks/use-approval-mutations";
import { ApprovalDetailsDialog } from "@/components/approvals/approval-details-dialog";
import { KanbanColumn } from "@/components/approvals/kanban-column";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@studio/ui";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@studio/ui";

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "Approved")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Approved
      </span>
    );
  if (status === "Rejected")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Rejected
      </span>
    );
  if (status === "Pending Admin Approval" || status === "Pending Incoming Approval")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Under Review
      </span>
    );
  // All other Pending*
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-black shrink-0">
      {init}
    </span>
  );
}

// ── Stat card (matches dashboard) ─────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, accentColor, iconClass, iconBgClass,
}: {
  label: string; value: number;
  icon: React.ElementType; accentColor: string;
  iconClass: string; iconBgClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-0 shadow-card-dark bg-card block h-full">
      <div className={cn("h-1.5 w-full", accentColor)} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-4">
              <span className="text-4xl sm:text-5xl font-black tracking-tight font-headline text-foreground leading-none">
                {value}
              </span>
            </div>
          </div>
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs", iconBgClass)}>
            <Icon className={cn("h-5 w-5", iconClass)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const { canManageApprovals, canApproveAllRequests, canApproveRoomReservation, workerProfile, isLoading: isRoleLoading, isSuperAdmin } = useUserRole();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);

  const { approvals: requests, isLoading: approvalsLoading } = useApprovals();
  const { workers, isLoading: workersLoading } = useWorkers();
  const { ministries, isLoading: ministriesLoading } = useMinistries();
  const { updateStatus, isUpdating } = useApprovalMutations();

  const isLoading = isRoleLoading || approvalsLoading || workersLoading || ministriesLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "completed">("all");
  const [viewMode, setViewMode] = useState<"table" | "cards" | "kanban">("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ action: "Approved" | "Rejected"; ids: string[] } | null>(null);

  // Role logic (unchanged from original)
  const filteredRequests = useMemo(() => {
    let results = [...(requests || [])] as ApprovalRequest[];
    const myMinistryIds = ministries
      ?.filter(m => m.headId === workerProfile?.id || m.approverId === workerProfile?.id)
      .map(m => m.id) ?? [];
    const isMinistryHead = myMinistryIds.length > 0;
    const isAdmin = isSuperAdmin || canApproveAllRequests;

    results = results.filter(r => {
      if (r.type === "Room Booking") {
        if (r.status === "Pending Ministry Approval") {
          if (isMinistryHead) {
            const tw = workers?.find(w => w.id === r.workerId);
            if (tw && (myMinistryIds.includes(tw.majorMinistryId) || myMinistryIds.includes(tw.minorMinistryId))) return true;
          }
          if (isAdmin) return true;
          return false;
        }
        if (r.status === "Pending Admin Approval") {
          if (isAdmin) return true;
          if (isMinistryHead) {
            const tw = workers?.find(w => w.id === r.workerId);
            if (tw && (myMinistryIds.includes(tw.majorMinistryId) || myMinistryIds.includes(tw.minorMinistryId))) return true;
          }
          return false;
        }
      }
      return true;
    });

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      results = results.filter(r =>
        r.requester.toLowerCase().includes(q) ||
        r.details.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "pending") results = results.filter(r => r.status.startsWith("Pending"));
      else if (statusFilter === "approved") results = results.filter(r => r.status === "Approved");
      else if (statusFilter === "rejected") results = results.filter(r => r.status === "Rejected");
      else if (statusFilter === "completed") results = results.filter(r => r.status === "Approved" || r.status === "Rejected");
    }

    return results.sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime());
  }, [requests, searchTerm, statusFilter, ministries, workerProfile, workers, isSuperAdmin, canApproveAllRequests]);

  const checkIsApprover = (request: ApprovalRequest) => {
    if (!workerProfile || !request.workerId) return false;
    const tw = workers?.find(w => w.id === request.workerId);
    if (!tw) return false;
    const maj = ministries?.find(m => m.id === tw.majorMinistryId);
    const min = ministries?.find(m => m.id === tw.minorMinistryId);
    return maj?.approverId === workerProfile.id || maj?.headId === workerProfile.id ||
      min?.approverId === workerProfile.id || min?.headId === workerProfile.id;
  };

  const checkCanManage = (request: ApprovalRequest) => {
    if (canApproveAllRequests || isSuperAdmin) return true;
    if (request.type === "Ministry Change") {
      if (!workerProfile) return false;
      if (request.status === "Pending Outgoing Approval") {
        const oldMaj = ministries.find(m => m.id === request.oldMajorId);
        const oldMin = ministries.find(m => m.id === request.oldMinorId);
        return !!(oldMaj?.headId === workerProfile.id || oldMaj?.approverId === workerProfile.id ||
          oldMin?.headId === workerProfile.id || oldMin?.approverId === workerProfile.id);
      }
      if (request.status === "Pending Incoming Approval") {
        const newMaj = ministries.find(m => m.id === request.newMajorId);
        const newMin = ministries.find(m => m.id === request.newMinorId);
        return !!(newMaj?.headId === workerProfile.id || newMaj?.approverId === workerProfile.id ||
          newMin?.headId === workerProfile.id || newMin?.approverId === workerProfile.id);
      }
    }
    if (request.type === "Room Booking") {
      if (request.status === "Pending Admin Approval") return canApproveAllRequests || isSuperAdmin;
      if (request.status === "Pending Ministry Approval") {
        const myIds = ministries?.filter(m => m.headId === workerProfile?.id || m.approverId === workerProfile?.id).map(m => m.id) ?? [];
        return myIds.length > 0 || canApproveAllRequests || isSuperAdmin;
      }
      return checkIsApprover(request);
    }
    return checkIsApprover(request);
  };

  const handleUpdateRequestStatus = (request: ApprovalRequest, status: "Approved" | "Rejected") => {
    if (!request.id || !checkCanManage(request)) return;
    if (request.type === "Room Booking" && status === "Approved") {
      if (request.status === "Pending Ministry Approval" || request.status === "Pending") {
        updateStatus({ request, status: "Pending Admin Approval" }); return;
      }
    }
    if (request.type === "Ministry Change" && status === "Approved") {
      if (request.status === "Pending Outgoing Approval") {
        updateStatus({ request, status: "Pending Incoming Approval", options: { outgoingApproved: true } }); return;
      }
    }
    updateStatus({ request, status });
  };

  // Bulk actions
  const handleBulkAction = (action: "Approved" | "Rejected") => {
    const ids = Array.from(selectedIds);
    setConfirmAction({ action, ids });
  };

  const executeBulkAction = () => {
    if (!confirmAction) return;
    confirmAction.ids.forEach(id => {
      const req = requests?.find(r => r.id === id);
      if (req && checkCanManage(req)) handleUpdateRequestStatus(req, confirmAction.action);
    });
    setSelectedIds(new Set());
    setConfirmAction(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)));
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const hasAnyApproverRole = ministries?.some(m => m.approverId === workerProfile?.id || m.headId === workerProfile?.id);
  const canViewPage = canManageApprovals || canApproveRoomReservation || hasAnyApproverRole;
  if (!canViewPage) {
    return (
      <AppLayout>
        <Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card>
      </AppLayout>
    );
  }

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(r => r.status.startsWith("Pending")).length || 0,
    approved: requests?.filter(r => r.status === "Approved").length || 0,
    rejected: requests?.filter(r => r.status === "Rejected").length || 0,
  };

  const statusCounts = {
    all: requests?.length || 0,
    pending: requests?.filter(r => r.status.startsWith("Pending")).length || 0,
    approved: requests?.filter(r => r.status === "Approved").length || 0,
    rejected: requests?.filter(r => r.status === "Rejected").length || 0,
    completed: requests?.filter(r => r.status === "Approved" || r.status === "Rejected").length || 0,
  };

  const pendingRequests = filteredRequests.filter(r => r.status.startsWith("Pending"));
  const approvedRequests = filteredRequests.filter(r => r.status === "Approved");
  const rejectedRequests = filteredRequests.filter(r => r.status === "Rejected");

  return (
    <AppLayout>
      <div className="space-y-7 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">Approvals</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Review and act on incoming requests across ministries, facilities, and operations.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests, requestors, IDs..."
                  className="pl-9 w-64 h-9 text-sm bg-card border-border/60 rounded-xl"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="h-9 px-3.5 flex items-center gap-2 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Requests" value={stats.total} icon={GanttChartSquare} accentColor="bg-primary" iconClass="text-primary" iconBgClass="bg-primary/10" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} accentColor="bg-amber-500" iconClass="text-amber-600" iconBgClass="bg-amber-50 dark:bg-amber-950/40" />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} accentColor="bg-emerald-500" iconClass="text-emerald-600" iconBgClass="bg-emerald-50 dark:bg-emerald-950/40" />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accentColor="bg-rose-500" iconClass="text-rose-500" iconBgClass="bg-rose-50 dark:bg-rose-950/40" />
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3 shadow-card-dark">
            <span className="text-sm font-semibold text-foreground">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("Approved")}
                className="h-8 px-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => handleBulkAction("Rejected")}
                className="h-8 px-4 flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
        )}

        {/* Table / Cards / Kanban container */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
            {/* Status filter tabs */}
            <div className="flex items-center gap-1">
              {(["all", "pending", "approved", "rejected", "completed"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    statusFilter === s
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                    statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {statusCounts[s]}
                  </span>
                </button>
              ))}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 border border-border/40">
              {([
                { key: "table", icon: LayoutList, label: "Table" },
                { key: "cards", icon: LayoutGrid, label: "Cards" },
                { key: "kanban", icon: KanbanSquare, label: "Kanban" },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors",
                    viewMode === key
                      ? "bg-card shadow-xs text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table View */}
          {viewMode === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/40">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Request ID</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Request</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Requestor</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ministry</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-20 text-center text-sm text-muted-foreground">
                        No requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(req => {
                      const worker = workers?.find(w => w.id === req.workerId);
                      const ministry = worker
                        ? ministries?.find(m => m.id === worker.majorMinistryId)
                        : null;
                      const isSelected = selectedIds.has(req.id);
                      const canManage = checkCanManage(req);
                      const isPending = req.status.startsWith("Pending");
                      const reqDate = req.date ? new Date(req.date as any) : null;

                      return (
                        <tr
                          key={req.id}
                          className={cn(
                            "border-b border-border/30 transition-colors cursor-pointer",
                            isSelected ? "bg-primary/5" : "hover:bg-muted/20"
                          )}
                          onClick={() => setSelectedRequest(req)}
                        >
                          <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelect(req.id); }}>
                            <input
                              type="checkbox"
                              className="rounded border-border"
                              checked={isSelected}
                              onChange={() => toggleSelect(req.id)}
                            />
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                            REQ-{req.id.slice(-4).toUpperCase()}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{req.details}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <Initials name={req.requester} />
                              <span className="text-sm font-semibold text-foreground whitespace-nowrap">{req.requester}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                            {ministry?.name || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                            {reqDate ? format(reqDate, "MMM d, yyyy") : "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md whitespace-nowrap">
                              {req.type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => setSelectedRequest(req)}>
                                  View Details
                                </DropdownMenuItem>
                                {canManage && isPending && (
                                  <>
                                    <DropdownMenuItem
                                      className="text-emerald-600"
                                      onClick={() => handleUpdateRequestStatus(req, "Approved")}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleUpdateRequestStatus(req, "Rejected")}
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-2" /> Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Cards View */}
          {viewMode === "cards" && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch auto-rows-fr">
              {filteredRequests.length === 0 ? (
                <p className="col-span-full py-16 text-center text-sm text-muted-foreground">No requests found.</p>
              ) : filteredRequests.map(req => {
                const canManage = checkCanManage(req);
                const isPending = req.status.startsWith("Pending");
                const reqDate = req.date ? new Date(req.date as any) : null;
                const worker = workers?.find(w => w.id === req.workerId);
                const ministry = worker ? ministries?.find(m => m.id === worker.majorMinistryId) : null;
                return (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col cursor-pointer hover:shadow-md transition-all h-full"
                    onClick={() => setSelectedRequest(req)}
                  >
                    {/* Top row: avatar + name/ministry + status badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Initials name={req.requester} />
                        <div>
                          <p className="text-sm font-bold text-foreground leading-tight">{req.requester}</p>
                          <p className="text-[11px] text-muted-foreground">{ministry?.name || "—"}</p>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    {/* Request ID + details */}
                    <div className="mt-3">
                      <p className="text-[10px] font-mono text-muted-foreground mb-0.5">REQ-{req.id.slice(-4).toUpperCase()}</p>
                      <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">{req.details}</p>
                    </div>

                    {/* Date */}
                    {reqDate && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {format(reqDate, "MMMM d, yyyy")}
                      </div>
                    )}

                    {/* Action buttons — always at bottom */}
                    <div className="mt-auto pt-3 border-t border-border/30 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {canManage && isPending ? (
                        <>
                          <button
                            onClick={() => handleUpdateRequestStatus(req, "Approved")}
                            className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleUpdateRequestStatus(req, "Rejected")}
                            className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          >
                            Details
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex justify-end">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Kanban View */}
          {viewMode === "kanban" && (
            <div className="p-5 overflow-x-auto">
              <div className="flex gap-4 min-w-[900px]">
                {([
                  { key: "pending",  label: "PENDING",      color: "text-amber-500",   bg: "bg-amber-50/60 dark:bg-amber-950/20",   border: "border-amber-200/60 dark:border-amber-800/40",  requests: filteredRequests.filter(r => r.status === "Pending" || r.status === "Pending Ministry Approval" || r.status === "Pending Outgoing Approval") },
                  { key: "review",   label: "UNDER REVIEW", color: "text-blue-500",    bg: "bg-blue-50/60 dark:bg-blue-950/20",     border: "border-blue-200/60 dark:border-blue-800/40",    requests: filteredRequests.filter(r => r.status === "Pending Admin Approval" || r.status === "Pending Incoming Approval") },
                  { key: "approved", label: "APPROVED",     color: "text-emerald-500", bg: "bg-emerald-50/60 dark:bg-emerald-950/20", border: "border-emerald-200/60 dark:border-emerald-800/40", requests: filteredRequests.filter(r => r.status === "Approved") },
                  { key: "rejected", label: "REJECTED",     color: "text-red-500",     bg: "bg-red-50/60 dark:bg-red-950/20",       border: "border-red-200/60 dark:border-red-800/40",      requests: filteredRequests.filter(r => r.status === "Rejected") },
                ] as const).map(col => (
                  <div key={col.key} className={cn("flex-1 rounded-2xl border p-4 flex flex-col gap-3 min-h-[300px]", col.bg, col.border)}>
                    {/* Column header */}
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-black uppercase tracking-widest", col.color)}>
                        {col.label}
                      </span>
                      <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors">
                        <span className="text-base leading-none">+</span>
                      </button>
                    </div>

                    {/* Cards */}
                    {col.requests.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground/50">No requests</p>
                      </div>
                    ) : col.requests.map(req => {
                      const worker = workers?.find(w => w.id === req.workerId);
                      const ministry = worker ? ministries?.find(m => m.id === worker.majorMinistryId) : null;
                      const canManage = checkCanManage(req);
                      const isPending = req.status.startsWith("Pending");
                      const reqDate = req.date ? new Date(req.date as any) : null;
                      return (
                        <div
                          key={req.id}
                          className="bg-card rounded-xl border border-border/50 p-3.5 flex flex-col gap-2.5 cursor-pointer hover:shadow-sm transition-all"
                          onClick={() => setSelectedRequest(req)}
                        >
                          {/* Avatar + name/ministry */}
                          <div className="flex items-center gap-2.5">
                            <Initials name={req.requester} />
                            <div>
                              <p className="text-sm font-bold text-foreground leading-tight">{req.requester}</p>
                              <p className="text-[11px] text-muted-foreground">{ministry?.name || "—"}</p>
                            </div>
                          </div>

                          {/* REQ ID + details */}
                          <div>
                            <p className="text-[10px] font-mono text-muted-foreground mb-0.5">REQ-{req.id.slice(-4).toUpperCase()}</p>
                            <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">{req.details}</p>
                          </div>

                          {/* Date */}
                          {reqDate && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {format(reqDate, "MMM d, yyyy")}
                            </div>
                          )}

                          {/* Actions */}
                          {canManage && isPending && (
                            <div className="flex gap-1.5 pt-1 border-t border-border/30" onClick={e => e.stopPropagation()}>
                              <button onClick={() => handleUpdateRequestStatus(req, "Approved")} className="flex-1 h-7 flex items-center justify-center gap-1 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </button>
                              <button onClick={() => handleUpdateRequestStatus(req, "Rejected")} className="flex-1 h-7 flex items-center justify-center gap-1 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                <XCircle className="h-3 w-3" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={open => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {confirmAction?.action}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmAction?.action?.toLowerCase()} {confirmAction?.ids.length} selected request(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.action === "Rejected" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={executeBulkAction}
            >
              Yes, {confirmAction?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ApprovalDetailsDialog
        request={selectedRequest}
        open={!!selectedRequest}
        requesterWorker={workers?.find(w => w.id === selectedRequest?.workerId)}
        onOpenChange={open => { if (!open) setSelectedRequest(null); }}
      />
    </AppLayout>
  );
}
