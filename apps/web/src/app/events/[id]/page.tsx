"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@studio/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@studio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@studio/ui";
import { Input } from "@studio/ui";
import { Label } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@studio/ui";
import {
    ArrowLeft, LoaderCircle, Plus, Trash2, UserPlus, X,
    CalendarDays, MapPin, Package, Users, Link2, CheckCircle2,
} from "lucide-react";
import { useEvent } from "@/hooks/use-events";
import { getInventoryItemsForPicker } from "@/actions/events";
import { useQuery } from "@tanstack/react-query";
import { useMinistries } from "@/hooks/use-ministries";
import { useRooms } from "@/hooks/use-rooms";
import { useWorkersLite } from "@/hooks/use-workers";
import { useServiceSchedules } from "@/hooks/use-schedule";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = ["Planning", "Confirmed", "Ongoing", "Completed", "Cancelled"];
const STATUS_COLORS: Record<string, string> = {
    Planning: "bg-yellow-100 text-yellow-800",
    Confirmed: "bg-blue-100 text-blue-800",
    Ongoing: "bg-green-100 text-green-800",
    Completed: "bg-gray-100 text-gray-700",
    Cancelled: "bg-red-100 text-red-700",
};

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const { workerProfile } = useUserRole();
    const { user } = useAuthStore();

    const { event, isLoading, updateEvent, addRoom, removeRoom, upsertAssignment, deleteAssignment, addEquipment, updateEquipment, removeEquipment } = useEvent(id);
    const { ministries } = useMinistries();
    const { rooms } = useRooms();
    const { data: workers = [] } = useWorkersLite();
    const { schedules } = useServiceSchedules?.() ?? { schedules: [] };
    const { data: inventoryItems = [] } = useQuery({
        queryKey: ['inventoryItems', 'picker'],
        queryFn: getInventoryItemsForPicker,
        staleTime: 5 * 60_000,
    });

    // Dialogs
    const [addRoomOpen, setAddRoomOpen] = useState(false);
    const [roomForm, setRoomForm] = useState({ roomId: "", startTime: "", endTime: "", purpose: "" });
    const [addMinistryOpen, setAddMinistryOpen] = useState(false);
    const [assignDialog, setAssignDialog] = useState<{ assignmentId?: string; ministryId: string; roleName: string } | null>(null);
    const [addRoleDialog, setAddRoleDialog] = useState<string | null>(null);
    const [newRoleName, setNewRoleName] = useState("");
    const [workerSearch, setWorkerSearch] = useState("");
    const [addEquipOpen, setAddEquipOpen] = useState(false);
    const [equipForm, setEquipForm] = useState({ itemId: "", quantity: 1, notes: "" });
    const [linkScheduleOpen, setLinkScheduleOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Group assignments by ministry
    const byMinistry = useMemo(() => {
        if (!event) return {} as Record<string, any[]>;
        return event.assignments.reduce<Record<string, any[]>>((acc, a) => {
            if (!acc[a.ministryId]) acc[a.ministryId] = [];
            acc[a.ministryId].push(a);
            return acc;
        }, {});
    }, [event]);

    const ministriesInEvent = Object.keys(byMinistry);
    const ministriesNotInEvent = ministries.filter((m: any) => !ministriesInEvent.includes(m.id));

    const filteredWorkers = useMemo(() => {
        if (!assignDialog) return [];
        const q = workerSearch.toLowerCase().trim();
        return workers
            .filter((w: any) => w.status === "Active" && (!q || `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) || (w.workerId || "").includes(q)))
            .sort((a: any, b: any) => {
                const inMinistry = (w: any) => w.majorMinistryId === assignDialog.ministryId || w.minorMinistryId === assignDialog.ministryId;
                return (inMinistry(b) ? 1 : 0) - (inMinistry(a) ? 1 : 0);
            })
            .slice(0, 60);
    }, [workers, workerSearch, assignDialog]);

    const eventEquipment = useMemo(() => event?.equipment ?? [], [event]);

    const handleAssign = async (workerId: string | null) => {
        if (!assignDialog) return;
        await upsertAssignment({
            id: assignDialog.assignmentId,
            eventId: id,
            ministryId: assignDialog.ministryId,
            roleName: assignDialog.roleName,
            workerId,
            workerName: workerId ? (() => { const w = workers.find((x: any) => x.id === workerId); return w ? `${w.firstName} ${w.lastName}` : null; })() : null,
        });
        setAssignDialog(null);
        setWorkerSearch("");
    };

    if (isLoading || !event) {
        return <AppLayout><div className="flex justify-center py-20"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
    }

    return (
        <AppLayout>
            {/* Header */}
            <div className="flex items-start gap-3 mb-6">
                <Button variant="ghost" size="icon" className="mt-0.5" onClick={() => router.push("/events")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-headline font-bold truncate">{event.title}</h1>
                        <Select value={event.status} onValueChange={v => updateEvent({ status: v })}>
                            <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 focus:ring-0 text-sm font-medium">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[event.status] ?? "bg-muted"}`}>{event.status}</span>
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />
                            {format(new Date(event.date), "MMMM d, yyyy")}
                            {event.startTime && ` · ${event.startTime}`}{event.endTime && `–${event.endTime}`}
                            {event.endDate && event.endDate !== event.date && ` to ${format(new Date(event.endDate), "MMM d, yyyy")}`}
                        </span>
                        {event.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>}
                    </div>
                    {event.description && <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>}
                </div>
                {event.scheduleId && (
                    <Button variant="outline" size="sm" onClick={() => router.push(`/schedule/${event.scheduleId}`)}>
                        <Link2 className="mr-1 h-3.5 w-3.5" /> View Schedule
                    </Button>
                )}
                {!event.scheduleId && (
                    <Button variant="outline" size="sm" onClick={() => setLinkScheduleOpen(true)}>
                        <Link2 className="mr-1 h-3.5 w-3.5" /> Link Schedule
                    </Button>
                )}
            </div>

            <Tabs defaultValue="manpower">
                <TabsList className="mb-4">
                    <TabsTrigger value="manpower">
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                        Manpower
                        <Badge variant="secondary" className="ml-1.5 text-xs">{event.assignments.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="rooms">
                        <MapPin className="mr-1.5 h-3.5 w-3.5" />
                        Rooms
                        <Badge variant="secondary" className="ml-1.5 text-xs">{event.rooms.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="equipment">
                        <Package className="mr-1.5 h-3.5 w-3.5" />
                        Equipment
                        <Badge variant="secondary" className="ml-1.5 text-xs">{event.equipment.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* ── MANPOWER ── */}
                <TabsContent value="manpower">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ministry Assignments</h2>
                        <Button size="sm" onClick={() => setAddMinistryOpen(true)}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Add Ministry
                        </Button>
                    </div>

                    {ministriesInEvent.length === 0 && (
                        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No ministries added yet.</CardContent></Card>
                    )}

                    <div className="space-y-4">
                        {ministriesInEvent.map(ministryId => {
                            const assignments = byMinistry[ministryId] ?? [];
                            const ministry = ministries.find((m: any) => m.id === ministryId);
                            const byRole = assignments.reduce<Record<string, any[]>>((acc, a) => {
                                if (!acc[a.roleName]) acc[a.roleName] = [];
                                acc[a.roleName].push(a);
                                return acc;
                            }, {});
                            return (
                                <Card key={ministryId}>
                                    <CardHeader className="py-3 px-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-base">{(ministry as any)?.name ?? ministryId}</CardTitle>
                                                <span className="text-xs text-muted-foreground">{assignments.filter((a: any) => a.workerId).length}/{assignments.length} filled</span>
                                            </div>
                                            <div className="flex gap-1">
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
                                    <CardContent className="pt-0 pb-4 px-4 space-y-4">
                                        {Object.entries(byRole).map(([roleName, slots]) => (
                                            <div key={roleName}>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{roleName}</p>
                                                <div className="space-y-1.5">
                                                    {(slots as any[]).map((slot: any) => (
                                                        <div key={slot.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                                                            {slot.workerId ? (
                                                                <>
                                                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarImage src={workers.find((w: any) => w.id === slot.workerId)?.avatarUrl} />
                                                                        <AvatarFallback className="text-[10px]">{slot.workerName?.split(" ").map((n: string) => n[0]).join("") ?? "?"}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-sm flex-1">{slot.workerName}</span>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6"
                                                                        onClick={() => setAssignDialog({ assignmentId: slot.id, ministryId, roleName })}>
                                                                        <UserPlus className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                                                        onClick={() => deleteAssignment(slot.id)}>
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                                                                    <span className="text-sm text-muted-foreground flex-1">Unassigned</span>
                                                                    <Button variant="ghost" size="sm" className="h-7 text-xs"
                                                                        onClick={() => setAssignDialog({ assignmentId: slot.id, ministryId, roleName })}>
                                                                        <UserPlus className="mr-1 h-3 w-3" /> Assign
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                                                        onClick={() => deleteAssignment(slot.id)}>
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* ── ROOMS ── */}
                <TabsContent value="rooms">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Room Reservations</h2>
                        <Button size="sm" onClick={() => setAddRoomOpen(true)}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Add Room
                        </Button>
                    </div>
                    {event.rooms.length === 0 && (
                        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No rooms reserved yet.</CardContent></Card>
                    )}
                    <div className="space-y-3">
                        {event.rooms.map((rb: any) => (
                            <Card key={rb.id}>
                                <CardContent className="py-3 px-4 flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{rb.room.name}</p>
                                        <p className="text-xs text-muted-foreground">{rb.room.area?.name}{rb.room.area?.branch ? ` · ${rb.room.area.branch.name}` : ""}</p>
                                        {rb.purpose && <p className="text-xs text-muted-foreground mt-0.5">{rb.purpose}</p>}
                                    </div>
                                    <div className="text-sm text-right shrink-0">
                                        <p className="font-medium">{rb.startTime} – {rb.endTime}</p>
                                        <p className="text-xs text-muted-foreground">Cap: {rb.room.capacity}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                                        onClick={() => removeRoom(rb.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* ── EQUIPMENT ── */}
                <TabsContent value="equipment">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Equipment & Inventory</h2>
                        <Button size="sm" onClick={() => { setEquipForm({ itemId: "", quantity: 1, notes: "" }); setAddEquipOpen(true); }}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
                        </Button>
                    </div>
                    {event.equipment.length === 0 && (
                        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No equipment added yet.</CardContent></Card>
                    )}
                    <div className="space-y-2">
                        {event.equipment.map((eq: any) => (
                            <Card key={eq.id}>
                                <CardContent className="py-3 px-4 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{eq.item.name}</p>
                                        <p className="text-xs text-muted-foreground">{eq.item.category?.name}</p>
                                        {eq.notes && <p className="text-xs text-muted-foreground">{eq.notes}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input type="number" min={1} className="h-7 w-16 text-center text-sm"
                                            value={eq.quantity}
                                            onChange={async e => {
                                                const q = parseInt(e.target.value);
                                                if (q > 0) await updateEquipment({ eid: eq.id, data: { quantity: q } });
                                            }} />
                                        <span className="text-xs text-muted-foreground">{eq.item.unit ?? "pcs"}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                            onClick={() => removeEquipment(eq.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Add Room Dialog */}
            <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Room Reservation</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Room</Label>
                            <Select value={roomForm.roomId} onValueChange={v => setRoomForm(f => ({ ...f, roomId: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                                <SelectContent>
                                    {rooms.map((r: any) => (
                                        <SelectItem key={r.id} value={r.id}>{r.name} <span className="text-muted-foreground text-xs ml-1">· cap {r.capacity}</span></SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Start Time</Label>
                                <Input type="time" value={roomForm.startTime} onChange={e => setRoomForm(f => ({ ...f, startTime: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>End Time</Label>
                                <Input type="time" value={roomForm.endTime} onChange={e => setRoomForm(f => ({ ...f, endTime: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Purpose</Label>
                            <Input placeholder="e.g. Main Session, Registration Area" value={roomForm.purpose}
                                onChange={e => setRoomForm(f => ({ ...f, purpose: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddRoomOpen(false)}>Cancel</Button>
                        <Button disabled={!roomForm.roomId || !roomForm.startTime || !roomForm.endTime}
                            onClick={async () => {
                                await addRoom({ eventId: id, ...roomForm });
                                setAddRoomOpen(false);
                            }}>Add Room</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Ministry Dialog */}
            <Dialog open={addMinistryOpen} onOpenChange={setAddMinistryOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Ministry</DialogTitle></DialogHeader>
                    <div className="max-h-72 overflow-y-auto space-y-1 py-2">
                        {ministriesNotInEvent.map((m: any) => (
                            <button key={m.id} className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-accent text-left"
                                onClick={async () => {
                                    await upsertAssignment({ eventId: id, ministryId: m.id, roleName: "Role", order: 0 });
                                    setAddMinistryOpen(false);
                                }}>
                                <span className="text-sm flex-1">{m.name}</span>
                                <span className="text-xs text-muted-foreground">{m.department}</span>
                            </button>
                        ))}
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setAddMinistryOpen(false)}>Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Role to Ministry Dialog */}
            <Dialog open={!!addRoleDialog} onOpenChange={() => setAddRoleDialog(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Role</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Role Name</Label>
                            <Input placeholder="e.g. Worship Leader, Sound Engineer" value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)} autoFocus />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddRoleDialog(null)}>Cancel</Button>
                        <Button disabled={!newRoleName.trim()} onClick={async () => {
                            if (!addRoleDialog) return;
                            await upsertAssignment({ eventId: id, ministryId: addRoleDialog, roleName: newRoleName.trim(), order: byMinistry[addRoleDialog]?.length ?? 0 });
                            setAddRoleDialog(null);
                            setNewRoleName("");
                        }}>Add Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Worker Dialog */}
            <Dialog open={!!assignDialog} onOpenChange={() => { setAssignDialog(null); setWorkerSearch(""); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Worker — {assignDialog?.roleName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input placeholder="Search by name or ID..." value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} autoFocus />
                        <div className="max-h-72 overflow-y-auto space-y-1">
                            {filteredWorkers.map((w: any) => (
                                <button key={w.id} className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-accent text-left"
                                    onClick={() => handleAssign(w.id)}>
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src={w.avatarUrl} />
                                        <AvatarFallback className="text-[10px]">{w.firstName[0]}{w.lastName[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm flex-1">{w.firstName} {w.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{w.workerId ?? ""}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        {assignDialog?.assignmentId && <Button variant="ghost" className="mr-auto text-destructive" onClick={() => handleAssign(null)}>Clear</Button>}
                        <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Equipment Dialog */}
            <Dialog open={addEquipOpen} onOpenChange={setAddEquipOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Item</Label>
                            <Select value={equipForm.itemId} onValueChange={v => setEquipForm(f => ({ ...f, itemId: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select inventory item" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {inventoryItems.map((item: any) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name}
                                            {item.category?.name && <span className="text-muted-foreground text-xs ml-1">· {item.category.name}</span>}
                                            <span className="text-muted-foreground text-xs ml-1">({item.quantity} {item.unit ?? "pcs"} avail)</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Quantity</Label>
                            <Input type="number" min={1} value={equipForm.quantity} onChange={e => setEquipForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Input placeholder="Optional notes" value={equipForm.notes} onChange={e => setEquipForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddEquipOpen(false)}>Cancel</Button>
                        <Button disabled={!equipForm.itemId || equipForm.itemId === "_placeholder"}
                            onClick={async () => {
                                await addEquipment({ eventId: id, itemId: equipForm.itemId, quantity: equipForm.quantity, notes: equipForm.notes || undefined });
                                setAddEquipOpen(false);
                            }}>Add</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Link Schedule Dialog */}
            <Dialog open={linkScheduleOpen} onOpenChange={setLinkScheduleOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Link to Service Schedule</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground py-2">Link this event to an existing service schedule so ministry assignments stay in sync.</p>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                        {(schedules ?? []).slice(0, 20).map((s: any) => (
                            <button key={s.id} className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-accent text-left"
                                onClick={async () => {
                                    await updateEvent({ scheduleId: s.id });
                                    setLinkScheduleOpen(false);
                                }}>
                                <span className="text-sm flex-1">{s.title || "Sunday Service"}</span>
                                <span className="text-xs text-muted-foreground">{format(new Date(s.date), "MMM d, yyyy")}</span>
                            </button>
                        ))}
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setLinkScheduleOpen(false)}>Cancel</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
