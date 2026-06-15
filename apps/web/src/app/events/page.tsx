"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@studio/ui";
import { Input } from "@studio/ui";
import { Label } from "@studio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@studio/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@studio/ui";
import { Plus, CalendarDays, MapPin, Users, Package, LoaderCircle, Trash2 } from "lucide-react";
import { useEvents } from "@/hooks/use-events";
import { createEvent } from "@/actions/events";
import { getBranches } from "@/actions/db";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { getYoutubeThumbnail } from "@/lib/youtube";

const STATUS_COLORS: Record<string, string> = {
    Planning:  "bg-yellow-100 text-yellow-800",
    Confirmed: "bg-blue-100 text-blue-800",
    Ongoing:   "bg-green-100 text-green-800",
    Completed: "bg-gray-100 text-gray-700",
    Cancelled: "bg-red-100 text-red-700",
};

export default function EventsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const { workerProfile } = useUserRole();
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const { events, isLoading, deleteEvent } = useEvents(statusFilter);
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState({ title: "", date: "", endDate: "", startTime: "", endTime: "", location: "", description: "", videoUrl: "" });
    const [saving, setSaving] = useState(false);
    const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: getBranches, staleTime: 5 * 60_000 });

    const handleCreate = async () => {
        if (!form.title || !form.date) return;
        setSaving(true);
        try {
            const res = await createEvent({
                title: form.title,
                description: form.description || undefined,
                date: new Date(form.date),
                endDate: form.endDate ? new Date(form.endDate) : undefined,
                startTime: form.startTime || undefined,
                endTime: form.endTime || undefined,
                location: form.location || undefined,
                videoUrl: form.videoUrl || undefined,
                createdBy: workerProfile?.id || user?.uid || "system",
            });
            if (!res.success) throw new Error(res.error);
            const event = res.data;
            setCreateOpen(false);
            setForm({ title: "", date: "", endDate: "", startTime: "", endTime: "", location: "", description: "", videoUrl: "" });
            router.push(`/events/${event.id}`);
        } catch (e: any) {
            toast({ variant: "destructive", title: "Failed to create event", description: e.message });
        } finally {
            setSaving(false);
        }
    };

    const statuses = ["Planning", "Confirmed", "Ongoing", "Completed", "Cancelled"];

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Events</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage big events — rooms, manpower, and equipment all in one place.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Event
                </Button>
            </div>

            <Tabs value={statusFilter ?? "all"} onValueChange={v => setStatusFilter(v === "all" ? undefined : v)}>
                <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    {statuses.map(s => <TabsTrigger key={s} value={s}>{s}</TabsTrigger>)}
                </TabsList>

                <TabsContent value={statusFilter ?? "all"}>
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : events.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center text-muted-foreground">
                                No events found. Create your first event to get started.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {events.map(event => (
                                <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                                    onClick={() => router.push(`/events/${event.id}`)}>
                                    {getYoutubeThumbnail((event as any).videoUrl) && (
                                        <img
                                            src={getYoutubeThumbnail((event as any).videoUrl)!}
                                            alt={event.title}
                                            className="w-full aspect-video object-cover"
                                        />
                                    )}
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-base leading-tight">{event.title}</CardTitle>
                                            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] ?? "bg-muted text-muted-foreground"}`}>
                                                {event.status}
                                            </span>
                                        </div>
                                        {event.description && (
                                            <CardDescription className="text-xs line-clamp-2">{event.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-1.5 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                            <span>{format(new Date(event.date), "MMM d, yyyy")}
                                                {event.startTime && ` · ${event.startTime}`}
                                                {event.endDate && event.endDate !== event.date && ` – ${format(new Date(event.endDate), "MMM d")}`}
                                            </span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{event.assignments.length} roles</span>
                                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.rooms.length} rooms</span>
                                            <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{event.equipment.length} items</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create Event Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Event Title *</Label>
                            <Input placeholder="e.g. Annual Conference, Youth Night" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Date *</Label>
                                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>End Date</Label>
                                <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Start Time</Label>
                                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>End Time</Label>
                                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Location (Satellite)</Label>
                            <Select value={form.location} onValueChange={v => setForm(f => ({ ...f, location: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select satellite" /></SelectTrigger>
                                <SelectContent>
                                    {(branches as any[]).map((b: any) => (
                                        <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Input placeholder="Brief description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Video URL (YouTube)</Label>
                            <Input placeholder="https://www.youtube.com/watch?v=..." value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} />
                        </div>
                        {getYoutubeThumbnail(form.videoUrl) && (
                            <div className="space-y-1.5">
                                <Label>Thumbnail Preview</Label>
                                <img
                                    src={getYoutubeThumbnail(form.videoUrl)!}
                                    alt="Video thumbnail preview"
                                    className="w-full max-w-xs rounded-md border border-border/50 object-cover aspect-video"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button disabled={!form.title || !form.date || saving} onClick={handleCreate}>
                            {saving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />} Create Event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
