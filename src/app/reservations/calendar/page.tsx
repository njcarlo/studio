
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users, Tv, Projector, Mic, Monitor, LoaderCircle, Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight, Clock, CheckCircle2, Timer, Info, Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    format,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isToday,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
    isSameMonth
} from "date-fns";
import { cn } from "@/lib/utils";
import type { Booking, Room, Worker, Area, Branch, VenueElement } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DayView = ({ bookings, rooms, workers, date, areas, onBookingClick }: { bookings: Booking[], rooms: Room[] | undefined, workers: Worker[] | undefined, date: Date, areas: Area[] | undefined, onBookingClick: (b: Booking) => void }) => {
    if (!date) return null;

    if (!rooms || rooms.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No rooms match the current filter.</p>;
    }

    const dayBookings = bookings.filter(b => b.start && isSameDay((b.start as any).toDate(), date));

    const getUserName = (userId: string) => {
        const user = workers?.find(w => w.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
    }

    const dayStartHour = 6;
    const dayEndHour = 21;
    const totalHours = dayEndHour - dayStartHour;

    const timeToPosition = (time: Date) => {
        const hours = time.getHours() + time.getMinutes() / 60;
        const position = ((hours - dayStartHour) / totalHours) * 100;
        return Math.max(0, position);
    }

    const durationToWidth = (start: Date, end: Date) => {
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return (durationHours / totalHours) * 100;
    }

    const timeSlots = Array.from({ length: totalHours }, (_, i) => dayStartHour + i);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Daily Schedule</CardTitle>
                <CardDescription>Visual timeline of all room bookings for the selected day.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 overflow-x-auto">
                <div className="space-y-4 min-w-[800px]">
                    <div className="relative border-b pb-2">
                        <div className="grid grid-cols-[8rem_1fr] gap-2">
                            <div />
                            <div className="grid text-xs text-muted-foreground text-center" style={{ gridTemplateColumns: `repeat(${totalHours}, minmax(0, 1fr))` }}>
                                {timeSlots.map(hour => (
                                    <div key={hour}>{hour % 12 || 12}{hour < 12 ? 'am' : 'pm'}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {(() => {
                            const groupedRooms: Record<string, Room[]> = {};
                            rooms.forEach(room => {
                                const areaId = room.areaId || 'unassigned';
                                if (!groupedRooms[areaId]) groupedRooms[areaId] = [];
                                groupedRooms[areaId].push(room);
                            });

                            return Object.entries(groupedRooms).map(([areaId, areaRooms]) => {
                                const areaName = areaId === 'unassigned' ? 'Unassigned Area' : (areas?.find(a => a.areaId === areaId)?.name || 'Unknown Area');

                                return (
                                    <div key={areaId} className="space-y-2">
                                        <div className="font-bold text-sm text-primary/80 mb-2 pl-2 border-l-2 border-primary/50 tracking-wider uppercase">{areaName}</div>
                                        {areaRooms.map(room => {
                                            const roomBookings = dayBookings.filter(b => b.roomId === room.id);

                                            return (
                                                <div key={room.id} className="grid grid-cols-[8rem_1fr] items-center gap-2">
                                                    <div className="font-semibold text-sm text-muted-foreground truncate pr-2 text-right">{room.name}</div>
                                                    <div className="relative h-16 bg-muted/50 rounded-lg">
                                                        {timeSlots.slice(1).map(hour => (
                                                            <div key={`line-${hour}`} className="absolute h-full border-l" style={{ left: `${((hour - dayStartHour) / totalHours) * 100}%` }} />
                                                        ))}
                                                        {roomBookings.map(booking => {
                                                            const bookingStart = (booking.start as any)?.toDate ? (booking.start as any).toDate() : new Date(booking.start as any);
                                                            const bookingEnd = (booking.end as any)?.toDate ? (booking.end as any).toDate() : new Date(booking.end as any);

                                                            const left = timeToPosition(bookingStart);
                                                            const width = durationToWidth(bookingStart, bookingEnd);

                                                            const statusClass = booking.status === 'Approved' ? 'bg-green-500/80 border-green-700 hover:bg-green-500' :
                                                                booking.status.startsWith('Pending') ? 'bg-yellow-500/80 border-yellow-700 hover:bg-yellow-500' :
                                                                    'bg-red-500/80 border-red-700 hover:bg-red-500';

                                                            return (
                                                                <TooltipProvider key={booking.id}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div
                                                                                onClick={() => onBookingClick(booking)}
                                                                                className={`absolute top-1 bottom-1 p-2 rounded-lg text-white overflow-hidden border transition-colors cursor-pointer ${statusClass}`}
                                                                                style={{ left: `${left}%`, width: `${width}%`, minWidth: '20px' }}
                                                                            >
                                                                                <p className="text-xs font-bold truncate">{booking.title}</p>
                                                                                <p className="text-[10px] truncate opacity-80">{getUserName((booking as any).workerProfileId)}</p>
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="font-bold">{booking.title}</p>
                                                                            <p>{format(bookingStart, 'p')} - {format(bookingEnd, 'p')}</p>
                                                                            <p>By: {getUserName((booking as any).workerProfileId)}</p>
                                                                            <p>Status: {booking.status}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

const WeekView = ({ bookings, rooms, workers, date, onDateSelect, onBookingClick }: { bookings: Booking[], rooms?: Room[], workers?: Worker[], date: Date, onDateSelect: (date: Date) => void, onBookingClick: (b: Booking) => void }) => {
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    const weekDates = eachDayOfInterval({ start, end });

    const weekBookings = useMemo(() => bookings.filter(b => {
        if (!b.start) return false;
        const bookingDate = (b.start as any).toDate();
        return isWithinInterval(bookingDate, { start, end });
    }), [bookings, start, end]);

    const getRoomName = (roomId: string) => rooms?.find(r => r.id === roomId)?.name || 'Unknown Room';

    return (
        <Card>
            <CardContent className="p-0 overflow-x-auto">
                <div className="grid grid-cols-7 divide-x border rounded-lg overflow-hidden min-w-[700px]">
                    {weekDates.map(day => {
                        const dayBookings = weekBookings
                            .filter(b => b.start && isSameDay((b.start as any).toDate(), day))
                            .sort((a, b) => (a.start as any).seconds - (b.start as any).seconds);

                        return (
                            <div key={day.toString()} className="flex flex-col min-h-64">
                                <div className={cn("text-center p-2 border-b font-semibold", isToday(day) && "bg-primary/10 text-primary")}>
                                    <button onClick={() => onDateSelect(day)}>
                                        <p className="text-sm">{format(day, 'EEE')}</p>
                                        <p className="text-2xl">{format(day, 'd')}</p>
                                    </button>
                                </div>
                                <div className="p-2 space-y-2 flex-grow">
                                    {dayBookings.map(booking => {
                                        const statusColor = booking.status === 'Approved' ? 'bg-green-100 border-green-300' :
                                            booking.status.startsWith('Pending') ? 'bg-yellow-100 border-yellow-300' :
                                                'bg-red-100 border-red-300';
                                        return (
                                            <TooltipProvider key={booking.id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            onClick={() => onBookingClick(booking)}
                                                            className={cn("p-1.5 rounded-md border cursor-pointer hover:opacity-80 transition-opacity", statusColor)}
                                                        >
                                                            <p className="text-xs font-bold truncate">{booking.title}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate">{getRoomName(booking.roomId)}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate">{format((booking.start as any).toDate(), 'p')}</p>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="font-bold">{booking.title}</p>
                                                        <p>Room: {getRoomName(booking.roomId)}</p>
                                                        <p>{format((booking.start as any).toDate(), 'p')} - {format((booking.end as any).toDate(), 'p')}</p>
                                                        <p>Status: {booking.status}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

const MonthView = ({ bookings, onDateSelect, selectedDate, onBookingClick }: { bookings: Booking[], onDateSelect: (date: Date) => void, selectedDate: Date, onBookingClick: (b: Booking) => void }) => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);

    const monthDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <Card>
            <CardContent className="p-0 overflow-x-auto">
                <div className="min-w-[700px]">
                    <div className="grid grid-cols-7 text-center text-sm font-semibold text-muted-foreground border-b">
                        {weekDays.map(day => (
                            <div key={day} className="py-2 border-r last:border-r-0">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {monthDays.map((day, index) => {
                            const dayBookings = bookings
                                .filter(b => b.start && isSameDay((b.start as any).toDate(), day))
                                .sort((a, b) => (a.start as any).seconds - (b.start as any).seconds);

                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "h-36 p-1.5 flex flex-col border-t border-r",
                                        (index) % 7 === 0 && "border-l",
                                        !isSameMonth(day, selectedDate) && "bg-muted/50 text-muted-foreground",
                                        "cursor-pointer hover:bg-accent/50"
                                    )}
                                    onClick={() => onDateSelect(day)}
                                >
                                    <span className={cn(
                                        "self-end font-medium",
                                        isToday(day) && "bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="flex-grow space-y-1 mt-1 overflow-hidden">
                                        {dayBookings.slice(0, 3).map(booking => {
                                            const statusColor = booking.status === 'Approved' ? 'bg-green-500' :
                                                booking.status.startsWith('Pending') ? 'bg-yellow-500' :
                                                    'bg-red-500';
                                            return (
                                                <div
                                                    key={booking.id}
                                                    className="flex items-center gap-1.5 w-full hover:bg-black/5 cursor-pointer rounded px-1"
                                                    onClick={(e) => { e.stopPropagation(); onBookingClick(booking); }}
                                                >
                                                    <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", statusColor)} />
                                                    <p className="text-xs truncate">{booking.title}</p>
                                                </div>
                                            )
                                        })}
                                        {dayBookings.length > 3 && (
                                            <p className="text-xs text-muted-foreground">+{dayBookings.length - 3} more</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ReservationCalendarPage() {
    const { canCreateRoomReservation } = useUserRole();
    const firestore = useFirestore();
    const router = useRouter();

    const [view, setView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduleFilter, setScheduleFilter] = useState('all');

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleBookingClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsOpen(true);
    };

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const workersRef = useMemoFirebase(() => collection(firestore, 'workers'), [firestore]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    const reservationsQuery = useMemoFirebase(() => collectionGroup(firestore, 'reservations'), [firestore]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(reservationsQuery);

    const branchesRef = useMemoFirebase(() => collection(firestore, 'branches'), [firestore]);
    const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesRef);

    const areasRef = useMemoFirebase(() => collection(firestore, 'areas'), [firestore]);
    const { data: areas, isLoading: areasLoading } = useCollection<Area>(areasRef);

    const venueElementsRef = useMemoFirebase(() => collection(firestore, "venueElements"), [firestore]);
    const { data: venueElements, isLoading: venueElementsLoading } = useCollection<VenueElement>(venueElementsRef);

    const [branchFilter, setBranchFilter] = useState<string>('');

    // Default to Dasmarinas once branches load
    React.useEffect(() => {
        if (branches && branches.length > 0 && !branchFilter) {
            const dasma = branches.find(b => b.name.toLowerCase().includes('dasma'));
            if (dasma) {
                setBranchFilter(dasma.id);
            } else {
                setBranchFilter('all');
            }
        }
    }, [branches, branchFilter]);

    const isLoading = roomsLoading || bookingsLoading || workersLoading || branchesLoading || areasLoading || venueElementsLoading;

    const filteredRoomsForDayView = useMemo(() => {
        if (view !== 'day' || !rooms || !bookings) return rooms || [];

        let result = rooms;

        // Apply Location / Branch Filter
        if (branchFilter && branchFilter !== 'all' && areas) {
            const branchAreaIds = new Set(areas.filter(a => a.branchId === branchFilter).map(a => a.areaId));
            result = result.filter(r => branchAreaIds.has(r.areaId));
        }

        const dayBookings = bookings.filter(b => b.start && isSameDay((b.start as any).toDate(), currentDate));
        const scheduledRoomIds = new Set(dayBookings.map(b => b.roomId));

        if (scheduleFilter === 'scheduled') {
            result = result.filter(r => scheduledRoomIds.has(r.id));
        }
        else if (scheduleFilter === 'available') {
            result = result.filter(r => !scheduledRoomIds.has(r.id));
        }
        return result;
    }, [view, rooms, bookings, currentDate, scheduleFilter, branchFilter, areas]);

    const handlePrev = () => {
        if (view === 'day') setCurrentDate(subDays(currentDate, 1));
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNext = () => {
        if (view === 'day') setCurrentDate(addDays(currentDate, 1));
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addMonths(currentDate, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    const handleDateSelect = (date: Date) => {
        setCurrentDate(date);
        setView('day');
    };

    const dateRangeDisplay = useMemo(() => {
        if (view === 'day') return format(currentDate, 'MMMM d, yyyy');
        if (view === 'week') {
            const start = startOfWeek(currentDate);
            const end = endOfWeek(currentDate);
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        }
        return format(currentDate, 'MMMM yyyy');
    }, [currentDate, view]);

    return (
        <AppLayout>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" onClick={handleToday}>Today</Button>
                    <Button variant="outline" size="icon" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
                    <h2 className="text-xl font-semibold whitespace-nowrap">{dateRangeDisplay}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Tabs value={view} onValueChange={(v) => setView(v as 'month' | 'week' | 'day')}>
                        <TabsList>
                            <TabsTrigger value="month">Month</TabsTrigger>
                            <TabsTrigger value="week">Week</TabsTrigger>
                            <TabsTrigger value="day">Day</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {canCreateRoomReservation && (
                        <Button onClick={() => router.push("/reservations/new")}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Book a Room
                        </Button>
                    )}
                </div>
            </div>

            {view === 'day' && (
                <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="branch-filter" className="text-sm font-medium">Location:</Label>
                        <Select value={branchFilter || 'all'} onValueChange={setBranchFilter}>
                            <SelectTrigger id="branch-filter" className="w-[180px]">
                                <SelectValue placeholder="All Locations" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {branches?.map(branch => (
                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="schedule-filter" className="text-sm font-medium">Show rooms:</Label>
                        <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
                            <SelectTrigger id="schedule-filter" className="w-[180px]">
                                <SelectValue placeholder="Filter rooms" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Rooms</SelectItem>
                                <SelectItem value="scheduled">With Schedule</SelectItem>
                                <SelectItem value="available">Without Schedule</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <div className="mt-4">
                {isLoading ? (
                    <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <>
                        {view === 'month' && <MonthView bookings={bookings || []} onDateSelect={handleDateSelect} selectedDate={currentDate} onBookingClick={handleBookingClick} />}
                        {view === 'week' && <WeekView bookings={bookings || []} rooms={rooms || []} workers={workers || []} date={currentDate} onDateSelect={handleDateSelect} onBookingClick={handleBookingClick} />}
                        {view === 'day' && <DayView bookings={bookings || []} rooms={filteredRoomsForDayView || []} workers={workers || []} date={currentDate} areas={areas || []} onBookingClick={handleBookingClick} />}
                    </>
                )}
            </div>

            <BookingDetailsSheet
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                booking={selectedBooking}
                roomName={selectedBooking ? (rooms?.find(r => r.id === selectedBooking.roomId)?.name || "Unknown Room") : ""}
                workers={workers || []}
                venueElements={venueElements || []}
            />
        </AppLayout>
    );
}

const BookingDetailsSheet = ({ isOpen, onClose, booking, roomName, workers, venueElements }: { isOpen: boolean; onClose: () => void; booking: Booking | null; roomName: string; workers: Worker[]; venueElements: VenueElement[]; }) => {
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
                <SheetHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn(
                            "px-2 py-0.5",
                            booking.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                booking.status.startsWith('Pending') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                            {booking.status}
                        </Badge>
                        {booking.requestId && (
                            <span className="text-xs font-mono text-muted-foreground">ID: {booking.requestId}</span>
                        )}
                    </div>
                    <SheetTitle className="text-2xl font-headline font-bold">{booking.title}</SheetTitle>
                    <SheetDescription>Reservation Details & Requirements</SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                                <p className="font-semibold">{roomName}</p>
                                <p className="text-muted-foreground text-xs">Venue Location</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <div>
                                <p className="font-semibold">{format(startTime, "PPPP")}</p>
                                <p className="text-muted-foreground text-xs">Event Date</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-primary" />
                            <div>
                                <p className="font-semibold">{format(startTime, "p")} - {format(endTime, "p")}</p>
                                <p className="text-muted-foreground text-xs">Reserved Time</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Purpose</h4>
                        <p className="text-sm leading-relaxed">{booking.purpose || "No description provided."}</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-bold">{booking.pax}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Pax</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-bold">{booking.numTables || 0}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Tables</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <Info className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-bold">{booking.numChairs || 0}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Chairs</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Requested Elements</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {booking.requestedElements && booking.requestedElements.length > 0 ? (
                                booking.requestedElements.map(elId => {
                                    const el = venueElements.find(v => v.id === elId);
                                    return (
                                        <div key={elId} className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>{el ? el.name : elId} <span className="text-xs text-muted-foreground ml-1">({el?.category || "Unknown"})</span></span>
                                        </div>
                                    );
                                })
                            ) : null}

                            {/* Legacy fallback */}
                            {(!booking.requestedElements || booking.requestedElements.length === 0) && (
                                <>
                                    {booking.equipment_TV && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>Television / Display (Legacy)</span>
                                        </div>
                                    )}
                                    {booking.equipment_Mic && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>Microphone System (Legacy)</span>
                                        </div>
                                    )}
                                    {booking.equipment_Speakers && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>Sound System / Speakers (Legacy)</span>
                                        </div>
                                    )}
                                    {!booking.equipment_TV && !booking.equipment_Mic && !booking.equipment_Speakers && (
                                        <p className="text-sm text-muted-foreground italic">No elements requested.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            <span>Requested on: {booking.dateRequested ? format((booking.dateRequested as any).toDate(), "PPP p") : "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>Requested by: {getUserName((booking as any).workerProfileId)}</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full mt-4" onClick={onClose}>Close Details</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
