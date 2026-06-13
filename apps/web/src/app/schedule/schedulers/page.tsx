"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@studio/ui";
import { Input } from "@studio/ui";
import { Badge } from "@studio/ui";
import { ArrowLeft, LoaderCircle, UserPlus, X, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMinistries } from "@/hooks/use-ministries";
import { useWorkers } from "@/hooks/use-workers";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { addMinistryScheduler, removeMinistryScheduler, getMinistrySchedulers } from "@/actions/schedule";

const stripPrefix = (name: string) => name.replace(/^[WORDA]-/i, '');

export default function SchedulersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const qc = useQueryClient();
    const { canAssignSchedulers, isSuperAdmin, workerProfile } = useUserRole();

    const { ministries, isLoading: ministriesLoading } = useMinistries();

    const { data: schedulerData, isLoading: schedulersLoading } = useQuery({
        queryKey: ['ministry-schedulers'],
        queryFn: getMinistrySchedulers,
    });

    const addMutation = useMutation({
        mutationFn: ({ ministryId, workerId }: { ministryId: string; workerId: string }) =>
            addMinistryScheduler(ministryId, workerId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ministry-schedulers'] });
            toast({ title: "Scheduler added" });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to add scheduler" }),
    });

    const removeMutation = useMutation({
        mutationFn: ({ ministryId, workerId }: { ministryId: string; workerId: string }) =>
            removeMinistryScheduler(ministryId, workerId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ministry-schedulers'] });
            toast({ title: "Scheduler removed" });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to remove scheduler" }),
    });

    const [assignDialog, setAssignDialog] = useState<{ ministryId: string; ministryName: string } | null>(null);
    const [workerSearch, setWorkerSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const handle = setTimeout(() => setDebouncedSearch(workerSearch), 250);
        return () => clearTimeout(handle);
    }, [workerSearch]);

    // Server-side search scoped to the target ministry, so results are fast and complete
    const { workers: ministryWorkers, isLoading: workersLoading } = useWorkers({
        limit: 50,
        ministryIds: assignDialog ? [assignDialog.ministryId] : undefined,
        status: 'Active',
        search: debouncedSearch || undefined,
        searchMode: 'name',
        enabled: !!assignDialog,
    });

    // Department Schedulers can only manage ministries in their department, sorted alpha
    const visibleMinistries = useMemo(() => {
        // Super admins see everything
        if (isSuperAdmin) {
            return [...ministries].sort((a: any, b: any) => stripPrefix(a.name).localeCompare(stripPrefix(b.name)));
        }
        // Department Schedulers: scope to their department
        const userMinistry = ministries.find((m: any) =>
            m.id === workerProfile?.majorMinistryId || m.id === workerProfile?.minorMinistryId
        );
        const userDept = (userMinistry as any)?.department || (userMinistry as any)?.departmentCode;
        if (!userDept) return []; // no ministry set — show nothing
        return ministries
            .filter((m: any) => m.department === userDept || m.departmentCode === userDept)
            .sort((a: any, b: any) => stripPrefix(a.name).localeCompare(stripPrefix(b.name)));
    }, [ministries, isSuperAdmin, workerProfile]);

    const getSchedulers = (ministryId: string) => {
        return schedulerData?.find(s => s.id === ministryId)?.schedulers ?? [];
    };

    // Exclude workers already assigned as schedulers for this ministry
    const assignedIds = useMemo(() => {
        if (!assignDialog) return new Set<string>();
        return new Set(getSchedulers(assignDialog.ministryId).map((s: any) => s.id));
    }, [assignDialog, schedulerData]);

    const filteredWorkers = useMemo(() => {
        return ministryWorkers.filter((w: any) => !assignedIds.has(w.id));
    }, [ministryWorkers, assignedIds]);

    const isLoading = ministriesLoading || schedulersLoading;

    if (!canAssignSchedulers && !isSuperAdmin) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>Only Department Schedulers can manage ministry schedulers.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push("/schedule")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-headline font-bold">Ministry Schedulers</h1>
                    <p className="text-sm text-muted-foreground">Assign one or more Ministry Schedulers to each ministry.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleMinistries.map((ministry: any) => {
                        const schedulers = getSchedulers(ministry.id);
                        return (
                            <Card key={ministry.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">{stripPrefix(ministry.name)}</CardTitle>
                                    <CardDescription className="text-xs">{ministry.department || ministry.departmentCode}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-2">
                                    {schedulers.length > 0 ? (
                                        schedulers.map((scheduler: any) => (
                                            <div key={scheduler.id} className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={scheduler.avatarUrl} />
                                                    <AvatarFallback className="text-xs">
                                                        {scheduler.firstName[0]}{scheduler.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {scheduler.firstName} {scheduler.lastName}
                                                    </p>
                                                    <Badge variant="secondary" className="text-xs">Ministry Scheduler</Badge>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                                                    onClick={() => removeMutation.mutate({ ministryId: ministry.id, workerId: scheduler.id })}>
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span className="text-sm">No scheduler assigned</span>
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm" className="h-7 text-xs"
                                        onClick={() => { setAssignDialog({ ministryId: ministry.id, ministryName: stripPrefix(ministry.name) }); setWorkerSearch(""); setDebouncedSearch(""); }}>
                                        <UserPlus className="mr-1 h-3 w-3" /> Add Scheduler
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Assign Dialog */}
            <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Scheduler — {assignDialog?.ministryName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            placeholder="Search workers..."
                            value={workerSearch}
                            onChange={e => setWorkerSearch(e.target.value)}
                            autoFocus
                        />
                        <div className="max-h-72 overflow-y-auto space-y-1">
                            {workersLoading ? (
                                <div className="flex justify-center py-6">
                                    <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredWorkers.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No workers found.</p>
                            ) : (
                                filteredWorkers.map((w: any) => (
                                    <button
                                        key={w.id}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-left"
                                        onClick={() => {
                                            addMutation.mutate({ ministryId: assignDialog!.ministryId, workerId: w.id });
                                            setAssignDialog(null);
                                        }}
                                    >
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={w.avatarUrl} />
                                            <AvatarFallback className="text-[10px]">{w.firstName[0]}{w.lastName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{w.firstName} {w.lastName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {ministries.find((m: any) => m.id === w.majorMinistryId)?.name || "—"}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
