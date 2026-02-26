"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Info,
    LoaderCircle,
    Mic,
    Tv,
    Speaker,
    LayoutGrid,
} from "lucide-react";
import {
    format,
    addDays,
    subDays,
    isSameDay,
    isToday,
} from "date-fns";
import { collection, collectionGroup } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Booking, Room, Area, Worker } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export default function DailyViewPage() {
    const { canViewScheduleMasterview, isLoading: roleLoading } = useUserRole();
    const firestore = useFirestore();
    const router = useRouter();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Data fetching
    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const areasRef = useMemoFirebase(() => collection(firestore, "areas"), [firestore]);
    const { data: areas, isLoading: areasLoading } = useCollection<Area>(areasRef);

    const reservationsQuery = useMemoFirebase(() => collectionGroup(firestore, "reservations"), [firestore]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(reservationsQuery);

    const workersRef = useMemoFirebase(() => collection(firestore, "workers"), [firestore]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    const isLoading = roomsLoading || areasLoading || bookingsLoading || workersLoading || roleLoading;

    // Permission guard
    React.useEffect(() => {
        if (!roleLoading && !canViewScheduleMasterview) {
            router.replace("/dashboard");
        }
    }, [canViewScheduleMasterview, roleLoading, router]);

    const handlePrev = () => setCurrentDate(subDays(currentDate, 1));
    const handleNext = () => setCurrentDate(addDays(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const handleBookingClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsOpen(true);
    };

    // Filter to this day's approved bookings only
    const dayBookings = useMemo(() => {
        if (!bookings) return [];
        return bookings.filter(
            (b) =>
                b.status === "Approved" &&
                b.start &&
                isSameDay((b.start as any).toDate(), currentDate)
        );
    }, [bookings, currentDate]);

    // Group by area → room
    const groupedData = useMemo(() => {
        if (!rooms || !areas || dayBookings.length === 0) return [];

        const groups: Record<string, { areaName: string; order: number; items: { room: Room; bookings: Booking[] }[] }> = {};

        dayBookings.forEach((booking) => {
            const room = rooms.find((r) => r.id === booking.roomId);
            if (!room) return;

            const area = areas.find((a) => a.id === room.areaId || a.areaId === room.areaId);
            const areaId = area?.id || "unassigned";
            const areaName = area?.name || "Unassigned Area";

            if (!groups[areaId]) {
                groups[areaId] = { areaName, order: area ? (areas.indexOf(area) ?? 999) : 999, items: [] };
            }

            let roomItem = groups[areaId].items.find((i) => i.room.id === room.id);
            if (!roomItem) {
                roomItem = { room, bookings: [] };
                groups[areaId].items.push(roomItem);
            }
            roomItem.bookings.push(booking);
        });

        // Sort bookings within each room by start time
        Object.values(groups).forEach((group) => {
            group.items.forEach((item) => {
                item.bookings.sort((a, b) => (a.start as any).seconds - (b.start as any).seconds);
            });
            group.items.sort((a, b) => a.room.name.localeCompare(b.room.name));
        });

        return Object.entries(groups).sort((a, b) => a[1].areaName.localeCompare(b[1].areaName));
    }, [rooms, areas, dayBookings]);

    const totalBookings = dayBookings.length;
    const totalRooms = groupedData.reduce((acc, [, g]) => acc + g.items.length, 0);

    if (roleLoading) return null;
    if (!canViewScheduleMasterview) return null;

    return (
        <AppLayout>
            <div className="max-w-[1400px] mx-auto pb-24 space-y-10">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-md">
                                <LayoutGrid className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Room Reservations</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Daily View</h1>
                        <p className="text-slate-500 font-medium">Approved reservations grouped by area and room.</p>
                    </div>

                    {/* Date Navigator */}
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrev}
                                className="h-9 w-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <button
                                onClick={handleToday}
                                className="px-5 py-2 rounded-lg transition-colors hover:bg-slate-50 text-center"
                            >
                                <p className={cn(
                                    "text-lg font-black tracking-tight leading-none",
                                    isToday(currentDate) ? "text-primary" : "text-slate-900"
                                )}>
                                    {format(currentDate, "MMMM d, yyyy")}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-0.5">
                                    {format(currentDate, "EEEE")} {isToday(currentDate) && <span className="text-primary">· Today</span>}
                                </p>
                            </button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNext}
                                className="h-9 w-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Quick stats */}
                        {!isLoading && (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bookings</span>
                                    <p className="text-lg font-black text-slate-900 leading-none">{totalBookings}</p>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rooms In Use</span>
                                    <p className="text-lg font-black text-slate-900 leading-none">{totalRooms}</p>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Areas</span>
                                    <p className="text-lg font-black text-slate-900 leading-none">{groupedData.length}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-48 gap-5">
                        <LoaderCircle className="h-12 w-12 animate-spin text-slate-300" strokeWidth={3} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Loading schedule</p>
                    </div>
                ) : groupedData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-48 text-center bg-gradient-to-b from-slate-50 to-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="h-24 w-24 rounded-3xl bg-white border border-slate-100 flex items-center justify-center mb-8 shadow-xl ring-1 ring-black/5">
                            <CalendarIcon className="h-12 w-12 text-slate-200" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">All Clear</h3>
                        <p className="text-slate-500 max-w-xs mt-3 text-sm font-medium leading-loose">
                            No approved reservations on <span className="font-black text-slate-900">{format(currentDate, "MMMM d, yyyy")}</span>.
                        </p>
                        <div className="flex gap-3 mt-8">
                            <Button variant="outline" onClick={handlePrev} className="gap-2 rounded-xl border-slate-200 font-bold text-slate-600">
                                <ChevronLeft className="h-4 w-4" /> Previous Day
                            </Button>
                            <Button variant="outline" onClick={handleNext} className="gap-2 rounded-xl border-slate-200 font-bold text-slate-600">
                                Next Day <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-14">
                        {groupedData.map(([areaId, group]) => (
                            <section key={areaId} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Area label */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div>
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-900">
                                            {group.areaName}
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                            {group.items.length} {group.items.length === 1 ? "room" : "rooms"} · {group.items.reduce((s, i) => s + i.bookings.length, 0)} bookings
                                        </p>
                                    </div>
                                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                                </div>

                                {/* Rooms table */}
                                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
                                                <TableHead className="w-[200px] h-12 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Room</TableHead>
                                                <TableHead className="w-[230px] h-12 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Time Slot</TableHead>
                                                <TableHead className="h-12 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Event</TableHead>
                                                <TableHead className="w-[90px] h-12 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">AV</TableHead>
                                                <TableHead className="w-[110px] h-12 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Visuals</TableHead>
                                                <TableHead className="w-[56px] h-12" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.items.map((item) =>
                                                item.bookings.map((booking, bIdx) => {
                                                    const isFirstBookingInRoom = bIdx === 0;
                                                    const isLastBookingInRoom = bIdx === item.bookings.length - 1;
                                                    return (
                                                        <TableRow
                                                            key={booking.id}
                                                            className={cn(
                                                                "group transition-colors hover:bg-primary/5",
                                                                !isLastBookingInRoom && "border-b border-dashed border-slate-100",
                                                                isLastBookingInRoom && "border-b border-slate-200"
                                                            )}
                                                        >
                                                            {/* Room name — only show on first booking */}
                                                            <TableCell className={cn(
                                                                "px-6 align-middle",
                                                                isFirstBookingInRoom ? "py-5" : "py-3"
                                                            )}>
                                                                {isFirstBookingInRoom && (
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">
                                                                            {item.room.name}
                                                                        </p>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className={cn(
                                                                                "inline-block h-1.5 w-1.5 rounded-full",
                                                                                item.bookings.length > 0 ? "bg-emerald-500" : "bg-slate-300"
                                                                            )} />
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                                {item.bookings.length} {item.bookings.length === 1 ? "booking" : "bookings"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </TableCell>

                                                            {/* Time */}
                                                            <TableCell className="px-6 py-4 align-middle">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="text-right">
                                                                        <p className="text-[11px] font-black text-slate-800 font-mono tracking-tight">
                                                                            {format((booking.start as any).toDate(), "hh:mm")}
                                                                        </p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                                            {format((booking.start as any).toDate(), "a")}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-col items-center gap-0.5 w-5">
                                                                        <div className="h-px w-full bg-slate-300" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <p className="text-[11px] font-black text-slate-800 font-mono tracking-tight">
                                                                            {format((booking.end as any).toDate(), "hh:mm")}
                                                                        </p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                                            {format((booking.end as any).toDate(), "a")}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>

                                                            {/* Event details */}
                                                            <TableCell className="px-6 py-4 align-middle max-w-xs">
                                                                <p className="text-[13px] font-black text-slate-900 leading-snug truncate">{booking.title}</p>
                                                                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-1 italic mt-0.5">
                                                                    {booking.purpose || "Regular meeting"}
                                                                </p>
                                                            </TableCell>

                                                            {/* AV Equipment */}
                                                            <TableCell className="text-center px-6 py-4 align-middle">
                                                                {(booking.equipment_Mic || booking.equipment_Speakers) ? (
                                                                    <div className="flex flex-col items-center gap-0.5">
                                                                        <Mic className="h-4 w-4 text-emerald-500" />
                                                                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Yes</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-300 font-mono">—</span>
                                                                )}
                                                            </TableCell>

                                                            {/* Visuals */}
                                                            <TableCell className="text-center px-6 py-4 align-middle">
                                                                {booking.equipment_TV ? (
                                                                    <div className="flex flex-col items-center gap-0.5">
                                                                        <Tv className="h-4 w-4 text-blue-500" />
                                                                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">Yes</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-300 font-mono">—</span>
                                                                )}
                                                            </TableCell>

                                                            {/* Info button */}
                                                            <TableCell className="px-3 py-4 align-middle text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-700 transition-all shadow-sm hover:shadow-md opacity-0 group-hover:opacity-100"
                                                                    onClick={() => handleBookingClick(booking)}
                                                                >
                                                                    <Info className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <BookingDetailsSheet
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                booking={selectedBooking}
                roomName={
                    selectedBooking
                        ? rooms?.find((r) => r.id === selectedBooking.roomId)?.name ?? "Unknown Room"
                        : ""
                }
                workers={workers ?? []}
            />
        </AppLayout>
    );
}

// ─── Booking Detail Sheet ───────────────────────────────────────────────────

function BookingDetailsSheet({
    isOpen,
    onClose,
    booking,
    roomName,
    workers,
}: {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    roomName: string;
    workers: Worker[];
}) {
    if (!booking) return null;

    const startTime = (booking.start as any).toDate();
    const endTime = (booking.end as any).toDate();

    const getUserName = (userId: string) => {
        const user = workers.find((w) => w.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : "Unknown";
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md overflow-y-auto border-l-0 shadow-2xl">
                <SheetHeader className="pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                            {booking.status}
                        </Badge>
                    </div>
                    <SheetTitle className="text-2xl font-black text-slate-900 leading-tight tracking-tight uppercase">
                        {booking.title}
                    </SheetTitle>
                    <SheetDescription className="text-slate-500 font-medium">
                        Reservation detail summary and equipment requirements
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-8">
                    <div className="space-y-5">
                        <DetailRow label="Location" value={roomName} />
                        <DetailRow label="Date" value={format(startTime, "PPPP")} />
                        <DetailRow
                            label="Schedule"
                            value={`${format(startTime, "hh:mm a")} — ${format(endTime, "hh:mm a")}`}
                        />
                        <DetailRow
                            label="Requested By"
                            value={getUserName((booking as any).workerProfileId)}
                        />
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Purpose</h4>
                        <p className="text-sm leading-relaxed text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                            &ldquo;{booking.purpose || "No specific purpose provided for this reservation."}&rdquo;
                        </p>
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Technical Requirements</h4>
                        <div className="grid grid-cols-1 gap-3">
                            <EquipmentStatus label="Television / Multimedia" active={!!booking.equipment_TV} icon={Tv} />
                            <EquipmentStatus label="Microphone / Audio" active={!!booking.equipment_Mic} icon={Mic} />
                            <EquipmentStatus label="Sound System / Speakers" active={!!booking.equipment_Speakers} icon={Speaker} />
                        </div>
                    </div>

                    <div className="pt-8 pb-4">
                        <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                            onClick={onClose}
                        >
                            Close Information
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ─── Shared Micro-Components ─────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-bold text-slate-900">{value}</span>
        </div>
    );
}

function EquipmentStatus({ label, active, icon: Icon }: { label: string; active: boolean; icon: any }) {
    return (
        <div className={cn(
            "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
            active
                ? "bg-emerald-50/50 border-emerald-100 text-emerald-900"
                : "bg-slate-50/50 border-slate-100 text-slate-400 opacity-60"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", active ? "bg-white shadow-sm" : "")}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold">{label}</span>
            </div>
            <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-emerald-600" : "text-slate-300")}>
                {active ? "Equipped" : "N / A"}
            </span>
        </div>
    );
}
