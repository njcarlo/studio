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
import { Progress } from "@studio/ui";
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
import { LoaderCircle, PlusCircle, CalendarOff } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { getMyLeaveBalances, getMyLeaveRequests, createLeaveRequest } from "@/actions/leave";

const LEAVE_TYPES = [
    { value: "Vacation", label: "Vacation Leave", consumesBalance: true },
    { value: "Sick", label: "Sick Leave", consumesBalance: true },
    { value: "Emergency", label: "Emergency Leave", consumesBalance: true },
    { value: "ChangeTime", label: "Change Time", consumesBalance: false },
    { value: "ChangeDayOff", label: "Change Day Off", consumesBalance: false },
] as const;

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Pending: "secondary",
    Approved: "default",
    Rejected: "destructive",
};

export default function LeavePage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { workerProfile, isLoading: isPermissionsLoading } = useUserRole();
    const isFullTime = workerProfile?.employmentType === "Full-Time";

    const { data: balances = [], isLoading: isBalancesLoading } = useQuery({
        queryKey: ["myLeaveBalances", workerProfile?.id],
        queryFn: async () => {
            const res = await getMyLeaveBalances();
            return res.success ? res.data! : [];
        },
        enabled: !!workerProfile && isFullTime,
    });

    const { data: requests = [], isLoading: isRequestsLoading } = useQuery({
        queryKey: ["myLeaveRequests", workerProfile?.id],
        queryFn: async () => {
            const res = await getMyLeaveRequests();
            return res.success ? res.data! : [];
        },
        enabled: !!workerProfile && isFullTime,
    });

    const balanceByType = useMemo(() => {
        const map = new Map<string, (typeof balances)[number]>();
        for (const b of balances) map.set(b.type, b);
        return map;
    }, [balances]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [type, setType] = useState<string>("Vacation");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [newShiftStart, setNewShiftStart] = useState("08:00");
    const [newShiftEnd, setNewShiftEnd] = useState("17:00");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedType = LEAVE_TYPES.find((t) => t.value === type)!;
    const isSingleDate = type === "ChangeTime" || type === "ChangeDayOff";

    const resetForm = () => {
        setType("Vacation");
        setStartDate("");
        setEndDate("");
        setReason("");
        setNewShiftStart("08:00");
        setNewShiftEnd("17:00");
    };

    const handleSubmit = async () => {
        if (!startDate) {
            toast({ variant: "destructive", title: "Date is required" });
            return;
        }
        if (!reason.trim()) {
            toast({ variant: "destructive", title: "Reason is required" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createLeaveRequest({
                type: type as any,
                startDate: new Date(startDate),
                endDate: new Date(isSingleDate ? startDate : (endDate || startDate)),
                reason: reason.trim(),
                newShiftStart: type === "ChangeTime" ? newShiftStart : undefined,
                newShiftEnd: type === "ChangeTime" ? newShiftEnd : undefined,
            });
            if (!res.success) throw new Error(res.error);

            toast({ title: "Request submitted" });
            queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] });
            queryClient.invalidateQueries({ queryKey: ["myLeaveBalances"] });
            setIsFormOpen(false);
            resetForm();
        } catch (err: any) {
            toast({ variant: "destructive", title: "Submission failed", description: err?.message });
        } finally {
            setIsSubmitting(false);
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

    if (!isFullTime) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarOff className="h-5 w-5 text-muted-foreground" />
                            Leave & Requests
                        </CardTitle>
                        <CardDescription>
                            Leave & Request filing is available to Full-Time workers only.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    const isLoading = isBalancesLoading || isRequestsLoading;

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Leave & Requests</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        File a leave or schedule-change request and track its approval.
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Request
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {isBalancesLoading ? (
                    <div className="col-span-3 flex justify-center py-6">
                        <LoaderCircle className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    balances.map((balance) => {
                        const remaining = balance.totalDays - balance.usedDays;
                        const pct = balance.totalDays > 0 ? Math.min(100, (balance.usedDays / balance.totalDays) * 100) : 0;
                        return (
                            <Card key={balance.type}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{balance.type} Leave</CardTitle>
                                    <CardDescription>{remaining} of {balance.totalDays} day(s) remaining</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Progress value={pct} />
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base">My Requests</CardTitle>
                    <CardDescription>Status of your filed leave and schedule-change requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <LoaderCircle className="h-8 w-8 animate-spin" />
                        </div>
                    ) : requests.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            You haven&apos;t filed any requests yet.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Dates</TableHead>
                                    <TableHead>Days</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>{LEAVE_TYPES.find((t) => t.value === request.type)?.label ?? request.type}</TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(request.startDate as any).toLocaleDateString()}
                                            {new Date(request.startDate as any).toDateString() !== new Date(request.endDate as any).toDateString() && (
                                                <> – {new Date(request.endDate as any).toLocaleDateString()}</>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">{request.days}</TableCell>
                                        <TableCell className="text-sm max-w-xs truncate">{request.reason}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={STATUS_BADGE_VARIANT[request.status] ?? "secondary"}>
                                                {request.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* New request dialog */}
            <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>New Leave / Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEAVE_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedType.consumesBalance && (() => {
                                const balance = balanceByType.get(type);
                                if (!balance) return null;
                                const remaining = balance.totalDays - balance.usedDays;
                                return (
                                    <p className="text-xs text-muted-foreground">
                                        {remaining} of {balance.totalDays} day(s) remaining
                                    </p>
                                );
                            })()}
                        </div>

                        {isSingleDate ? (
                            <div className="space-y-2">
                                <Label htmlFor="leave-date">Date</Label>
                                <Input id="leave-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leave-start">Start date</Label>
                                    <Input id="leave-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="leave-end">End date</Label>
                                    <Input id="leave-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {type === "ChangeTime" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-shift-start">New shift start</Label>
                                    <Input id="new-shift-start" type="time" value={newShiftStart} onChange={(e) => setNewShiftStart(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-shift-end">New shift end</Label>
                                    <Input id="new-shift-end" type="time" value={newShiftEnd} onChange={(e) => setNewShiftEnd(e.target.value)} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="leave-reason">Reason</Label>
                            <Textarea id="leave-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
