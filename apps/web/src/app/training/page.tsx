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
import { Textarea } from "@studio/ui";
import { Badge } from "@studio/ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@studio/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { LoaderCircle, PlusCircle, GraduationCap, Pencil, Trash2 } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import {
    getMyTrainingRecords,
    getManageableWorkers,
    getTrainingRecordsForWorker,
    createTrainingRecord,
    updateTrainingRecord,
    deleteTrainingRecord,
} from "@/actions/training";
import type { TrainingRecordStatus } from "@studio/types";

type TrainingRecordRow = {
    id: string;
    name: string;
    dateCompleted: Date | string | null;
    expiryDate: Date | string | null;
    status: string;
    notes: string | null;
};

const STATUS_OPTIONS: TrainingRecordStatus[] = ["Completed", "Scheduled", "Expired", "Cancelled"];

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Completed: "default",
    Scheduled: "secondary",
    Expired: "destructive",
    Cancelled: "outline",
};

function formatDate(d: unknown) {
    if (!d) return "—";
    return new Date(d as string).toLocaleDateString();
}

type FormState = {
    name: string;
    dateCompleted: string;
    expiryDate: string;
    status: TrainingRecordStatus;
    notes: string;
};

const EMPTY_FORM: FormState = {
    name: "",
    dateCompleted: "",
    expiryDate: "",
    status: "Completed",
    notes: "",
};

export default function TrainingPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { workerProfile, isLoading: isPermissionsLoading } = useUserRole();

    // ── My Training Records ──────────────────────────────────────────────────
    const { data: myRecords = [], isLoading: isMyRecordsLoading } = useQuery({
        queryKey: ["myTrainingRecords", workerProfile?.id],
        queryFn: async () => {
            const res = await getMyTrainingRecords();
            return res.success ? res.data! : [];
        },
        enabled: !!workerProfile,
    });

    // ── Manageable workers (Ministry Head / Department Head / Sys Admin) ────
    const { data: manageableWorkers = [], isLoading: isManageableLoading } = useQuery({
        queryKey: ["trainingManageableWorkers", workerProfile?.id],
        queryFn: async () => {
            const res = await getManageableWorkers();
            return res.success ? res.data! : [];
        },
        enabled: !!workerProfile,
    });

    const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
    const selectedWorker = useMemo(
        () => manageableWorkers.find((w: any) => w.id === selectedWorkerId) ?? null,
        [manageableWorkers, selectedWorkerId],
    );

    const { data: managedRecords = [], isLoading: isManagedRecordsLoading } = useQuery({
        queryKey: ["trainingRecordsForWorker", selectedWorkerId],
        queryFn: async () => {
            const res = await getTrainingRecordsForWorker(selectedWorkerId);
            return res.success ? res.data! : [];
        },
        enabled: !!selectedWorkerId,
    });

    // ── Add/edit dialog ───────────────────────────────────────────────────────
    const [editingRecord, setEditingRecord] = useState<TrainingRecordRow | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);

    const openCreate = () => {
        setEditingRecord(null);
        setForm(EMPTY_FORM);
        setIsFormOpen(true);
    };

    const openEdit = (record: TrainingRecordRow) => {
        setEditingRecord(record);
        setForm({
            name: record.name,
            dateCompleted: record.dateCompleted ? new Date(record.dateCompleted as any).toISOString().slice(0, 10) : "",
            expiryDate: record.expiryDate ? new Date(record.expiryDate as any).toISOString().slice(0, 10) : "",
            status: record.status as TrainingRecordStatus,
            notes: record.notes ?? "",
        });
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!selectedWorkerId) return;
        if (!form.name.trim()) {
            toast({ variant: "destructive", title: "Training name is required" });
            return;
        }

        setIsSaving(true);
        try {
            const input = {
                name: form.name.trim(),
                dateCompleted: form.dateCompleted ? new Date(form.dateCompleted) : null,
                expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
                status: form.status,
                notes: form.notes.trim() || null,
            };

            const res = editingRecord
                ? await updateTrainingRecord(editingRecord.id, input)
                : await createTrainingRecord({ workerId: selectedWorkerId, ...input });

            if (!res.success) throw new Error(res.error);

            toast({ title: editingRecord ? "Record updated" : "Record added" });
            queryClient.invalidateQueries({ queryKey: ["trainingRecordsForWorker", selectedWorkerId] });
            if (selectedWorkerId === workerProfile?.id) {
                queryClient.invalidateQueries({ queryKey: ["myTrainingRecords", workerProfile?.id] });
            }
            setIsFormOpen(false);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Save failed", description: err?.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (record: TrainingRecordRow) => {
        try {
            const res = await deleteTrainingRecord(record.id);
            if (!res.success) throw new Error(res.error);
            toast({ title: "Record deleted" });
            queryClient.invalidateQueries({ queryKey: ["trainingRecordsForWorker", selectedWorkerId] });
            if (selectedWorkerId === workerProfile?.id) {
                queryClient.invalidateQueries({ queryKey: ["myTrainingRecords", workerProfile?.id] });
            }
        } catch (err: any) {
            toast({ variant: "destructive", title: "Delete failed", description: err?.message });
        }
    };

    if (isPermissionsLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    const canManage = manageableWorkers.length > 0;

    return (
        <AppLayout>
            <div>
                <h1 className="text-2xl font-headline font-bold">Training</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Track completed, scheduled, and expiring training records.
                </p>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        My Training Records
                    </CardTitle>
                    <CardDescription>Trainings completed, scheduled, or due for renewal.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isMyRecordsLoading ? (
                        <div className="flex justify-center py-10">
                            <LoaderCircle className="h-8 w-8 animate-spin" />
                        </div>
                    ) : myRecords.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            No training records on file yet.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Training</TableHead>
                                    <TableHead>Completed</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myRecords.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{record.name}</TableCell>
                                        <TableCell className="text-sm">{formatDate(record.dateCompleted)}</TableCell>
                                        <TableCell className="text-sm">{formatDate(record.expiryDate)}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={STATUS_BADGE_VARIANT[record.status] ?? "secondary"}>
                                                {record.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {canManage && (
                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-base">Manage Training Records</CardTitle>
                                <CardDescription>
                                    Add, edit, or remove training records for workers in your ministry or department.
                                </CardDescription>
                            </div>
                            <Button onClick={openCreate} disabled={!selectedWorkerId}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Record
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 max-w-sm">
                            <Label>Worker</Label>
                            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isManageableLoading ? "Loading..." : "Select a worker"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {manageableWorkers.map((w: any) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.firstName} {w.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedWorker && (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={selectedWorker.avatarUrl} alt={selectedWorker.firstName} />
                                    <AvatarFallback>{selectedWorker.firstName?.[0]}{selectedWorker.lastName?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{selectedWorker.firstName} {selectedWorker.lastName}</span>
                            </div>
                        )}

                        {selectedWorkerId && (
                            isManagedRecordsLoading ? (
                                <div className="flex justify-center py-10">
                                    <LoaderCircle className="h-8 w-8 animate-spin" />
                                </div>
                            ) : managedRecords.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-6 text-center">
                                    No training records for this worker yet.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Training</TableHead>
                                            <TableHead>Completed</TableHead>
                                            <TableHead>Expires</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {managedRecords.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">{record.name}</TableCell>
                                                <TableCell className="text-sm">{formatDate(record.dateCompleted)}</TableCell>
                                                <TableCell className="text-sm">{formatDate(record.expiryDate)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={STATUS_BADGE_VARIANT[record.status] ?? "secondary"}>
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(record)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(record)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )
                        )}
                    </CardContent>
                </Card>
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingRecord ? "Edit Training Record" : "Add Training Record"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="training-name">Training name</Label>
                            <Input
                                id="training-name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="training-completed">Date completed</Label>
                                <Input
                                    id="training-completed"
                                    type="date"
                                    value={form.dateCompleted}
                                    onChange={(e) => setForm((f) => ({ ...f, dateCompleted: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="training-expiry">Expiry date</Label>
                                <Input
                                    id="training-expiry"
                                    type="date"
                                    value={form.expiryDate}
                                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TrainingRecordStatus }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="training-notes">Notes</Label>
                            <Textarea
                                id="training-notes"
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
