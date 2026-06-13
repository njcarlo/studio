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
import { Checkbox } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Alert, AlertDescription } from "@studio/ui";
import { LoaderCircle, PlusCircle, CalendarDays, MapPin, AlertTriangle } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { getMinistries } from "@/actions/db";
import {
    getMajorEventCatalog,
    getMajorEventSetting,
    createMajorEventRequest,
    getMyMajorEventRequests,
} from "@/actions/major-events";

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Pending: "secondary",
    Approved: "default",
    Declined: "destructive",
    Rejected: "destructive",
};

export default function MajorEventsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { workerProfile, isLoading: isPermissionsLoading } = useUserRole();

    const { data: ministries = [] } = useQuery({
        queryKey: ["ministries"],
        queryFn: getMinistries,
    });

    const { data: catalog = [], isLoading: isCatalogLoading } = useQuery({
        queryKey: ["majorEventCatalog"],
        queryFn: getMajorEventCatalog,
    });

    const { data: setting, isLoading: isSettingLoading } = useQuery({
        queryKey: ["majorEventSetting"],
        queryFn: async () => {
            const res = await getMajorEventSetting();
            return res.success ? res.data : null;
        },
    });

    const { data: requests = [], isLoading: isRequestsLoading } = useQuery({
        queryKey: ["myMajorEventRequests", workerProfile?.id],
        queryFn: async () => {
            const res = await getMyMajorEventRequests();
            return res.success ? res.data : [];
        },
        enabled: !!workerProfile,
    });

    const ministryNameById = useMemo(
        () => new Map(ministries.map((m: any) => [m.id, m.name])),
        [ministries],
    );

    const catalogByMinistry = useMemo(() => {
        const map = new Map<string, typeof catalog>();
        for (const item of catalog) {
            if (!item.active) continue;
            if (!map.has(item.ministryId)) map.set(item.ministryId, []);
            map.get(item.ministryId)!.push(item);
        }
        return map;
    }, [catalog]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [location, setLocation] = useState("");
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setEventDate("");
        setEndDate("");
        setLocation("");
        setSelectedItemIds(new Set());
    };

    const toggleItem = (itemId: string) => {
        setSelectedItemIds((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!workerProfile) return;
        if (!title.trim()) {
            toast({ variant: "destructive", title: "Title is required" });
            return;
        }
        if (!eventDate) {
            toast({ variant: "destructive", title: "Event date is required" });
            return;
        }
        if (selectedItemIds.size === 0) {
            toast({ variant: "destructive", title: "Select at least one service item" });
            return;
        }

        const items = catalog
            .filter((item) => selectedItemIds.has(item.id))
            .map((item) => ({
                catalogItemId: item.id,
                ministryId: item.ministryId,
                name: item.name,
            }));

        setIsSubmitting(true);
        try {
            const res = await createMajorEventRequest({
                title: title.trim(),
                description: description.trim() || undefined,
                eventDate: new Date(eventDate),
                endDate: endDate ? new Date(endDate) : undefined,
                location: location.trim() || undefined,
                ministryId: workerProfile.majorMinistryId,
                items,
            });
            if (!res.success) throw new Error(res.error);

            toast({ title: "Major Event request submitted" });
            queryClient.invalidateQueries({ queryKey: ["myMajorEventRequests"] });
            setIsFormOpen(false);
            resetForm();
        } catch (err: any) {
            toast({ variant: "destructive", title: "Submission failed", description: err?.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isPermissionsLoading || isCatalogLoading || isSettingLoading || isRequestsLoading;
    const requestsEnabled = setting?.enabled ?? true;

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Major Event Requests</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Request cross-ministry support for a major event.
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)} disabled={!requestsEnabled || isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Request
                </Button>
            </div>

            {!requestsEnabled && (
                <Alert className="mt-4" variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Major Event requests are currently disabled by a System Administrator.
                    </AlertDescription>
                </Alert>
            )}

            <div className="mt-6 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                ) : requests.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            You haven&apos;t submitted any Major Event requests yet.
                        </CardContent>
                    </Card>
                ) : (
                    requests.map((request) => (
                        <Card key={request.id}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base">{request.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {new Date(request.eventDate as any).toLocaleDateString()}
                                        </span>
                                        {request.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {request.location}
                                            </span>
                                        )}
                                    </CardDescription>
                                </div>
                                <Badge variant={STATUS_BADGE_VARIANT[request.status] ?? "secondary"}>
                                    {request.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                {request.description && (
                                    <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {(request.items ?? []).map((item: any) => (
                                        <Badge key={item.id} variant={STATUS_BADGE_VARIANT[item.status] ?? "secondary"}>
                                            {item.name} ({ministryNameById.get(item.ministryId) ?? item.ministryId}) — {item.status}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* New request dialog */}
            <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>New Major Event Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="me-title">Title</Label>
                            <Input id="me-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="me-description">Description</Label>
                            <Textarea id="me-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="me-event-date">Event date</Label>
                                <Input id="me-event-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="me-end-date">End date (optional)</Label>
                                <Input id="me-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="me-location">Location</Label>
                            <Input id="me-location" value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>

                        <div className="space-y-3">
                            <Label>Service items needed</Label>
                            {catalogByMinistry.size === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No service catalogue items have been configured yet.
                                </p>
                            ) : (
                                Array.from(catalogByMinistry.entries()).map(([ministryId, items]) => (
                                    <div key={ministryId} className="space-y-2">
                                        <p className="text-sm font-medium">{ministryNameById.get(ministryId) ?? ministryId}</p>
                                        <div className="space-y-2 pl-2">
                                            {items.map((item) => (
                                                <div key={item.id} className="flex items-start gap-2">
                                                    <Checkbox
                                                        id={`item-${item.id}`}
                                                        checked={selectedItemIds.has(item.id)}
                                                        onCheckedChange={() => toggleItem(item.id)}
                                                    />
                                                    <Label htmlFor={`item-${item.id}`} className="font-normal leading-tight">
                                                        {item.name}
                                                        {item.description && (
                                                            <span className="block text-xs text-muted-foreground">{item.description}</span>
                                                        )}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
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
