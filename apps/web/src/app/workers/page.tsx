"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Sheet, SheetContent } from "@studio/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import {
  MoreHorizontal, PlusCircle, LoaderCircle, Upload, Download,
  LogIn, Users, UserCheck, UserX, Users2, Building2, Mail,
  Trash2, ArrowRightLeft, X, Ticket, Search, SlidersHorizontal,
  ShieldCheck, UserCog,
} from "lucide-react";
import { subDays, formatDistanceToNow } from "date-fns";
import { getWeeklyWeekdayCount, getSundayCount } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@studio/ui";
import { Input } from "@studio/ui";
import type { Worker, Role, Ministry } from "@studio/types";
import { useAuthStore } from "@studio/store";
import { supabase } from "@studio/database";
import { useWorkers, useWorkerStats } from "@/hooks/use-workers";
import { useRoles } from "@/hooks/use-roles";
import { useMinistries } from "@/hooks/use-ministries";
import { useDepartments } from "@/hooks/use-departments";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useImpersonation } from "@/hooks/use-impersonation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { useApprovals } from "@/hooks/use-approvals";
import {
  updateWorkersMinistries,
  createMealStub as createMealStubSql,
  deleteWorker as deleteWorkerSql,
  deleteWorkers as deleteWorkersSql,
  createApproval as createApprovalSql,
} from "@/actions/db";
import { ImportSheet } from "@/components/workers/import-sheet";
import { BatchMinistrySheet } from "@/components/workers/batch-ministry-sheet";
import { BatchMealStubSheet } from "@/components/workers/batch-meal-stub-sheet";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────
function WorkerInitials({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-[11px] font-black shrink-0">
      {init}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Active")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
      </span>
    );
  if (status === "Inactive")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Inactive
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const lower = role.toLowerCase();
  if (lower.includes("admin"))
    return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">{role}</span>;
  if (lower.includes("head") || lower.includes("pastor") || lower.includes("ministry"))
    return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{role}</span>;
  return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">{role}</span>;
}

function StatCard({ label, value, icon: Icon, accentColor, iconClass, iconBgClass }: {
  label: string; value: number;
  icon: React.ElementType; accentColor: string;
  iconClass: string; iconBgClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-0 shadow-card-dark bg-card h-full">
      <div className={cn("h-1.5 w-full", accentColor)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-3">
              <span className="text-4xl font-black tracking-tight font-headline text-foreground leading-none">{value}</span>
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

const formatWorkerId = (id: string | null | undefined) => {
  if (!id) return "—";
  const num = parseInt(id, 10);
  return isNaN(num) ? id : `COG-${String(num).padStart(4, "0")}`;
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { workerProfile, canManageWorkers, isSuperAdmin, allRoles, isLoading: isRoleLoading } = useUserRole();
  const { startImpersonation } = useImpersonation();
  const { logAction } = useAuditLog();
  const { isMealStubAssigner, canManageAllMealStubs } = useUserRole();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"workerId" | "name">("name");
  const [sortField, setSortField] = useState("workerId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  React.useEffect(() => {
    const timer = setTimeout(() => { setSearchQuery(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setCurrentPage(1);
  };

  const { workers: allWorkers, pagination, isLoading: workersLoading,
    updateWorker: updateWorkerSql, createWorker: createWorkerSql,
    deleteWorker: deleteWorkerSqlMut, deleteWorkers: deleteWorkersSqlMut,
  } = useWorkers({ page: currentPage, limit: itemsPerPage, search: searchQuery, searchMode, sortField, sortDir });

  const { ministries, isLoading: ministriesLoading } = useMinistries();
  const { roles, isLoading: rolesLoading } = useRoles();
  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);
  const { mealStubs: allMealStubs } = useMealStubs({ dateFrom: thirtyDaysAgo });
  const { createApproval: createApprovalSqlHook } = useApprovals();
  const { departments: allDepartments, isLoading: departmentsLoading } = useDepartments();

  const isLoading = rolesLoading || ministriesLoading || isRoleLoading || departmentsLoading;

  const explicitlyAssignedDepartment = useMemo(() => {
    if (!workerProfile?.id || !allDepartments) return null;
    return (allDepartments as any[]).find(d => d.headId === workerProfile.id) || null;
  }, [workerProfile, allDepartments]);

  const isDepartmentHead = useMemo(() => {
    if (explicitlyAssignedDepartment) return true;
    if (!workerProfile?.roleId || !roles.length) return false;
    return (roles.find(r => r.id === workerProfile.roleId)?.name || "").toLowerCase().includes("department head");
  }, [workerProfile, roles, explicitlyAssignedDepartment]);

  const userDepartment = useMemo(() => {
    if (explicitlyAssignedDepartment) return explicitlyAssignedDepartment.id;
    if (!workerProfile?.majorMinistryId || !ministries.length) return null;
    return ministries.find(m => m.id === workerProfile.majorMinistryId)?.department || null;
  }, [workerProfile, ministries, explicitlyAssignedDepartment]);

  const departmentMinistries = useMemo(() => {
    if (!isDepartmentHead || !userDepartment) return [];
    return ministries.filter(m => m.department === userDepartment);
  }, [isDepartmentHead, userDepartment, ministries]);

  const { data: statsData } = useWorkerStats(
    isSuperAdmin || (canManageWorkers && !workerProfile?.majorMinistryId) ? undefined :
      isDepartmentHead ? departmentMinistries.map(m => m.id) :
        [workerProfile?.majorMinistryId, workerProfile?.minorMinistryId].filter(Boolean) as string[]
  );

  const workers = allWorkers;

  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isBatchMoveSheetOpen, setIsBatchMoveSheetOpen] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [isBatchMealStubSheetOpen, setIsBatchMealStubSheetOpen] = useState(false);
  const [isAssigningStubs, setIsAssigningStubs] = useState(false);

  const handleAddNew = () => router.push("/workers/new");
  const handleEdit = (worker: Worker) => router.push(`/workers/${worker.id}/edit`);

  const handlePasswordReset = async (worker: Worker) => {
    if (!worker.email) { toast({ variant: "destructive", title: "No email found" }); return; }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(worker.email, { redirectTo: `${window.location.origin}/auth/update-password` });
      if (error) throw error;
      toast({ title: "Reset link sent", description: `Sent to ${worker.email}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    }
  };

  const handleImpersonate = (worker: Worker) => {
    toast({ title: "Impersonation Started", description: `Viewing as ${worker.firstName} ${worker.lastName}.` });
    startImpersonation(worker.id);
  };

  const handleDelete = async (workerId: string) => {
    const w = allWorkers?.find(w => w.id === workerId);
    try {
      await deleteWorkerSqlMut(workerId);
      if (w) await logAction("Deleted Worker", "Workers", `Removed ${w.firstName} ${w.lastName}`, workerId, `${w.firstName} ${w.lastName}`);
      toast({ title: "Worker Deleted" });
    } catch { toast({ variant: "destructive", title: "Delete Failed" }); }
  };

  const handleBatchDelete = async () => {
    try {
      await deleteWorkersSqlMut(selectedWorkerIds);
      await logAction("Batch Deleted Workers", "Workers", `Deleted ${selectedWorkerIds.length} workers.`);
      toast({ title: "Batch Delete Successful", description: `${selectedWorkerIds.length} workers removed.` });
      setSelectedWorkerIds([]); setIsBatchDeleteDialogOpen(false);
    } catch { toast({ variant: "destructive", title: "Batch Delete Failed" }); }
  };

  const handleBatchMove = async (major: string, minor: string) => {
    try {
      if (!isSuperAdmin) {
        const promises = selectedWorkerIds.map(async id => {
          const w = allWorkers?.find(worker => worker.id === id);
          if (!w) return;
          const newMajorId = major === "unchanged" ? w.majorMinistryId || "" : major === "none" ? "" : major;
          const newMinorId = minor === "unchanged" ? w.minorMinistryId || "" : minor === "none" ? "" : minor;
          if (newMajorId === (w.majorMinistryId || "") && newMinorId === (w.minorMinistryId || "")) return;
          const details = `Batch ministry change for ${w.firstName} ${w.lastName}.`;
          return createApprovalSqlHook({ requester: `${workerProfile?.firstName} ${workerProfile?.lastName}`, type: "Ministry Change", details, status: "Pending Outgoing Approval", workerId: w.id, oldMajorId: w.majorMinistryId || "", newMajorId, oldMinorId: w.minorMinistryId || "", newMinorId, outgoingApproved: false, incomingApproved: false });
        });
        await Promise.all(promises);
        toast({ title: "Changes Pending Approval" });
      } else {
        const majorVal = major === "unchanged" ? undefined : major === "none" ? "" : major;
        const minorVal = minor === "unchanged" ? undefined : minor === "none" ? "" : minor;
        await updateWorkersMinistries(selectedWorkerIds, majorVal, minorVal);
        toast({ title: "Batch Update Successful", description: `Updated ${selectedWorkerIds.length} workers.` });
      }
      setSelectedWorkerIds([]); setIsBatchMoveSheetOpen(false);
    } catch { toast({ variant: "destructive", title: "Batch Update Failed" }); }
  };

  const handleBatchMealStub = async (type: "weekday" | "sunday", count: number) => {
    if (isAssigningStubs) return;
    setIsAssigningStubs(true);
    let totalIssued = 0; let skipped = 0;
    try {
      const promises = selectedWorkerIds.map(async id => {
        const w = allWorkers?.find(worker => worker.id === id);
        if (!w) return;
        const allStubs = allMealStubs || [];
        const current = getWeeklyWeekdayCount(allStubs, id) + getSundayCount(allStubs, id);
        const ministry = ministries.find(m => m.id === w.majorMinistryId || m.id === w.minorMinistryId);
        const limit = (ministry as any)?.mealStubWeeklyLimit || 7;
        const remaining = limit - current;
        if (remaining <= 0) { skipped++; return; }
        const toIssue = Math.min(count, remaining);
        for (let i = 0; i < toIssue; i++) {
          await createMealStubSql({ workerId: id as any, workerName: `${w.firstName} ${w.lastName}`, status: "Issued", assignedBy: workerProfile?.id, assignedByName: `${workerProfile?.firstName} ${workerProfile?.lastName}`, stubType: type });
          totalIssued++;
        }
      });
      await Promise.all(promises);
      toast({ title: "Batch Stubs Issued", description: `Issued ${totalIssued} stubs.${skipped > 0 ? ` ${skipped} skipped.` : ""}` });
      setIsBatchMealStubSheetOpen(false); setSelectedWorkerIds([]);
    } catch { toast({ variant: "destructive", title: "Batch Assignment Failed" }); }
    finally { setIsAssigningStubs(false); }
  };

  const toggleSelectAll = (currentWorkers: Worker[]) => {
    if (selectedWorkerIds.length === currentWorkers.length && currentWorkers.length > 0) setSelectedWorkerIds([]);
    else setSelectedWorkerIds(currentWorkers.map(w => w.id));
  };
  const toggleSelectWorker = (id: string) => setSelectedWorkerIds(prev => prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]);

  const handleImportWorkers = (csvData: string) => {
    Papa.parse(csvData, {
      header: true, skipEmptyLines: true,
      complete: async results => {
        const newWorkers = results.data;
        if (newWorkers.length === 0) { toast({ variant: "destructive", title: "No Data Found" }); return; }
        try {
          let approvalCount = 0; let importedCount = 0;
          for (let index = 0; index < newWorkers.length; index++) {
            const nw = newWorkers[index] as any;
            if (!nw.firstName || !nw.lastName || !nw.email) continue;
            const workerId = String(100000 + (allWorkers?.length || 0) + index).slice(-6);
            const created = await createWorkerSql({ firstName: nw.firstName || "", lastName: nw.lastName || "", email: nw.email || "", phone: nw.phone || "", roleId: nw.roleId || "viewer", status: nw.status || "Pending Approval", majorMinistryId: nw.majorMinistryId || "", minorMinistryId: nw.minorMinistryId || "", employmentType: nw.employmentType || "Volunteer", workerId, avatarUrl: `https://picsum.photos/seed/${workerId}/100/100` });
            importedCount++;
            if ((nw.status || "Pending Approval") === "Pending Approval") {
              approvalCount++;
              await createApprovalSqlHook({ requester: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : "System Import", type: "New Worker", details: `New worker import: ${nw.email}`, status: "Pending", workerId: created.id });
            }
          }
          toast({ title: "Import Successful", description: `${importedCount} workers imported.` });
          setIsImportSheetOpen(false);
        } catch { toast({ variant: "destructive", title: "Import Failed" }); }
      },
    });
  };

  const getRoleName = (roleId?: string | null) => {
    if (!roleId) return "Worker";
    return roles.find(r => r.id === roleId)?.name || "Worker";
  };

  const getWorkerRoleLabel = (worker: Worker) => {
    if ((worker as any).roles?.length > 0) return (worker as any).roles.map((wr: any) => wr.role?.name ?? wr.roleId).join(", ");
    return getRoleName(worker.roleId);
  };

  // Stats
  const { totalWorkers, totalActive, totalInactive, totalSecondary } = useMemo(() => {
    if (!statsData) return { totalWorkers: 0, totalActive: 0, totalInactive: 0, totalSecondary: 0 };
    return { totalWorkers: statsData.total, totalActive: statsData.active, totalInactive: statsData.inactive, totalSecondary: statsData.secondary };
  }, [statsData]);

  // New this month
  const newThisMonth = useMemo(() => {
    const now = new Date();
    return allWorkers.filter(w => {
      if (!w.createdAt) return false;
      const d = new Date(w.createdAt as any);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [allWorkers]);

  // Ministry distribution chart data
  const ministryChartData = useMemo(() => {
    if (!allWorkers || !ministries) return [];
    const counts: Record<string, number> = {};
    allWorkers.forEach(w => {
      const min = ministries.find(m => m.id === w.majorMinistryId);
      if (min) counts[min.name] = (counts[min.name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [allWorkers, ministries]);

  // Ministry heads count
  const ministryHeadsCount = useMemo(() => {
    return allWorkers.filter(w => {
      const roleName = getWorkerRoleLabel(w).toLowerCase();
      return roleName.includes("head") || roleName.includes("pastor") || ministries.some(m => m.headId === w.id);
    }).length;
  }, [allWorkers, ministries]);

  // Admins count
  const adminsCount = useMemo(() => {
    return allWorkers.filter(w => getWorkerRoleLabel(w).toLowerCase().includes("admin")).length;
  }, [allWorkers]);

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  if (!canManageWorkers) {
    return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-7 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">Workers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor workforce, assign roles and ministries, and register new workers.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests, requestors, IDs..."
                className="pl-9 w-64 h-9 text-sm bg-card border-border/60 rounded-xl"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsImportSheetOpen(true)}
              className="h-9 px-3.5 flex items-center gap-2 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
            >
              <Upload className="h-4 w-4 text-muted-foreground" /> Import
            </button>
            <button
              className="h-9 px-3.5 flex items-center gap-2 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
            >
              <Download className="h-4 w-4 text-muted-foreground" /> Export
            </button>
            <button
              onClick={handleAddNew}
              className="h-9 px-4 flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4" /> Add Worker
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Workers" value={totalWorkers} icon={Users} accentColor="bg-primary" iconClass="text-primary" iconBgClass="bg-primary/10" />
          <StatCard label="Ministry Heads" value={ministryHeadsCount} icon={ShieldCheck} accentColor="bg-emerald-500" iconClass="text-emerald-600" iconBgClass="bg-emerald-50 dark:bg-emerald-950/40" />
          <StatCard label="Admins" value={adminsCount} icon={UserCog} accentColor="bg-orange-400" iconClass="text-orange-500" iconBgClass="bg-orange-50 dark:bg-orange-950/40" />
          <StatCard label="New This Month" value={newThisMonth} icon={PlusCircle} accentColor="bg-amber-400" iconClass="text-amber-500" iconBgClass="bg-amber-50 dark:bg-amber-950/40" />
        </div>

        {/* Ministry Distribution Chart */}
        {ministryChartData.length > 0 && (
          <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-6">
            <h2 className="text-base font-bold text-foreground mb-0.5">Ministry Distribution</h2>
            <p className="text-xs text-muted-foreground mb-5">Workers per ministry.</p>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ministryChartData} margin={{ top: 4, right: 4, left: -20, bottom: 5 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280" }}
                    interval={0}
                  />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "12px" }}
                    cursor={{ fill: "rgba(99,102,241,0.06)" }}
                  />
                  <Bar dataKey="count" name="Workers" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters + Bulk Bar */}
        <div className="flex items-center justify-end">
          <button className="h-9 px-3.5 flex items-center gap-2 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" /> Filters
          </button>
        </div>

        {selectedWorkerIds.length > 0 && (
          <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3 shadow-card-dark">
            <span className="text-sm font-semibold text-foreground">{selectedWorkerIds.length} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsBatchMoveSheetOpen(true)} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition-colors">
                <UserCog className="h-3.5 w-3.5" /> Change Role
              </button>
              <button onClick={() => setIsBatchMoveSheetOpen(true)} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                <Building2 className="h-3.5 w-3.5" /> Assign Ministry
              </button>
              <button onClick={() => setIsBatchDeleteDialogOpen(true)} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                <UserX className="h-3.5 w-3.5" /> Deactivate
              </button>
              <button onClick={() => setSelectedWorkerIds([])} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border/60 text-muted-foreground text-xs font-semibold hover:bg-muted/40 transition-colors">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 border-b border-border/40">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={workers.length > 0 && workers.every(w => selectedWorkerIds.includes(w.id))}
                      onChange={() => toggleSelectAll(workers)}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("name")}>
                    Worker {sortField === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("workerId")}>
                    Worker ID {sortField === "workerId" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ministry</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Contact</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("status")}>
                    Status {sortField === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Registered</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {workersLoading ? (
                  <tr><td colSpan={10} className="py-16 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
                ) : workers.length === 0 ? (
                  <tr><td colSpan={10} className="py-16 text-center text-sm text-muted-foreground">No workers found.</td></tr>
                ) : workers.map(worker => {
                  const ministry = ministries.find(m => m.id === worker.majorMinistryId);
                  const isSelected = selectedWorkerIds.includes(worker.id);
                  const roleLabel = getWorkerRoleLabel(worker);
                  const registeredDate = worker.createdAt ? new Date(worker.createdAt as any) : null;

                  return (
                    <tr
                      key={worker.id}
                      className={cn("border-b border-border/30 transition-colors", isSelected ? "bg-primary/5" : "hover:bg-muted/20")}
                    >
                      <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelectWorker(worker.id); }}>
                        <input type="checkbox" className="rounded border-border" checked={isSelected} onChange={() => toggleSelectWorker(worker.id)} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <WorkerInitials name={`${worker.firstName} ${worker.lastName}`} avatarUrl={worker.avatarUrl} />
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">{worker.firstName} {worker.lastName}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{worker.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {formatWorkerId(worker.workerId)}
                      </td>
                      <td className="px-4 py-3.5">
                        <RoleBadge role={roleLabel} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        {ministry?.name || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        {worker.employmentType || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        {worker.phone || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={worker.status} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        {registeredDate ? registeredDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={() => setTimeout(() => handleEdit(worker), 100)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setTimeout(() => handlePasswordReset(worker), 100)}>
                              <Mail className="mr-2 h-4 w-4" /> Send Reset Link
                            </DropdownMenuItem>
                            {worker.id !== user?.uid && (
                              <DropdownMenuItem onSelect={() => setTimeout(() => handleImpersonate(worker), 100)}>
                                <LogIn className="mr-2 h-4 w-4" /> Impersonate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => setTimeout(() => handleDelete(worker.id), 100)} className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="px-6 py-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total.toLocaleString()} workers
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors">
                  ‹
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (pagination.totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum + (5 - i) > pagination.totalPages) pageNum = pagination.totalPages - 4 + i;
                  }
                  if (pageNum <= 0 || pageNum > pagination.totalPages) return null;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                      className={cn("h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all",
                        currentPage === pageNum ? "bg-primary text-primary-foreground shadow-xs" : "border border-border text-foreground hover:bg-muted"
                      )}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors">
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sheets & Dialogs */}
      <Sheet open={isImportSheetOpen} onOpenChange={setIsImportSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <ImportSheet onImport={handleImportWorkers} onClose={() => setIsImportSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {selectedWorkerIds.length} worker profile(s). This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Workers</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isBatchMoveSheetOpen} onOpenChange={setIsBatchMoveSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <BatchMinistrySheet selectedCount={selectedWorkerIds.length} ministries={ministries} onSave={handleBatchMove} onClose={() => setIsBatchMoveSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={isBatchMealStubSheetOpen} onOpenChange={setIsBatchMealStubSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <BatchMealStubSheet selectedCount={selectedWorkerIds.length} onSave={handleBatchMealStub} onClose={() => setIsBatchMealStubSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
