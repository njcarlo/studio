"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@studio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@studio/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@studio/ui";
import { Input } from "@studio/ui";
import { Label } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@studio/ui";import {
    ArrowLeft, LoaderCircle, UserPlus, X, LayoutTemplate,
    CheckCircle2, Circle, ChevronDown, ChevronUp, Plus, Trash2,
    Send, ShieldCheck, AlertTriangle, Globe, GlobeLock, Printer, History, CalendarClock,
} from "lucide-react";
import { useServiceSchedule, useServiceTemplates, useScheduleHistory, useWorshipSlots } from "@/hooks/use-schedule";
import { useMinistries } from "@/hooks/use-ministries";
import { useWorkersLite } from "@/hooks/use-workers";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { findWorkerByWorkerId, getEligibleWorkers } from "@/actions/schedule";
import { useQuery } from "@tanstack/react-query";
import { getWorkloadCategories, createWorkloadCategory } from "@/actions/ministry-categories";
import { WorkloadCategorySelect } from "@/components/schedule/WorkloadCategorySelect";
import WorkerSearchDropdown from "@/components/WorkerSearchDropdown";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export default function ScheduleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const { canManageSchedule, canConfirmSchedule, canAssignSchedulers, canViewAllSchedules, workerProfile } = useUserRole();

    const { schedule, isLoading, upsertAssignment, isAssigning, deleteAssignment, applyTemplate, isApplyingTemplate, publishSchedule, isPublishing, confirmAssignment, confirmationStatus, monthlyDuties, conflicts, togglePublic, setAttendanceStatus, reassignAssignment } = useServiceSchedule(id);
    const { ministries } = useMinistries();
    const { data: workers = [] } = useWorkersLite(); // avatar lookups only — search uses getEligibleWorkers
    const { templates, isLoading: templatesLoading } = useServiceTemplates();
    const { data: history } = useScheduleHistory(activeTab === "history");
    const { slots: worshipSlots, createSlot, deleteSlot, addWorker: addWorshipWorker, removeWorker: removeWorshipWorker } = useWorshipSlots(id);

    // O(1) avatar lookup — avoids workers.find() per rendered slot
    const workerById = useMemo(() => new Map((workers ?? []).map((w: any) => [w.id, w])), [workers]);

    const [activeTab, setActiveTab] = useState("assignments");
    const [expandedMinistries, setExpandedMinistries] = useState<Set<string>>(new Set());
    const [assignDialog, setAssignDialog] = useState<{ assignmentId: string; ministryId: string; roleName: string; reassign?: boolean; relatedSlots?: { id: string; workerName: string | null }[] } | null>(null);
    const [recentlyAssignedIds, setRecentlyAssignedIds] = useState<Set<string>>(new Set());
    const [workerSearch, setWorkerSearch] = useState("");
    const [workerIdSearch, setWorkerIdSearch] = useState("");
    const [workerIdResult, setWorkerIdResult] = useState<any>(null);
    const [workerIdSearching, setWorkerIdSearching] = useState(false);
    const [applyTemplateDialog, setApplyTemplateDialog] = useState<string | null>(null); // ministryId
    const [addRoleDialog, setAddRoleDialog] = useState<string | null>(null); // ministryId
    const [addMinistryDialogOpen, setAddMinistryDialogOpen] = useState(false);
    const [selectedMinistryIds, setSelectedMinistryIds] = useState<Set<string>>(new Set());
    // Ministries added to this view locally (no role yet, so no ScheduleAssignment row exists)
    const [addedMinistryIds, setAddedMinistryIds] = useState<Set<string>>(new Set());
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleWorkerId, setNewRoleWorkerId] = useState<string | null>(null);
    const [rehearsalDialog, setRehearsalDialog] = useState<{ assignmentId: string, date: string, time: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [assigningWorkerId, setAssigningWorkerId] = useState<string | null>(null);

    // Worship slot state
    const [newSlotName, setNewSlotName] = useState("");
    const [newSlotMinistryId, setNewSlotMinistryId] = useState<string>("");
    const [addSlotOpen, setAddSlotOpen] = useState(false);
    const [slotAssignDialog, setSlotAssignDialog] = useState<{ slotId: string; slotName: string } | null>(null);
    const [slotWorkerSearch, setSlotWorkerSearch] = useState("");

    // Group assignments by ministry
    const byMinistry = useMemo(() => {
        if (!schedule) return {} as Record<string, NonNullable<typeof schedule>['assignments']>;
        return schedule.assignments.reduce<Record<string, typeof schedule.assignments>>((acc: Record<string, typeof schedule.assignments>, a: (typeof schedule.assignments)[0]) => {
            if (!acc[a.ministryId]) acc[a.ministryId] = [];
            acc[a.ministryId].push(a);
            return acc;
        }, {});
    }, [schedule]);

    const getMinistryName = (id: string) => {
        const name = ministries.find(m => m.id === id)?.name || id;
        return name.replace(/^[WORDA]-/i, '');
    };

    const ministryIds = Object.keys(byMinistry);
    const allMinistryIds = useMemo(() => {
        const fromAssignments = new Set([...ministryIds, ...addedMinistryIds]);
        let ids = [...fromAssignments];
        if (!canViewAllSchedules && canManageSchedule && workerProfile?.majorMinistryId) {
            ids = ids.filter(id => id === workerProfile.majorMinistryId || id === workerProfile.minorMinistryId);
        }
        return ids.sort((a, b) => getMinistryName(a).localeCompare(getMinistryName(b)));
    }, [ministryIds, canManageSchedule, canViewAllSchedules, workerProfile, ministries]);

    const ministriesByDepartment = useMemo(() => {
        const grouped: Record<string, string[]> = {};
        allMinistryIds.forEach(id => {
            const m = ministries.find((x: any) => x.id === id);
            const deptName = (m as any)?.department || "Other";
            if (!grouped[deptName]) grouped[deptName] = [];
            grouped[deptName].push(id);
        });
        
        // Sort keys to maintain a consistent order (Worship first maybe, or just alphabetical)
        return Object.keys(grouped).sort().reduce((acc, key) => {
            acc[key] = grouped[key];
            return acc;
        }, {} as Record<string, string[]>);
    }, [allMinistryIds, ministries]);

    const unselectedMinistriesByDept = useMemo(() => {
        const grouped: Record<string, typeof ministries> = {};
        ministries
            .filter((m: any) => !allMinistryIds.includes(m.id))
            .forEach((m: any) => {
                const deptName = m.department || "Other";
                if (!grouped[deptName]) grouped[deptName] = [];
                grouped[deptName].push(m);
            });
            
        return Object.keys(grouped).sort().reduce((acc, key) => {
            acc[key] = grouped[key];
            return acc;
        }, {} as Record<string, typeof ministries>);
    }, [allMinistryIds, ministries]);

    // Workers scoped to Worship department for slot assignment (used in slot cards display only)
    const worshipWorkers = useMemo(() => {
        return workers.filter((w: any) => {
            if (w.status !== 'Active') return false;
            const m = ministries.find((x: any) => x.id === w.majorMinistryId);
            return (m as any)?.departmentCode === 'W';
        });
    }, [workers, ministries]);

    const toggleMinistry = (id: string) => {
        setExpandedMinistries(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // Server-side scored worker search — replaces client-side filteredWorkers scoring over 6000 rows.
    const { data: filteredWorkers = [] } = useQuery({
        queryKey: ['eligible-workers', assignDialog?.ministryId, workerSearch],
        queryFn: () => getEligibleWorkers({ ministryId: assignDialog!.ministryId, query: workerSearch, date: schedule?.date ? new Date(schedule.date) : undefined }),
        enabled: !!assignDialog?.ministryId,
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

    const handleAssign = async (workerId: string | null, targetSlotIds?: string[]) => {
        if (!assignDialog) return;
        const worker = workerId ? (workerById.get(workerId) as any) : null;
        const workerName = worker ? `${worker.firstName} ${worker.lastName}` : null;

        // Conflict check — warn if worker already assigned to another ministry
        if (workerId && schedule) {
            const existingSlot = schedule.assignments.find(
                (a: any) => a.workerId === workerId && a.ministryId !== assignDialog.ministryId
            );
            if (existingSlot) {
                toast({
                    variant: "destructive",
                    title: "Conflict detected",
                    description: `${workerName ?? "This worker"} is already assigned as ${existingSlot.roleName} in ${getMinistryName(existingSlot.ministryId)} for this service.`,
                });
            }
        }

        setAssigningWorkerId(workerId ?? "__clear__");
        try {
            if (assignDialog.reassign && workerId) {
                await reassignAssignment({
                    assignmentId: assignDialog.assignmentId,
                    newWorkerId: workerId,
                    newWorkerName: workerName ?? '',
                });
                toast({ title: "Reassigned", description: "The replacement has been notified to confirm." });
                setAssignDialog(null);
                return;
            }

            // Multi-slot support: assign to all selected slot IDs, or just the primary one.
            const slotIds = targetSlotIds?.length ? targetSlotIds : [assignDialog.assignmentId];
            await Promise.all(slotIds.map(slotId =>
                upsertAssignment({
                    id: slotId,
                    scheduleId: id,
                    ministryId: assignDialog.ministryId,
                    roleName: assignDialog.roleName,
                    workerId: workerId ?? null,
                    workerName,
                    order: schedule?.assignments.findIndex((a: any) => a.id === slotId) ?? 0,
                })
            ));

            // Flash the assigned slot rows green for 2 seconds.
            const assigned = new Set(slotIds);
            setRecentlyAssignedIds(assigned);
            setTimeout(() => setRecentlyAssignedIds(prev => {
                const next = new Set(prev);
                slotIds.forEach(sid => next.delete(sid));
                return next;
            }), 2000);

            const label = slotIds.length > 1 ? `${slotIds.length} slots assigned` : workerId ? "Worker assigned" : "Assignment cleared";
            toast({ title: label });
            setAssignDialog(null);
        } catch {
            toast({ variant: "destructive", title: assignDialog.reassign ? "Failed to reassign" : "Failed to assign" });
        } finally {
            setAssigningWorkerId(null);
        }
    };

    const handleAddRole = async () => {
        if (!addRoleDialog || !newRoleName.trim()) return;
        setIsSaving(true);
        try {
            const roleNameStr = newRoleName.trim();
            const callerId = workerProfile?.id || '';
            const existingCategories = await getWorkloadCategories(addRoleDialog);
            if (!existingCategories.some((c: any) => c.name.toLowerCase() === roleNameStr.toLowerCase())) {
                try {
                    await createWorkloadCategory({ ministryId: addRoleDialog, name: roleNameStr });
                } catch (e) {
                    console.error("Failed to auto-create category", e);
                }
            }

            await upsertAssignment({
                scheduleId: id,
                ministryId: addRoleDialog,
                roleName: roleNameStr,
                workerId: newRoleWorkerId ?? null,
                workerName: newRoleWorkerId ? workers.find((w: any) => w.id === newRoleWorkerId)?.firstName + ' ' + workers.find((w: any) => w.id === newRoleWorkerId)?.lastName : null,
                order: (byMinistry[addRoleDialog]?.length ?? 0),
            });
            toast({ title: "Role slot added" });
            setAddedMinistryIds(prev => {
                if (!prev.has(addRoleDialog)) return prev;
                const next = new Set(prev);
                next.delete(addRoleDialog);
                return next;
            });
            setAddRoleDialog(null);
            setNewRoleName("");
            setNewRoleWorkerId(null);
        } catch {
            toast({ variant: "destructive", title: "Failed to add role" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleApplyTemplate = async (templateId: string) => {
        try {
            await applyTemplate({ templateId });
            toast({ title: "Template applied" });
            setApplyTemplateDialog(null);
        } catch {
            toast({ variant: "destructive", title: "Failed to apply template" });
        }
    };

    const handlePublish = async () => {
        try {
            const result = await publishSchedule({ publishedBy: workerProfile?.id || user?.uid || 'system' });
            toast({ title: `Schedule published — ${result.notified} worker(s) notified by email` });
        } catch {
            toast({ variant: "destructive", title: "Failed to publish" });
        }
    };

    const handleWorkerIdSearch = async () => {
        if (!workerIdSearch.trim()) return;
        setWorkerIdSearching(true);
        setWorkerIdResult(null);
        try {
            const w = await findWorkerByWorkerId(workerIdSearch.trim());
            setWorkerIdResult(w || 'not_found');
        } finally {
            setWorkerIdSearching(false);
        }
    };

    const handleConfirmAssignment = async (assignmentId: string) => {
        try {
            await confirmAssignment({ assignmentId, confirmedBy: workerProfile?.id || user?.uid || 'system' });
            toast({ title: "Assignment confirmed" });
        } catch {
            toast({ variant: "destructive", title: "Failed to confirm" });
        }
    };

    const handleSlotTypeChange = async (slot: any, slotType: string) => {
        try {
            await upsertAssignment({
                id: slot.id,
                scheduleId: id,
                ministryId: slot.ministryId,
                roleName: slot.roleName,
                workerId: slot.workerId,
                workerName: slot.workerName,
                slotType,
            });
        } catch {
            toast({ variant: "destructive", title: "Failed to update slot type" });
        }
    };

    const handleSaveRehearsal = async () => {
        if (!rehearsalDialog) return;
        setIsSaving(true);
        try {
            const assignment = schedule?.assignments.find((a: any) => a.id === rehearsalDialog.assignmentId);
            if (assignment) {
                await upsertAssignment({
                    scheduleId: id,
                    ministryId: assignment.ministryId,
                    roleName: assignment.roleName,
                    workerId: assignment.workerId,
                    workerName: assignment.workerName,
                    notes: assignment.notes,
                    rehearsalDate: rehearsalDialog.date ? new Date(rehearsalDialog.date) : null,
                    rehearsalTime: rehearsalDialog.time || null,
                    order: assignment.order,
                });
                toast({ title: "Rehearsal schedule updated" });
            }
            setRehearsalDialog(null);
        } catch {
            toast({ variant: "destructive", title: "Failed to update rehearsal" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePublic = async () => {
        try {
            const updated = await togglePublic({ isPublic: !(schedule as any)?.isPublic });
            toast({
                title: (updated as any).isPublic ? "Schedule is now public" : "Schedule is now private",
                description: (updated as any).isPublic
                    ? `Public link: ${APP_URL}/public/schedule/${(updated as any).publicToken}`
                    : undefined,
            });
        } catch {
            toast({ variant: "destructive", title: "Failed to update visibility" });
        }
    };

    const handlePrint = () => window.open(`/schedule/${id}/print`, '_blank');

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!schedule) {
        return (
            <AppLayout>
                <p className="text-muted-foreground">Schedule not found.</p>
            </AppLayout>
        );
    }

    const totalSlots = schedule.assignments.length;
    const filledSlots = schedule.assignments.filter((a: any) => a.workerId).length;

    return (
        <AppLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/schedule")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-headline font-bold">{schedule.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(schedule.date), "EEEE, MMMM d, yyyy")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={schedule.status === "Published" ? "default" : "secondary"}>
                        {schedule.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{filledSlots}/{totalSlots} filled</span>
                    {conflicts.length > 0 && (
                        <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" /> {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
                        </Badge>
                    )}
                    {canManageSchedule && (
                        <Button size="sm" variant="outline" onClick={handlePrint}>
                            <Printer className="mr-1 h-4 w-4" /> Print
                        </Button>
                    )}
                    {canManageSchedule && schedule.status === "Published" && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTogglePublic}
                            className={(schedule as any).isPublic ? "text-green-600 border-green-300" : ""}
                        >
                            {(schedule as any).isPublic
                                ? <><Globe className="mr-1 h-4 w-4" /> Public</>
                                : <><GlobeLock className="mr-1 h-4 w-4" /> Private</>
                            }
                        </Button>
                    )}
                    {schedule.status === "Draft" && canManageSchedule && (
                        <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
                            {isPublishing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            <Send className="mr-2 h-4 w-4" /> Publish & Notify
                        </Button>
                    )}
                </div>
            </div>

            {/* Public link banner */}
            {(schedule as any).isPublic && (schedule as any).publicToken && (
                <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-sm">
                    <Globe className="h-4 w-4 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="font-medium text-green-800">Public link: </span>
                        <a
                            href={`${APP_URL}/public/schedule/${(schedule as any).publicToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-700 underline truncate"
                        >
                            {APP_URL}/public/schedule/{(schedule as any).publicToken}
                        </a>
                    </div>
                </div>
            )}

            {/* Conflict warnings */}
            {conflicts.length > 0 && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                    <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Scheduling Conflicts
                    </p>
                    {conflicts.map((c: any) => (
                        <p key={c.workerId} className="text-xs text-destructive">
                            <strong>{c.workerName}</strong> is assigned to multiple ministries:{" "}
                            {c.slots.map((s: any) => `${s.roleName} (${getMinistryName(s.ministryId)})`).join(", ")}
                        </p>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="assignments" value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    {(canConfirmSchedule || schedule.status === "Published") && (
                        <TabsTrigger value="confirmation">
                            Confirmation Status
                            {confirmationStatus.length > 0 && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                    {confirmationStatus.filter((a: any) => a.acknowledgedAt).length}/{confirmationStatus.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="history"><History className="mr-1 h-3.5 w-3.5" />History</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments">
            {/* Service Slots: Department → Ministry → Role Slots (ScheduleAssignment) */}
            <div className="mt-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Service Slots</h2>
                {canManageSchedule && (
                    <Button variant="outline" size="sm" className="h-8 text-sm"
                        onClick={() => { setSelectedMinistryIds(new Set()); setAddMinistryDialogOpen(true); }}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add Ministry
                    </Button>
                )}
            </div>

            <div className="mt-3 space-y-6">
                {allMinistryIds.length === 0 && (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            No ministries added yet. Use the dropdown above to add one.
                        </CardContent>
                    </Card>
                )}

                {Object.entries(ministriesByDepartment).map(([deptName, deptMinistryIds]) => (
                    <div key={deptName} className="space-y-3">
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider pl-1 border-b pb-1">
                            {deptName} Department
                        </h3>
                        {deptMinistryIds.map(ministryId => {
                            const assignments = (byMinistry[ministryId] || []) as NonNullable<typeof schedule>['assignments'];
                            const filled = assignments.filter((a: any) => a.workerId).length;
                            const isExpanded = expandedMinistries.has(ministryId);
                            const ministryTemplates = templates.filter((t: any) => t.ministryId === ministryId);
                            const byRole = assignments.reduce<Record<string, typeof assignments>>((acc, a: any) => {
                                if (!acc[a.roleName]) acc[a.roleName] = [];
                                acc[a.roleName].push(a);
                                return acc;
                            }, {});

                            return (
                                <Card key={ministryId}>
                                    <CardHeader className="cursor-pointer py-3 px-4" onClick={() => toggleMinistry(ministryId)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                <CardTitle className="text-base">{getMinistryName(ministryId)}</CardTitle>
                                                <span className="text-xs text-muted-foreground">{filled}/{assignments.length} filled</span>
                                            </div>
                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                {(templatesLoading || ministryTemplates.length > 0) && (
                                                    <Button variant="outline" size="sm" className="h-7 text-xs"
                                                        disabled={templatesLoading}
                                                        onClick={() => setApplyTemplateDialog(ministryId)}>
                                                        {templatesLoading
                                                            ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
                                                            : <LayoutTemplate className="mr-1 h-3 w-3" />}
                                                        Apply Template
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm" className="h-7 text-xs"
                                                    onClick={() => { setAddRoleDialog(ministryId); setNewRoleName(""); }}>
                                                    <Plus className="mr-1 h-3 w-3" /> Add Role
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                                    onClick={() => assignments.forEach((a: any) => deleteAssignment(a.id))}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {isExpanded && (
                                        <CardContent className="pt-0 pb-4 px-4">
                                            <div className="space-y-4">
                                                {assignments.length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-4">
                                                        No roles yet — click + Add Role to add one.
                                                    </p>
                                                )}
                                                {Object.entries(byRole).map(([roleName, slots]) => (
                                                    <div key={roleName}>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{roleName}</p>
                                                        <div className="space-y-1.5">
                                                            {(slots as any[]).map((slot: any) => {
                                                                const status = slot.attendanceStatus || 'Pending';
                                                                const statusDot = status === 'Confirmed' ? 'bg-green-500' : status === 'Not Attending' ? 'bg-red-500' : 'bg-yellow-400';
                                                                return (
                                                                    <React.Fragment key={slot.id}>
                                                                        <div className={`flex items-center gap-3 rounded-md border px-3 py-2 transition-all duration-500 ${recentlyAssignedIds.has(slot.id) ? "border-green-400 bg-green-50 ring-1 ring-green-300" : ""}`}>
                                                                            {slot.workerId ? (
                                                                                <>
                                                                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot}`} title={status} />
                                                                                    <Avatar className="h-6 w-6">
                                                                                        <AvatarImage src={workerById.get(slot.workerId)?.avatarUrl} />
                                                                                        <AvatarFallback className="text-[10px]">{slot.workerName?.split(" ").map((n: string) => n[0]).join("") || "?"}</AvatarFallback>
                                                                                    </Avatar>
                                                                                    <span className="text-sm flex-1">{slot.workerName}</span>
                                                                                    {canConfirmSchedule && (
                                                                                        <Select value={status} onValueChange={(v: any) => setAttendanceStatus({ assignmentId: slot.id, status: v, updatedBy: workerProfile?.id || user?.uid || 'system' })}>
                                                                                            <SelectTrigger className="h-6 w-32 text-xs border-0 bg-transparent p-0 focus:ring-0"><SelectValue /></SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="Pending">⏳ Pending</SelectItem>
                                                                                                <SelectItem value="Confirmed">✅ Confirmed</SelectItem>
                                                                                                <SelectItem value="Not Attending">❌ Not Available</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    )}
                                                                                    {!canConfirmSchedule && <span className="text-xs text-muted-foreground">{status}</span>}
                                                                                    {canManageSchedule && status === 'Not Attending' && (
                                                                                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAssignDialog({ assignmentId: slot.id, ministryId, roleName, reassign: true })}>
                                                                                            <UserPlus className="mr-1 h-3 w-3" /> Reassign
                                                                                        </Button>
                                                                                    )}
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Rehearsal" onClick={() => setRehearsalDialog({ assignmentId: slot.id, date: slot.rehearsalDate ? new Date(slot.rehearsalDate).toISOString().split('T')[0] : '', time: slot.rehearsalTime || '' })}>
                                                                                        <CalendarClock className={`h-3.5 w-3.5 ${slot.rehearsalDate ? "text-primary" : ""}`} />
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAssignDialog({ assignmentId: slot.id, ministryId, roleName, relatedSlots: (slots as any[]).map(s => ({ id: s.id, workerName: s.workerName })) })}>
                                                                                        <UserPlus className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteAssignment(slot.id)}>
                                                                                        <X className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                                                                    <span className="text-sm text-muted-foreground flex-1">Unassigned</span>
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Rehearsal" onClick={() => setRehearsalDialog({ assignmentId: slot.id, date: slot.rehearsalDate ? new Date(slot.rehearsalDate).toISOString().split('T')[0] : '', time: slot.rehearsalTime || '' })}>
                                                                                        <CalendarClock className={`h-3.5 w-3.5 ${slot.rehearsalDate ? "text-primary" : ""}`} />
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAssignDialog({ assignmentId: slot.id, ministryId, roleName, relatedSlots: (slots as any[]).map(s => ({ id: s.id, workerName: s.workerName })) })}>
                                                                                        <UserPlus className="mr-1 h-3 w-3" /> Assign
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteAssignment(slot.id)}>
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                            {canManageSchedule && (
                                                                                <Select value={slot.slotType || 'Standard'} onValueChange={(v: any) => handleSlotTypeChange(slot, v)}>
                                                                                    <SelectTrigger className="h-6 w-[5.5rem] text-xs border-0 bg-transparent p-0 focus:ring-0" title="Slot type"><SelectValue /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="Standard">Standard</SelectItem>
                                                                                        <SelectItem value="Main">Main</SelectItem>
                                                                                        <SelectItem value="Mid">Mid</SelectItem>
                                                                                        <SelectItem value="Open">Open</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            )}
                                                                        </div>
                                                                        {slot.rehearsalDate && (
                                                                            <div className="ml-8 text-[10px] text-muted-foreground flex items-center gap-1.5 -mt-0.5 mb-1">
                                                                                <CalendarClock className="h-3 w-3" />
                                                                                Rehearsal: {format(new Date(slot.rehearsalDate), "MMM d, yyyy")} {slot.rehearsalTime ? `at ${slot.rehearsalTime}` : ""}
                                                                            </div>
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                ))}
            </div>

                </TabsContent>

                {(canConfirmSchedule || schedule.status === "Published") && (
                <TabsContent value="confirmation">
                    <div className="mt-4 space-y-2">
                        {confirmationStatus.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground">
                                    No assigned workers yet.
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <div className="divide-y">
                                    {confirmationStatus.map((a: any) => (
                                        <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{a.workerName || "—"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {getMinistryName(a.ministryId)} · {a.roleName}
                                                </p>
                                            </div>
                                            {(() => {
                                                const st = a.attendanceStatus || (a.acknowledgedAt ? 'Confirmed' : 'Pending');
                                                if (st === 'Confirmed') return (
                                                    <div className="flex items-center gap-1.5 text-green-600">
                                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                                        <span className="text-xs">Confirmed {a.acknowledgedAt ? format(new Date(a.acknowledgedAt), "MMM d, h:mm a") : ""}</span>
                                                    </div>
                                                );
                                                if (st === 'Not Attending') return (
                                                    <div className="flex items-center gap-1.5 text-red-600">
                                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                                        <span className="text-xs">Not Available</span>
                                                    </div>
                                                );
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                                        <span className="text-xs text-muted-foreground">Pending</span>
                                                        {canConfirmSchedule && (
                                                            <Button size="sm" variant="outline" className="h-7 text-xs"
                                                                onClick={() => setAttendanceStatus({ assignmentId: a.id, status: 'Confirmed', updatedBy: workerProfile?.id || user?.uid || 'system' })}>
                                                                <ShieldCheck className="mr-1 h-3 w-3" /> Confirm
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </TabsContent>
                )}

                <TabsContent value="history">
                    <div className="mt-4 space-y-3">
                        {!history || history.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground">
                                    No past schedules yet.
                                </CardContent>
                            </Card>
                        ) : (
                            history.map((h: any) => (
                                <Card key={h.id} className="cursor-pointer hover:bg-muted/30" onClick={() => router.push(`/schedule/${h.id}`)}>
                                    <CardHeader className="py-3 px-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm">{h.title}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(h.date), "EEEE, MMMM d, yyyy")}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {h.assignments.filter((a: any) => a.workerId).length}/{h.assignments.length} filled
                                                </span>
                                                <Badge variant="outline" className="text-xs">{h.status}</Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <WorkerSearchDropdown open={!!assignDialog} onClose={() => { setAssignDialog(null); setWorkerSearch(""); setWorkerIdSearch(""); setWorkerIdResult(null); }} assignDialog={assignDialog} ministries={ministries} monthlyDuties={monthlyDuties} workerSearch={workerSearch} setWorkerSearch={setWorkerSearch} filteredWorkers={filteredWorkers} handleAssign={handleAssign} workerIdSearch={workerIdSearch} setWorkerIdSearch={setWorkerIdSearch} workerIdResult={workerIdResult} setWorkerIdResult={setWorkerIdResult} handleWorkerIdSearch={handleWorkerIdSearch} workerIdSearching={workerIdSearching} isAssigning={isAssigning} assigningWorkerId={assigningWorkerId} />

            {/* Apply Template Dialog */}
            <Dialog open={!!applyTemplateDialog} onOpenChange={() => setApplyTemplateDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply Template — {applyTemplateDialog ? getMinistryName(applyTemplateDialog) : ""}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will replace all current role slots for this ministry with the template's roles.
                    </p>
                    <div className="space-y-2 mt-2">
                        {templates
                            .filter((t: any) => t.ministryId === applyTemplateDialog)
                            .map((t: any) => (
                                <button
                                    key={t.id}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-md border hover:bg-muted text-left"
                                    onClick={() => handleApplyTemplate(t.id)}
                                    disabled={isApplyingTemplate}
                                >
                                    <div>
                                        <p className="font-medium text-sm">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.roles.reduce((s: number, r: any) => s + r.count, 0)} slots · {t.roles.map((r: any) => r.roleName).join(", ")}
                                        </p>
                                    </div>
                                    {t.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                                </button>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Ministry Dialog */}
            <Dialog open={addMinistryDialogOpen} onOpenChange={setAddMinistryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Ministry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                        {Object.keys(unselectedMinistriesByDept).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">All ministries have been added.</p>
                        )}
                        {Object.entries(unselectedMinistriesByDept).map(([deptName, deptMinistries]) => (
                            <div key={deptName} className="space-y-1.5">
                                <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide">{deptName}</p>
                                {(deptMinistries as any[]).map((m: any) => (
                                    <label key={m.id} className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50">
                                        <Checkbox
                                            checked={selectedMinistryIds.has(m.id)}
                                            onCheckedChange={(checked) => {
                                                setSelectedMinistryIds(prev => {
                                                    const next = new Set(prev);
                                                    if (checked) next.add(m.id); else next.delete(m.id);
                                                    return next;
                                                });
                                            }}
                                        />
                                        <span className="text-sm">{m.name}</span>
                                    </label>
                                ))}
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setAddMinistryDialogOpen(false); setSelectedMinistryIds(new Set()); }}>Discard</Button>
                        <Button
                            disabled={selectedMinistryIds.size === 0}
                            onClick={() => {
                                setAddedMinistryIds(prev => new Set([...prev, ...selectedMinistryIds]));
                                setExpandedMinistries(prev => new Set([...prev, ...selectedMinistryIds]));
                                setAddMinistryDialogOpen(false);
                                setSelectedMinistryIds(new Set());
                            }}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Role Dialog */}
            <Dialog open={!!addRoleDialog} onOpenChange={() => setAddRoleDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Role Slot</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Role Name</Label>
                            <WorkloadCategorySelect
                                ministryId={addRoleDialog || ''}
                                value={newRoleName}
                                onChange={setNewRoleName}
                                placeholder="e.g. Worship Leader, Sound Engineer"
                            />
                        </div>
                        <div className="space-y-1.5 mt-4 border-t pt-4">
                            <Label>Assign Worker (Optional)</Label>
                            <Select value={newRoleWorkerId || 'none'} onValueChange={v => setNewRoleWorkerId(v === 'none' ? null : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a worker" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Leave empty)</SelectItem>
                                    {workers
                                        .filter((w: any) => w.status === 'Active' && (w.majorMinistryId === addRoleDialog || w.minorMinistryId === addRoleDialog))
                                        .map((w: any) => (
                                            <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">You can assign a worker right now, or leave it empty and assign later.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddRoleDialog(null)}>Cancel</Button>
                        <Button onClick={handleAddRole} disabled={isSaving || !newRoleName.trim()}>
                            {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Add Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Worker to Slot Dialog */}
            <Dialog open={!!slotAssignDialog} onOpenChange={() => setSlotAssignDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Worker — {slotAssignDialog?.slotName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input
                            placeholder="Search by name or ID..."
                            value={slotWorkerSearch}
                            onChange={e => setSlotWorkerSearch(e.target.value)}
                            autoFocus
                        />
                        <div className="max-h-72 overflow-y-auto space-y-1">
                            {workers
                                .filter((w: any) => {
                                    if (w.status !== 'Active') return false;
                                    if (!slotWorkerSearch.trim()) return true;
                                    const q = slotWorkerSearch.toLowerCase();
                                    return `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
                                        (w.workerId || '').toLowerCase().includes(q);
                                })
                                .slice(0, 50)
                                .map((w: any) => (
                                    <button
                                        key={w.id}
                                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-accent text-left"
                                        onClick={async () => {
                                            if (!slotAssignDialog) return;
                                            await addWorshipWorker({
                                                slotId: slotAssignDialog.slotId,
                                                workerId: w.id,
                                                workerName: `${w.firstName} ${w.lastName}`,
                                            });
                                            setSlotAssignDialog(null);
                                        }}
                                    >
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={w.avatarUrl} />
                                            <AvatarFallback className="text-[10px]">{w.firstName[0]}{w.lastName[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm flex-1">{w.firstName} {w.lastName}</span>
                                        <span className="text-xs text-muted-foreground">{w.workerId || ''}</span>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSlotAssignDialog(null)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Worship Slot Dialog */}
            <Dialog open={addSlotOpen} onOpenChange={setAddSlotOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Service Slot</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Ministry</Label>
                            <Select value={newSlotMinistryId} onValueChange={setNewSlotMinistryId}>
                                <SelectTrigger><SelectValue placeholder="Select ministry" /></SelectTrigger>
                                <SelectContent>
                                    {ministries.map((m: any) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name.replace(/^[WORDA]-/i, '')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Slot Name</Label>
                            <Input
                                value={newSlotName}
                                onChange={e => setNewSlotName(e.target.value)}
                                placeholder="e.g. TWS, Main Slot, Empowered Night"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddSlotOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!newSlotName.trim() || !newSlotMinistryId}
                            onClick={async () => {
                                await createSlot({
                                    slotName: newSlotName.trim(),
                                    ministryId: newSlotMinistryId,
                                    order: worshipSlots.length,
                                });
                                setAddSlotOpen(false);
                                setNewSlotName("");
                                setNewSlotMinistryId("");
                            }}
                        >
                            Add Slot
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rehearsal Dialog */}
            <Dialog open={!!rehearsalDialog} onOpenChange={() => setRehearsalDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Rehearsal Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Rehearsal Date</Label>
                            <Input 
                                type="date" 
                                value={rehearsalDialog?.date || ''} 
                                onChange={e => setRehearsalDialog(d => d ? { ...d, date: e.target.value } : null)} 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Rehearsal Time</Label>
                            <Input 
                                type="time" 
                                value={rehearsalDialog?.time || ''} 
                                onChange={e => setRehearsalDialog(d => d ? { ...d, time: e.target.value } : null)} 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRehearsalDialog(null)}>Cancel</Button>
                        <Button onClick={handleSaveRehearsal} disabled={isSaving}>
                            {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </AppLayout>
    );
}
