
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
            .sort((a, b) => (b.start as any).seconds - (a.start as any).seconds);

        if (viewMode === 'upcoming') {
            const today = startOfToday();
            result = result.filter(b => isAfter((b.start as any).toDate(), today));
            result.sort((a, b) => (a.start as any).seconds - (b.start as any).seconds);
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
            <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">Schedule Masterview</h1>
                        <p className="text-muted-foreground">Comprehensive reservation manifest and facility utilization.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-muted p-1 rounded-lg flex items-center border">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("text-xs font-medium px-4 h-8 rounded-md transition-all", viewMode === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
                                onClick={() => { setViewMode('all'); setCurrentPage(1); }}
                            >
                                History
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("text-xs font-medium px-4 h-8 rounded-md transition-all", viewMode === 'upcoming' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
                                onClick={() => { setViewMode('upcoming'); setCurrentPage(1); }}
                            >
                                Upcoming
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-3 rounded-lg border">
                    <div className="relative flex-grow w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, purpose, or room..."
                            className="pl-10 text-sm"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="gap-2 text-sm">
                            <Filter className="h-4 w-4" /> Filter
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4">
                            <CalendarIcon className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-semibold">No Reservations Found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-2">
                            No approved reservations match your current search or filter criteria.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg border overflow-hidden bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[160px] h-9 px-3 text-xs">Venue</TableHead>
                                        <TableHead className="w-[180px] h-9 px-3 text-xs">Date & Time</TableHead>
                                        <TableHead className="h-9 px-3 text-xs">Event Details</TableHead>
                                        <TableHead className="w-[80px] h-9 px-3 text-xs text-center">AV</TableHead>
                                        <TableHead className="w-[90px] h-9 px-3 text-xs text-center">Visuals</TableHead>
                                        <TableHead className="w-[50px] h-9 px-2" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedBookings.map((booking) => {
                                        const room = rooms?.find(r => r.id === booking.roomId);
                                        const area = areas?.find(a => a.id === room?.areaId || a.areaId === room?.areaId);
                                        return (
                                            <TableRow key={booking.id} className="group">
                                                <TableCell className="py-2 px-3 align-middle">
                                                    <div>
                                                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{room?.name || "Room"}</p>
                                                        <p className="text-xs text-muted-foreground">{area?.name || "Main"}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 px-3 align-middle">
                                                    <div>
                                                        <p className="text-sm">{format((booking.start as any).toDate(), 'MMM d, yyyy')}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format((booking.start as any).toDate(), 'h:mm a')} – {format((booking.end as any).toDate(), 'h:mm a')}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 px-3 align-middle max-w-sm">
                                                    <div>
                                                        <p className="font-medium text-sm">{booking.title}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{booking.purpose || "Regular meeting"}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center py-2 px-3 align-middle">
                                                    {(booking.equipment_Mic || booking.equipment_Speakers) ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <Mic className="h-4 w-4 text-emerald-500" />
                                                            <span className="text-[10px] text-emerald-600">Yes</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/40">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center py-2 px-3 align-middle">
                                                    {booking.equipment_TV ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <Tv className="h-4 w-4 text-blue-500" />
                                                            <span className="text-[10px] text-blue-600">Yes</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/40">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-2 px-3 align-middle">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                                                        onClick={() => handleBookingClick(booking)}
                                                    >
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between px-1 pt-2">
                            <p className="text-xs text-muted-foreground">
                                Showing <span className="font-medium text-foreground">{Math.min(filteredBookings.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}–{Math.min(filteredBookings.length, currentPage * ITEMS_PER_PAGE)}</span> of <span className="font-medium text-foreground">{filteredBookings.length}</span> entries
                            </p>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg disabled:opacity-30"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronFirst className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg disabled:opacity-30"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1 px-2">
                                    <span className="text-xs font-medium">{currentPage}</span>
                                    <span className="text-xs text-muted-foreground">of</span>
                                    <span className="text-xs text-muted-foreground">{totalPages || 1}</span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg disabled:opacity-30"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg disabled:opacity-30"
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
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader className="pb-6 border-b">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 text-xs">
                            {booking.status}
                        </Badge>
                    </div>
                    <SheetTitle className="text-2xl font-headline font-bold">{booking.title}</SheetTitle>
                    <SheetDescription>Reservation detail summary and equipment requirements</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <div className="space-y-4">
                        <DetailRow label="Location" value={roomName} />
                        <DetailRow label="Date" value={format(startTime, "PPPP")} />
                        <DetailRow label="Schedule" value={`${format(startTime, "h:mm a")} – ${format(endTime, "h:mm a")}`} />
                        <DetailRow label="Requested By" value={getUserName((booking as any).workerProfileId)} />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Purpose</h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {booking.purpose || "No specific purpose provided for this reservation."}
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h4 className="text-xs font-medium text-muted-foreground">Technical Requirements</h4>
                        <div className="grid grid-cols-1 gap-2">
                            <EquipmentStatus label="Television / Multimedia" active={!!booking.equipment_TV} icon={Tv} />
                            <EquipmentStatus label="Microphone / Audio" active={!!booking.equipment_Mic} icon={Mic} />
                            <EquipmentStatus label="Sound System / Speakers" active={!!booking.equipment_Speakers} icon={Speaker} />
                        </div>
                    </div>

                    <Button variant="outline" className="w-full mt-4" onClick={onClose}>Close Details</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
    </div>
);

const EquipmentStatus = ({ label, active, icon: Icon }: { label: string, active: boolean, icon: any }) => (
    <div className={cn(
        "flex items-center justify-between p-2.5 rounded-lg border transition-colors",
        active ? "bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/20" : "opacity-50"
    )}>
        <div className="flex items-center gap-2.5">
            <Icon className={cn("h-4 w-4", active ? "text-green-600" : "text-muted-foreground")} />
            <span className="text-xs font-medium">{label}</span>
        </div>
        <span className={cn("text-xs", active ? "text-green-600" : "text-muted-foreground/40")}>
            {active ? "Yes" : "No"}
        </span>
    </div>
);
