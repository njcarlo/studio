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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@studio/ui";import {
    ArrowLeft, LoaderCircle, UserPlus, X, LayoutTemplate,
    CheckCircle2, Circle, ChevronDown, ChevronUp, Plus, Trash2,
    Send, ShieldCheck, AlertTriangle, Globe, GlobeLock, Printer, History, CalendarClock,
} from "lucide-react";
import { useServiceSchedule, useServiceTemplates, useScheduleHistory, useWorshipSlots } from "@/hooks/use-schedule";
import { useMinistries } from "@/hooks/use-ministries";
import { useWorkers } from "@/hooks/use-workers";
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
    const { canManageSchedule, canConfirmSchedule, canAssignSchedulers, workerProfile } = useUserRole();

    const { schedule, isLoading, upsertAssignment, deleteAssignment, applyTemplate, isApplyingTemplate, publishSchedule, isPublishing, confirmAssignment, confirmationStatus, monthlyDuties, conflicts, togglePublic, setAttendanceStatus } = useServiceSchedule(id);
    const { ministries } = useMinistries();
    const { workers } = useWorkers({ limit: 100 }); // avatar lookups only — search uses getEligibleWorkers
    const { templates, isLoading: templatesLoading } = useServiceTemplates();
    const { data: history } = useScheduleHistory();
    const { slots: worshipSlots, createSlot, deleteSlot, addWorker: addWorshipWorker, removeWorker: removeWorshipWorker } = useWorshipSlots(id);

    const [expandedMinistries, setExpandedMinistries] = useState<Set<string>>(new Set());
    const [assignDialog, setAssignDialog] = useState<{ assignmentId: string; ministryId: string; roleName: string } | null>(null);
    const [workerSearch, setWorkerSearch] = useState("");
    const [workerIdSearch, setWorkerIdSearch] = useState("");
    const [workerIdResult, setWorkerIdResult] = useState<any>(null);
    const [workerIdSearching, setWorkerIdSearching] = useState(false);
    const [applyTemplateDialog, setApplyTemplateDialog] = useState<string | null>(null); // ministryId
    const [addRoleDialog, setAddRoleDialog] = useState<string | null>(null); // ministryId
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleWorkerId, setNewRoleWorkerId] = useState<string | null>(null);
    const [rehearsalDialog, setRehearsalDialog] = useState<{ assignmentId: string, date: string, time: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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
        const fromAssignments = new Set(ministryIds);
        let ids = [...fromAssignments];
        if (canManageSchedule && !canAssignSchedulers && workerProfile?.majorMinistryId) {
            ids = ids.filter(id => id === workerProfile.majorMinistryId || id === workerProfile.minorMinistryId);
        }
        return ids.sort((a, b) => getMinistryName(a).localeCompare(getMinistryName(b)));
    }, [ministryIds, canManageSchedule, canAssignSchedulers, workerProfile, ministries]);

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
        queryFn: () => getEligibleWorkers({ ministryId: assignDialog!.ministryId, query: workerSearch }),
        enabled: !!assignDialog?.ministryId,
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

    const handleAssign = async (workerId: string | null) => {
        if (!assignDialog) return;
        const worker = workerId ? workers.find((w: any) => w.id === workerId) : null;

        // Conflict check — warn if worker already assigned to another ministry
        if (workerId && schedule) {
            const existingSlot = schedule.assignments.find(
                (a: any) => a.workerId === workerId && a.ministryId !== assignDialog.ministryId
            );
            if (existingSlot) {
                const conflictMinistry = getMinistryName(existingSlot.ministryId);
                toast({
                    variant: "destructive",
                    title: "Conflict detected",
                    description: `${worker ? `${(worker as any).firstName} ${(worker as any).lastName}` : "This worker"} is already assigned as ${existingSlot.roleName} in ${conflictMinistry} for this service.`,
                });
                // Still allow — just warn
            }
        }

        try {
            await upsertAssignment({
                id: assignDialog.assignmentId,
                scheduleId: id,
                ministryId: assignDialog.ministryId,
                roleName: assignDialog.roleName,
                workerId: workerId ?? null,
                workerName: worker ? `${(worker as any).firstName} ${(worker as any).lastName}` : null,
                order: schedule?.assignments.filter(
                    (a: any) => a.ministryId === assignDialog.ministryId && a.roleName === assignDialog.roleName
                ).findIndex((a: any) => a.id === assignDialog.assignmentId) ?? 0,
            });
            toast({ title: workerId ? "Worker assigned" : "Assignment cleared" });
            setAssignDialog(null);
        } catch {
            toast({ variant: "destructive", title: "Failed to assign" });
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
                    await createWorkloadCategory({ ministryId: addRoleDialog, name: roleNameStr }, callerId, { skipAuth: true });
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
            <Tabs defaultValue="assignments" className="mt-6">
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
            {/* Service Slots grouped by Department → Ministry */}
            <div className="mt-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Service Slots</h2>
                {canManageSchedule && (
                    <Button size="sm" onClick={() => { setNewSlotName(""); setNewSlotMinistryId(""); setAddSlotOpen(true); }}>
                        <Plus className="mr-1 h-4 w-4" /> Add Slot
                    </Button>
                )}
            </div>

            <div className="mt-3 space-y-6">
                {/* Department → Ministry → Slots */}
                {(() => {
                    // Build dept → ministry → slots hierarchy from all ministries
                    const deptMap: Record<string, { id: string; name: string }[]> = {};
                    ministries.forEach((m: any) => {
                        const dept = m.department || m.departmentCode || 'Other';
                        if (!deptMap[dept]) deptMap[dept] = [];
                        deptMap[dept].push(m);
                    });

                    const hasSlotsAnywhere = worshipSlots.length > 0;

                    if (!hasSlotsAnywhere) return (
                        <Card className="mt-2">
                            <CardContent className="py-8 text-center text-muted-foreground text-sm">
                                No slots yet. Click "Add Slot" to get started.
                            </CardContent>
                        </Card>
                    );

                    return Object.entries(deptMap).map(([deptName, deptMinistries]) => {
                        const deptSlots = worshipSlots.filter((s: any) =>
                            deptMinistries.some((m: any) => m.id === s.ministryId)
                        );
                        if (deptSlots.length === 0) return null;

                        return (
                            <div key={deptName} className="space-y-3">
                                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider pl-1 border-b pb-1">
                                    {deptName} Department
                                </h3>
                                {deptMinistries.map((ministry: any) => {
                                    const ministrySlots = worshipSlots.filter((s: any) => s.ministryId === ministry.id);
                                    if (ministrySlots.length === 0) return null;
                                    return (
                                        <div key={ministry.id} className="space-y-2">
                                            <h4 className="text-sm font-semibold text-foreground pl-1 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block" />
                                                {ministry.name.replace(/^[WORDA]-/i, '')}
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    {ministrySlots.length} slot{ministrySlots.length !== 1 ? 's' : ''}
                                                </span>
                                            </h4>
                                            {ministrySlots.map((slot: any) => (
                                                <Card key={slot.id}>
                                                    <CardHeader className="py-3 px-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <CardTitle className="text-sm">{slot.slotName}</CardTitle>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {slot.workers.length} worker{slot.workers.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                            {canManageSchedule && (
                                                                <div className="flex items-center gap-1">
                                                                    <Button size="sm" variant="outline" className="h-7 text-xs"
                                                                        onClick={() => { setSlotWorkerSearch(""); setSlotAssignDialog({ slotId: slot.id, slotName: slot.slotName }); }}>
                                                                        <UserPlus className="mr-1 h-3 w-3" /> Add Worker
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                                                        onClick={() => deleteSlot(slot.id)}>
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {slot.notes && <p className="text-xs text-muted-foreground mt-1">{slot.notes}</p>}
                                                    </CardHeader>
                                                    {slot.workers.length > 0 && (
                                                        <CardContent className="pt-0 pb-4 px-4 space-y-1.5">
                                                            {(slot.workers as any[]).map((sw: any) => (
                                                                <div key={sw.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarImage src={workers.find((w: any) => w.id === sw.workerId)?.avatarUrl} />
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {sw.workerName?.split(" ").map((n: string) => n[0]).join("") || "?"}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-sm flex-1">{sw.workerName}</span>
                                                                    {sw.role && (
                                                                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{sw.role}</span>
                                                                    )}
                                                                    {canManageSchedule && (
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                                                            onClick={() => removeWorshipWorker(sw.id)}>
                                                                            <X className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </CardContent>
                                                    )}
                                                </Card>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    });
                })()}

                {/* Slots with no ministry assigned */}
                {worshipSlots.filter((s: any) => !s.ministryId).map((slot: any) => (
                    <Card key={slot.id}>
                        <CardHeader className="py-3 px-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm">{slot.slotName}</CardTitle>
                                    <span className="text-xs text-muted-foreground">{slot.workers.length} worker{slot.workers.length !== 1 ? 's' : ''}</span>
                                </div>
                                {canManageSchedule && (
                                    <div className="flex items-center gap-1">
                                        <Button size="sm" variant="outline" className="h-7 text-xs"
                                            onClick={() => { setSlotWorkerSearch(""); setSlotAssignDialog({ slotId: slot.id, slotName: slot.slotName }); }}>
                                            <UserPlus className="mr-1 h-3 w-3" /> Add Worker
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                            onClick={() => deleteSlot(slot.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        {slot.workers.length > 0 && (
                            <CardContent className="pt-0 pb-4 px-4 space-y-1.5">
                                {(slot.workers as any[]).map((sw: any) => (
                                    <div key={sw.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={workers.find((w: any) => w.id === sw.workerId)?.avatarUrl} />
                                            <AvatarFallback className="text-[10px]">{sw.workerName?.split(" ").map((n: string) => n[0]).join("") || "?"}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm flex-1">{sw.workerName}</span>
                                        {sw.role && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{sw.role}</span>}
                                        {canManageSchedule && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeWorshipWorker(sw.id)}>
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        )}
                    </Card>
                ))}

            </div>{/* end mt-3 space-y-6 */}

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
                                                        <span className="text-xs">Not Attending</span>
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

            <WorkerSearchDropdown open={!!assignDialog} onClose={() => { setAssignDialog(null); setWorkerSearch(""); setWorkerIdSearch(""); setWorkerIdResult(null); }} assignDialog={assignDialog} ministries={ministries} workers={workers} monthlyDuties={monthlyDuties} workerSearch={workerSearch} setWorkerSearch={setWorkerSearch} filteredWorkers={filteredWorkers} handleAssign={handleAssign} workerIdSearch={workerIdSearch} setWorkerIdSearch={setWorkerIdSearch} workerIdResult={workerIdResult} setWorkerIdResult={setWorkerIdResult} handleWorkerIdSearch={handleWorkerIdSearch} workerIdSearching={workerIdSearching} />

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
                            Add Slot
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
