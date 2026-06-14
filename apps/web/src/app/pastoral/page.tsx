"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { LoaderCircle, HandHeart } from "lucide-react";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import {
    getPrayerRequestsAction,
    updatePrayerRequestStatusAction,
} from "@/actions/prayer-requests";
import type { PrayerRequest } from "@studio/types";

const STATUS_OPTIONS: PrayerRequest["status"][] = ["New", "In Progress", "Resolved"];
const STATUS_COLORS: Record<string, string> = {
    New: "bg-blue-100 text-blue-800",
    "In Progress": "bg-yellow-100 text-yellow-800",
    Resolved: "bg-green-100 text-green-800",
};

export default function PastoralPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { canManagePastoral, workerProfile, isLoading: isPermissionsLoading } = useUserRole();

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ["prayer-requests"],
        queryFn: async () => {
            const res = await getPrayerRequestsAction();
            if (!res.success) throw new Error(res.error);
            return res.data as PrayerRequest[];
        },
        enabled: canManagePastoral,
    });

    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [selected, setSelected] = useState<PrayerRequest | null>(null);
    const [response, setResponse] = useState("");
    const [status, setStatus] = useState<string>("New");

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!selected) return;
            const res = await updatePrayerRequestStatusAction(selected.id, {
                status: status as PrayerRequest["status"],
                response: response || null,
                assignedTo: workerProfile?.id ?? null,
            });
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: "Request updated" });
            queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
            setSelected(null);
        },
        onError: () => toast({ variant: "destructive", title: "Could not update request" }),
    });

    const openDetail = (request: PrayerRequest) => {
        setSelected(request);
        setStatus(request.status);
        setResponse(request.response ?? "");
    };

    const filtered = requests.filter((r) => statusFilter === "All" || r.status === statusFilter);

    if (!isPermissionsLoading && !canManagePastoral) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                    <HandHeart className="h-12 w-12 text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground text-center max-w-md">
                        You don't have permission to view pastoral care requests. Contact an administrator
                        to request access.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pastoral Care</h1>
                        <p className="text-muted-foreground">
                            Prayer and counselling requests submitted via the public site.
                        </p>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HandHeart className="h-5 w-5 text-primary" /> Requests
                        </CardTitle>
                        <CardDescription>
                            Click a request to view details and update its status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                No requests found.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Submitted</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((request) => (
                                        <TableRow
                                            key={request.id}
                                            className="cursor-pointer"
                                            onClick={() => openDetail(request)}
                                        >
                                            <TableCell className="font-medium">{request.name}</TableCell>
                                            <TableCell>{request.type}</TableCell>
                                            <TableCell className="max-w-xs truncate">{request.message}</TableCell>
                                            <TableCell>
                                                <Badge className={STATUS_COLORS[request.status]} variant="secondary">
                                                    {request.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{format(new Date(request.createdAt as any), "MMM d, yyyy")}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selected?.type} Request — {selected?.name}</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p><span className="font-medium text-foreground">Email:</span> {selected.email}</p>
                                {selected.phone && <p><span className="font-medium text-foreground">Phone:</span> {selected.phone}</p>}
                                <p><span className="font-medium text-foreground">Submitted:</span> {format(new Date(selected.createdAt as any), "MMMM d, yyyy h:mm a")}</p>
                            </div>
                            <div className="rounded-md border p-3 text-sm bg-muted/30">
                                {selected.message}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pastoral-status">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger id="pastoral-status">
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
                                <Label htmlFor="pastoral-response">Internal Notes / Response</Label>
                                <Textarea
                                    id="pastoral-response"
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    placeholder="Notes about how this was handled..."
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                        <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
