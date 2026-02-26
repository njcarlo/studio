
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
    Search,
    Filter,
    ChevronFirst,
    ChevronLast
} from "lucide-react";
import {
    format,
    isAfter,
    startOfToday
} from "date-fns";
import {
    collection,
    collectionGroup
} from "firebase/firestore";
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
import { Input } from "@/components/ui/input";

const ITEMS_PER_PAGE = 20;

export default function MasterviewPage() {
    const { canViewScheduleMasterview, isLoading: roleLoading } = useUserRole();
    const firestore = useFirestore();
    const router = useRouter();

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'all' | 'upcoming'>('all');

    // Fetching data
    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const areasRef = useMemoFirebase(() => collection(firestore, 'areas'), [firestore]);
    const { data: areas, isLoading: areasLoading } = useCollection<Area>(areasRef);

    const reservationsQuery = useMemoFirebase(() => collectionGroup(firestore, 'reservations'), [firestore]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(reservationsQuery);

    const workersRef = useMemoFirebase(() => collection(firestore, 'workers'), [firestore]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    const isLoading = roomsLoading || areasLoading || bookingsLoading || workersLoading || roleLoading;

    // Protection
    React.useEffect(() => {
        if (!roleLoading && !canViewScheduleMasterview) {
            router.replace("/dashboard");
        }
    }, [canViewScheduleMasterview, roleLoading, router]);

    const handleBookingClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsOpen(true);
    };

    // Process bookings
    const filteredBookings = useMemo(() => {
        if (!bookings) return [];

        let result = [...bookings]
            .filter(b => b.status === 'Approved')
            .sort((a, b) => (b.start as any).seconds - (a.start as any).seconds); // Descending by default

        if (viewMode === 'upcoming') {
            const today = startOfToday();
            result = result.filter(b => isAfter((b.start as any).toDate(), today));
            result.sort((a, b) => (a.start as any).seconds - (b.start as any).seconds); // Ascending for upcoming
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(b =>
                b.title.toLowerCase().includes(query) ||
                b.purpose?.toLowerCase().includes(query) ||
                rooms?.find(r => r.id === b.roomId)?.name.toLowerCase().includes(query)
            );
        }

        return result;
    }, [bookings, viewMode, searchQuery, rooms]);

    // Pagination
    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    const paginatedBookings = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredBookings, currentPage]);

    if (roleLoading) return null;
    if (!canViewScheduleMasterview) return null;

    return (
        <AppLayout>
            <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Schedule Masterview</h1>
                        <p className="text-slate-500 font-medium tracking-wide">Comprehensive reservation manifest and facility utilization.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-100 p-1 rounded-lg flex items-center shadow-inner border border-slate-200">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("text-[10px] font-black uppercase tracking-widest px-4 h-8 rounded-md transition-all", viewMode === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500')}
                                onClick={() => { setViewMode('all'); setCurrentPage(1); }}
                            >
                                History
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("text-[10px] font-black uppercase tracking-widest px-4 h-8 rounded-md transition-all", viewMode === 'upcoming' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500')}
                                onClick={() => { setViewMode('upcoming'); setCurrentPage(1); }}
                            >
                                Upcoming
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-grow w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by title, purpose, or room..."
                            className="pl-10 h-11 border-slate-200 focus-visible:ring-primary/20 rounded-lg text-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="h-11 px-4 gap-2 border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50">
                            <Filter className="h-4 w-4" /> Filter
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <LoaderCircle className="h-12 w-12 animate-spin text-primary/30" strokeWidth={3} />
                        <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase">Synchronizing Data</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-48 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-xl ring-1 ring-slate-200">
                            <CalendarIcon className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Zero Results</h3>
                        <p className="text-slate-500 max-w-xs mt-3 text-sm font-medium leading-relaxed">
                            No approved reservations match your current search or filter criteria.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ring-1 ring-slate-200/50">
                            <Table>
                                <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[180px] font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] h-14 px-6">Venue</TableHead>
                                        <TableHead className="w-[200px] font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] h-14 px-6">Date & Time</TableHead>
                                        <TableHead className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] h-14 px-6">Event Details</TableHead>
                                        <TableHead className="w-[100px] font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] text-center h-14 px-6">AV</TableHead>
                                        <TableHead className="w-[120px] font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] text-center h-14 px-6">Visuals</TableHead>
                                        <TableHead className="w-[60px] h-14 px-6"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-100">
                                    {paginatedBookings.map((booking) => {
                                        const room = rooms?.find(r => r.id === booking.roomId);
                                        const area = areas?.find(a => a.id === room?.areaId || a.areaId === room?.areaId);
                                        return (
                                            <TableRow key={booking.id} className="group transition-colors hover:bg-slate-50/50">
                                                <TableCell className="py-6 px-6 align-top">
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-900 text-[13px] leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">{room?.name || "Room"}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{area?.name || "Main"}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-6 align-top">
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-800 text-xs">{format((booking.start as any).toDate(), 'MMM. d, yyyy')}</p>
                                                        <p className="text-[11px] font-mono text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                                            {format((booking.start as any).toDate(), 'hh:mm a')} - {format((booking.end as any).toDate(), 'hh:mm a')}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-6 align-top max-w-sm">
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-900 text-[14px] leading-snug">{booking.title}</p>
                                                        <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2">{booking.purpose || "Regular meeting"}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-6 px-6 align-top">
                                                    {(booking.equipment_Mic || booking.equipment_Speakers) ? (
                                                        <div className="flex justify-center items-center h-full">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <Mic className="h-4 w-4 text-emerald-500 mb-0.5" />
                                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Equipped</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 font-mono italic">None</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center py-6 px-6 align-top">
                                                    {booking.equipment_TV ? (
                                                        <div className="flex justify-center items-center h-full">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <Tv className="h-4 w-4 text-blue-500 mb-0.5" />
                                                                <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">Equipped</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 font-mono italic">None</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-6 px-6 align-top">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all shadow-sm hover:shadow-lg border border-transparent hover:border-slate-800"
                                                        onClick={() => handleBookingClick(booking)}
                                                    >
                                                        <Info className="h-5 w-5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between px-2 bg-white/50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-900">{Math.min(filteredBookings.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(filteredBookings.length, currentPage * ITEMS_PER_PAGE)}</span> of <span className="text-slate-900">{filteredBookings.length}</span> Records
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 border-slate-200 rounded-lg disabled:opacity-30"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronFirst className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 border-slate-200 rounded-lg disabled:opacity-30"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1.5 px-3">
                                    <span className="text-xs font-black text-slate-900">{currentPage}</span>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">of</span>
                                    <span className="text-xs font-bold text-slate-500">{totalPages || 1}</span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 border-slate-200 rounded-lg disabled:opacity-30"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 border-slate-200 rounded-lg disabled:opacity-30"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronLast className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <BookingDetailsSheet
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                booking={selectedBooking}
                roomName={selectedBooking ? (rooms?.find(r => r.id === selectedBooking.roomId)?.name || "Unknown Room") : ""}
                workers={workers || []}
            />
        </AppLayout>
    );
}

const BookingDetailsSheet = ({ isOpen, onClose, booking, roomName, workers }: { isOpen: boolean; onClose: () => void; booking: Booking | null; roomName: string; workers: Worker[] }) => {
    if (!booking) return null;

    const startTime = (booking.start as any).toDate();
    const endTime = (booking.end as any).toDate();

    const getUserName = (userId: string) => {
        const user = workers?.find(w => w.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md overflow-y-auto border-l-0 shadow-2xl">
                <SheetHeader className="pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase">
                            {booking.status}
                        </Badge>
                    </div>
                    <SheetTitle className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">{booking.title}</SheetTitle>
                    <SheetDescription className="text-slate-500 font-medium">Reservation detail summary and equipment requirements</SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-8">
                    <div className="space-y-6">
                        <DetailRow label="Location" value={roomName} />
                        <DetailRow label="Date" value={format(startTime, "PPPP")} />
                        <DetailRow label="Schedule" value={`${format(startTime, "hh:mm a")} - ${format(endTime, "hh:mm a")}`} />
                        <DetailRow label="Requested By" value={getUserName((booking as any).workerProfileId)} />
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Purpose</h4>
                        <p className="text-sm leading-relaxed text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                            "{booking.purpose || "No specific purpose provided for this reservation."}"
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
                        <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors" onClick={onClose}>
                            Close Information
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
);

const EquipmentStatus = ({ label, active, icon: Icon }: { label: string, active: boolean, icon: any }) => (
    <div className={cn(
        "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
        active ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" : "bg-slate-50/50 border-slate-100 text-slate-400 opacity-60"
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
