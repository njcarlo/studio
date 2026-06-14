"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@studio/ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@studio/ui";
import { Input } from "@studio/ui";
import { Label } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@studio/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@studio/ui";
import { LoaderCircle, ShieldAlert, Pencil } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useWorkersLite } from "@/hooks/use-workers";
import {
    getMasterSchedules,
    upsertMasterSchedule,
    getAttendanceSetting,
    updateAttendanceSetting,
    getIncompleteTimeOuts,
    resolveIncompleteTimeOut,
} from "@/actions/db";
import { getAllLeaveBalances, updateLeaveBalance } from "@/actions/leave";
import type { LeaveBalance } from "@studio/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AttendanceSettingsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { isLoading: isPermissionsLoading, canManageMasterSchedule } = useUserRole();

    const { data: workers = [], isLoading: isWorkersLoading } = useWorkersLite();

    const { data: schedules = [], isLoading: isSchedulesLoading } = useQuery({
        queryKey: ["masterSchedules"],
        queryFn: async () => {
            const res = await getMasterSchedules();
            return res.success ? res.data! : [];
        },
        enabled: canManageMasterSchedule,
    });

    const { data: setting, isLoading: isSettingLoading } = useQuery({
        queryKey: ["attendanceSetting"],
        queryFn: async () => {
            const res = await getAttendanceSetting();
            return res.success ? res.data : null;
        },
        enabled: canManageMasterSchedule,
    });

    const { data: incompleteTimeOuts = [], isLoading: isIncompleteLoading } = useQuery({
        queryKey: ["incompleteTimeOuts"],
        queryFn: async () => {
            const res = await getIncompleteTimeOuts();
            return res.success ? res.data! : [];
        },
        enabled: canManageMasterSchedule,
    });

    const { data: leaveBalancesData, isLoading: isLeaveBalancesLoading } = useQuery({
        queryKey: ["allLeaveBalances"],
        queryFn: async () => {
            const res = await getAllLeaveBalances();
            return res.success ? res.data! : { workers: [], balances: [], year: new Date().getFullYear() };
        },
        enabled: canManageMasterSchedule,
    });

    const scheduleByWorkerId = useMemo(() => {
        const map = new Map<string, (typeof schedules)[number]>();
        for (const s of schedules) map.set(s.workerId, s);
        return map;
    }, [schedules]);

    const ftOcWorkers = useMemo(
        () => workers.filter((w: any) => w.employmentType === "Full-Time" || w.employmentType === "On-Call"),
        [workers],
    );

    // ── Shift editor dialog ──────────────────────────────────────────────────
    const [editingWorker, setEditingWorker] = useState<any | null>(null);
    const [formShiftStart, setFormShiftStart] = useState("08:00");
    const [formShiftEnd, setFormShiftEnd] = useState("17:00");
    const [formDaysOff, setFormDaysOff] = useState<number[]>([0]);
    const [isSaving, setIsSaving] = useState(false);

    const openEdit = (worker: any) => {
        const existing = scheduleByWorkerId.get(worker.id);
        setEditingWorker(worker);
        setFormShiftStart(existing?.shiftStart ?? "08:00");
        setFormShiftEnd(existing?.shiftEnd ?? "17:00");
        setFormDaysOff(existing?.daysOff ?? [0]);
    };

    const toggleDayOff = (day: number) => {
        setFormDaysOff((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
        );
    };

    const handleSaveSchedule = async () => {
        if (!editingWorker) return;
        setIsSaving(true);
        try {
            const res = await upsertMasterSchedule({
                workerId: editingWorker.id,
                shiftStart: formShiftStart,
                shiftEnd: formShiftEnd,
                daysOff: formDaysOff,
            });
            if (!res.success) throw new Error(res.error);
            toast({ title: "Schedule saved" });
            queryClient.invalidateQueries({ queryKey: ["masterSchedules"] });
            setEditingWorker(null);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Save failed", description: err?.message });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Grace period ──────────────────────────────────────────────────────────
    const [gracePeriodInput, setGracePeriodInput] = useState<string | null>(null);
    const gracePeriodValue = gracePeriodInput ?? String(setting?.gracePeriodMinutes ?? 15);
    const [isSavingGrace, setIsSavingGrace] = useState(false);

    const handleSaveGracePeriod = async () => {
        const minutes = parseInt(gracePeriodValue, 10);
        if (isNaN(minutes) || minutes < 0) {
            toast({ variant: "destructive", title: "Enter a valid number of minutes" });
            return;
        }
        setIsSavingGrace(true);
        try {
            const res = await updateAttendanceSetting(minutes);
            if (!res.success) throw new Error(res.error);
            toast({ title: "Grace period updated" });
            queryClient.invalidateQueries({ queryKey: ["attendanceSetting"] });
            setGracePeriodInput(null);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Save failed", description: err?.message });
        } finally {
            setIsSavingGrace(false);
        }
    };

    // ── Incomplete time-outs ─────────────────────────────────────────────────
    const [resolvingRecord, setResolvingRecord] = useState<any | null>(null);
    const [resolveTime, setResolveTime] = useState("");
    const [isResolving, setIsResolving] = useState(false);

    const openResolve = (record: any) => {
        setResolvingRecord(record);
        const clockIn = new Date(record.time);
        const defaultOut = new Date(clockIn);
        defaultOut.setHours(17, 0, 0, 0);
        const pad = (n: number) => String(n).padStart(2, "0");
        setResolveTime(
            `${defaultOut.getFullYear()}-${pad(defaultOut.getMonth() + 1)}-${pad(defaultOut.getDate())}T${pad(defaultOut.getHours())}:${pad(defaultOut.getMinutes())}`,
        );
    };

    const handleResolve = async () => {
        if (!resolvingRecord || !resolveTime) return;
        setIsResolving(true);
        try {
            const res = await resolveIncompleteTimeOut(resolvingRecord.id, new Date(resolveTime));
            if (!res.success) throw new Error(res.error);
            toast({ title: "Time-out recorded" });
            queryClient.invalidateQueries({ queryKey: ["incompleteTimeOuts"] });
            setResolvingRecord(null);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Resolve failed", description: err?.message });
        } finally {
            setIsResolving(false);
        }
    };

    // ── Leave balances ────────────────────────────────────────────────────────
    const [editingBalance, setEditingBalance] = useState<{ workerId: string; type: string; workerName: string } | null>(null);
    const [balanceInput, setBalanceInput] = useState("");
    const [isSavingBalance, setIsSavingBalance] = useState(false);

    const leaveBalanceByKey = useMemo(() => {
        const map = new Map<string, LeaveBalance>();
        for (const b of leaveBalancesData?.balances ?? []) map.set(`${b.workerId}:${b.type}`, b as LeaveBalance);
        return map;
    }, [leaveBalancesData]);

    const openEditBalance = (workerId: string, type: string, workerName: string) => {
        const existing = leaveBalanceByKey.get(`${workerId}:${type}`);
        setEditingBalance({ workerId, type, workerName });
        setBalanceInput(String(existing?.totalDays ?? 0));
    };

    const handleSaveBalance = async () => {
        if (!editingBalance) return;
        const totalDays = parseFloat(balanceInput);
        if (isNaN(totalDays) || totalDays < 0) {
            toast({ variant: "destructive", title: "Enter a valid number of days" });
            return;
        }
        setIsSavingBalance(true);
        try {
            const year = leaveBalancesData?.year ?? new Date().getFullYear();
            const res = await updateLeaveBalance(editingBalance.workerId, editingBalance.type, year, totalDays);
            if (!res.success) throw new Error(res.error);
            toast({ title: "Leave balance updated" });
            queryClient.invalidateQueries({ queryKey: ["allLeaveBalances"] });
            setEditingBalance(null);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Save failed", description: err?.message });
        } finally {
            setIsSavingBalance(false);
        }
    };

    const isLoading = isPermissionsLoading || isWorkersLoading || isSchedulesLoading || isSettingLoading;

    if (isPermissionsLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!canManageMasterSchedule) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You do not have permission to manage master schedules and attendance settings.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div>
                <h1 className="text-2xl font-headline font-bold">Master Schedule & Attendance</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage Full-Time/On-Call shift schedules, the late grace period, and incomplete time-outs.
                </p>
            </div>

            <Tabs defaultValue="schedules" className="mt-6">
                <TabsList>
                    <TabsTrigger value="schedules">Master Schedules</TabsTrigger>
                    <TabsTrigger value="incomplete">
                        Incomplete Time-Outs
                        {incompleteTimeOuts.length > 0 && (
                            <Badge variant="destructive" className="ml-2">{incompleteTimeOuts.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="leave-balances">Leave Balances</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="schedules" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Full-Time / On-Call Shift Schedules</CardTitle>
                            <CardDescription>
                                Set each worker's shift hours and weekly days off. Used to flag late Clock-Ins.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <LoaderCircle className="h-8 w-8 animate-spin" />
                                </div>
                            ) : ftOcWorkers.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    No Full-Time or On-Call workers found.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Worker</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Shift</TableHead>
                                            <TableHead>Days Off</TableHead>
                                            <TableHead className="w-[60px] text-right">Edit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ftOcWorkers.map((worker: any) => {
                                            const schedule = scheduleByWorkerId.get(worker.id);
                                            return (
                                                <TableRow key={worker.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarImage src={worker.avatarUrl} alt={`${worker.firstName} ${worker.lastName}`} />
                                                                <AvatarFallback>{worker.firstName?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            {`${worker.firstName} ${worker.lastName}`}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{worker.employmentType}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {schedule ? `${schedule.shiftStart} – ${schedule.shiftEnd}` : <span className="text-muted-foreground">Not set</span>}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {schedule && schedule.daysOff.length > 0
                                                            ? schedule.daysOff.map((d) => DAY_LABELS[d]).join(", ")
                                                            : <span className="text-muted-foreground">None</span>}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(worker)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="incomplete" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Incomplete Time-Outs</CardTitle>
                            <CardDescription>
                                Clock-Ins from previous days with no matching Clock-Out. Record the actual time-out below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isIncompleteLoading ? (
                                <div className="flex justify-center py-10">
                                    <LoaderCircle className="h-8 w-8 animate-spin" />
                                </div>
                            ) : incompleteTimeOuts.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    No incomplete time-outs in the last 14 days.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Worker</TableHead>
                                            <TableHead>Clock In</TableHead>
                                            <TableHead className="w-[120px] text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {incompleteTimeOuts.map((record: any) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={record.worker?.avatarUrl} alt={`${record.worker?.firstName} ${record.worker?.lastName}`} />
                                                            <AvatarFallback>{record.worker?.firstName?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        {`${record.worker?.firstName} ${record.worker?.lastName}`}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {new Date(record.time).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="outline" onClick={() => openResolve(record)}>
                                                        Resolve
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="leave-balances" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Leave Balances ({leaveBalancesData?.year ?? new Date().getFullYear()})</CardTitle>
                            <CardDescription>
                                Annual Vacation/Sick/Emergency leave day caps for each Full-Time worker.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLeaveBalancesLoading ? (
                                <div className="flex justify-center py-10">
                                    <LoaderCircle className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (leaveBalancesData?.workers ?? []).length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    No Full-Time workers found.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Worker</TableHead>
                                            <TableHead>Vacation</TableHead>
                                            <TableHead>Sick</TableHead>
                                            <TableHead>Emergency</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(leaveBalancesData?.workers ?? []).map((worker: any) => {
                                            const workerName = `${worker.firstName} ${worker.lastName}`;
                                            return (
                                                <TableRow key={worker.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar>
                                                                <AvatarImage src={worker.avatarUrl} alt={workerName} />
                                                                <AvatarFallback>{worker.firstName?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            {workerName}
                                                        </div>
                                                    </TableCell>
                                                    {(["Vacation", "Sick", "Emergency"] as const).map((type) => {
                                                        const balance = leaveBalanceByKey.get(`${worker.id}:${type}`);
                                                        return (
                                                            <TableCell key={type} className="text-sm">
                                                                <button
                                                                    className="hover:underline"
                                                                    onClick={() => openEditBalance(worker.id, type, workerName)}
                                                                >
                                                                    {balance ? `${balance.usedDays} / ${balance.totalDays}` : "Not set"}
                                                                </button>
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Late Grace Period</CardTitle>
                            <CardDescription>
                                Minutes after a worker's shift start time before a Clock-In is flagged as late.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-3 max-w-xs">
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="grace-period">Grace period (minutes)</Label>
                                    <Input
                                        id="grace-period"
                                        type="number"
                                        min={0}
                                        value={gracePeriodValue}
                                        onChange={(e) => setGracePeriodInput(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleSaveGracePeriod} disabled={isSavingGrace}>
                                    {isSavingGrace ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Shift editor dialog */}
            <Dialog open={!!editingWorker} onOpenChange={(open) => !open && setEditingWorker(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingWorker ? `Shift Schedule — ${editingWorker.firstName} ${editingWorker.lastName}` : ""}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="shift-start">Shift Start</Label>
                                <Input id="shift-start" type="time" value={formShiftStart} onChange={(e) => setFormShiftStart(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shift-end">Shift End</Label>
                                <Input id="shift-end" type="time" value={formShiftEnd} onChange={(e) => setFormShiftEnd(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Days Off</Label>
                            <div className="flex flex-wrap gap-3">
                                {DAY_LABELS.map((label, day) => (
                                    <label key={day} className="flex items-center gap-2 text-sm">
                                        <Checkbox checked={formDaysOff.includes(day)} onCheckedChange={() => toggleDayOff(day)} />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingWorker(null)}>Cancel</Button>
                        <Button onClick={handleSaveSchedule} disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leave balance edit dialog */}
            <Dialog open={!!editingBalance} onOpenChange={(open) => !open && setEditingBalance(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingBalance ? `${editingBalance.type} Leave — ${editingBalance.workerName}` : ""}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="balance-total">Annual cap (days)</Label>
                        <Input
                            id="balance-total"
                            type="number"
                            min={0}
                            step={0.5}
                            value={balanceInput}
                            onChange={(e) => setBalanceInput(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingBalance(null)}>Cancel</Button>
                        <Button onClick={handleSaveBalance} disabled={isSavingBalance}>
                            {isSavingBalance ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resolve incomplete time-out dialog */}
            <Dialog open={!!resolvingRecord} onOpenChange={(open) => !open && setResolvingRecord(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Record Clock-Out — {resolvingRecord?.worker?.firstName} {resolvingRecord?.worker?.lastName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="resolve-time">Clock-Out Time</Label>
                        <Input id="resolve-time" type="datetime-local" value={resolveTime} onChange={(e) => setResolveTime(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResolvingRecord(null)}>Cancel</Button>
                        <Button onClick={handleResolve} disabled={isResolving}>
                            {isResolving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
