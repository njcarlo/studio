

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users as UsersIcon, Tv, Projector, Mic, Monitor, LoaderCircle, Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
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
import type { Booking, Room, Worker, Area, Branch } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useUser, useCollection, addDocumentNonBlocking, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, serverTimestamp, Timestamp, collectionGroup } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const equipmentIcons: { [key: string]: React.ElementType } = {
    Projector: Projector,
    "Sound System": Mic,
    Whiteboard: UsersIcon,
    "Conference Phone": UsersIcon,
    TV: Tv,
    "Gaming Console": UsersIcon,
};

// --- FORMS ---

const BookingForm = ({ rooms, branches, areas, onSave, onClose }: { rooms: Room[], branches: Branch[], areas: Area[], onSave: (booking: any) => Promise<boolean>, onClose: () => void }) => {
    const { user } = useUser();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [locationId, setLocationId] = useState('');
    const [room, setRoom] = useState<string>('');
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isWholeDay, setIsWholeDay] = useState(false);

    // Generate time slots
    const timeSlots = React.useMemo(() => {
        const slots = [];
        for (let h = 6; h <= 21; h++) {
            for (let m = 0; m < 60; m += 30) {
                if (h === 21 && m > 0) continue;
                const hour = h.toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                const value = `${hour}:${minute}`;

                const displayHour = h % 12 || 12;
                const ampm = h < 12 ? 'AM' : 'PM';
                const display = `${displayHour}:${minute.padStart(2, '0')} ${ampm}`;

                slots.push({ value, display });
            }
        }
        return slots;
    }, []);

    const handleLocationChange = (newLocationId: string) => {
        setLocationId(newLocationId);
        setRoom(''); // Reset room selection on location change
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        setIsDatePickerOpen(false);
    }

    const handleSave = async () => {
        if (!date || !room || !title || !user) return;

        let finalStartTime = startTime;
        let finalEndTime = endTime;

        if (isWholeDay) {
            finalStartTime = '06:00';
            finalEndTime = '21:00';
        }

        if (!finalStartTime || !finalEndTime) return;

        const [startH, startM] = finalStartTime.split(':').map(Number);
        const [endH, endM] = finalEndTime.split(':').map(Number);

        const start = new Date(date);
        start.setHours(startH, startM, 0, 0);

        const end = new Date(date);
        end.setHours(endH, endM, 0, 0);

        const success = await onSave({
            roomId: room,
            workerProfileId: user.uid,
            title,
            start: Timestamp.fromDate(start),
            end: Timestamp.fromDate(end),
            status: 'Pending',
        });

        if (success) {
            onClose();
        }
    };

    return (
        <>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select value={locationId} onValueChange={handleLocationChange}>
                        <SelectTrigger id="location"><SelectValue placeholder="Select a location" /></SelectTrigger>
                        <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="room">Room</Label>
                    <Select value={room} onValueChange={setRoom} disabled={!locationId}>
                        <SelectTrigger id="room"><SelectValue placeholder="Select a room" /></SelectTrigger>
                        <SelectContent>
                            {areas.filter(a => a.branchId === locationId).map(area => (
                                <SelectGroup key={area.id}>
                                    <SelectLabel className="px-2 font-bold">{area.name}</SelectLabel>
                                    {rooms.filter(r => r.areaId === area.areaId).map(roomInArea => (
                                        <SelectItem key={roomInArea.id} value={roomInArea.id}>{roomInArea.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="title">Purpose</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Weekly Meeting" />
                </div>
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={handleDateSelect}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="whole-day" checked={isWholeDay} onCheckedChange={(checked) => setIsWholeDay(!!checked)} />
                    <Label htmlFor="whole-day" className="font-normal">Book for whole day (6:00 AM - 9:00 PM)</Label>
                </div>
                <div className="space-y-2">
                    <Label>Time</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Select value={startTime} onValueChange={setStartTime} disabled={isWholeDay}>
                            <SelectTrigger><SelectValue placeholder="Start Time" /></SelectTrigger>
                            <SelectContent>
                                {timeSlots.map(slot => <SelectItem key={`start-${slot.value}`} value={slot.value}>{slot.display}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={endTime} onValueChange={setEndTime} disabled={isWholeDay}>
                            <SelectTrigger><SelectValue placeholder="End Time" /></SelectTrigger>
                            <SelectContent>
                                {timeSlots.slice(1).map(slot => <SelectItem key={`end-${slot.value}`} value={slot.value}>{slot.display}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
                <Button onClick={handleSave}>Request Booking</Button>
            </SheetFooter>
        </>
    );
};

const DayView = ({ bookings, rooms, workers, date }: { bookings: Booking[], rooms: Room[] | undefined, workers: Worker[] | undefined, date: Date }) => {
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
                            <div /> {/* Gutter for room names */}
                            <div className="grid text-xs text-muted-foreground text-center" style={{ gridTemplateColumns: `repeat(${totalHours}, minmax(0, 1fr))` }}>
                                {timeSlots.map(hour => (
                                    <div key={hour}>{hour % 12 || 12}{hour < 12 ? 'am' : 'pm'}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {rooms.map(room => {
                            const roomBookings = dayBookings.filter(b => b.roomId === room.id);

                            return (
                                <div key={room.id} className="grid grid-cols-[8rem_1fr] items-center gap-2">
                                    <div className="font-semibold text-sm truncate pr-2 text-right">{room.name}</div>
                                    <div className="relative h-16 bg-muted/50 rounded-lg">
                                        {/* Background grid lines */}
                                        {timeSlots.slice(1).map(hour => (
                                            <div key={`line-${hour}`} className="absolute h-full border-l" style={{ left: `${((hour - dayStartHour) / totalHours) * 100}%` }} />
                                        ))}
                                        {roomBookings.map(booking => {
                                            const bookingStart = (booking.start as any)?.toDate ? (booking.start as any).toDate() : new Date(booking.start as any);
                                            const bookingEnd = (booking.end as any)?.toDate ? (booking.end as any).toDate() : new Date(booking.end as any);

                                            const left = timeToPosition(bookingStart);
                                            const width = durationToWidth(bookingStart, bookingEnd);

                                            const statusClass = booking.status === 'Approved' ? 'bg-green-500/80 border-green-700 hover:bg-green-500' :
                                                booking.status === 'Pending' ? 'bg-yellow-500/80 border-yellow-700 hover:bg-yellow-500' :
                                                    'bg-red-500/80 border-red-700 hover:bg-red-500';

                                            return (
                                                <TooltipProvider key={booking.id}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={`absolute top-1 bottom-1 p-2 rounded-lg text-white overflow-hidden border transition-colors ${statusClass}`}
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
                </div>
            </CardContent>
        </Card>
    );
}

const WeekView = ({ bookings, rooms, workers, date, onDateSelect }: { bookings: Booking[], rooms?: Room[], workers?: Worker[], date: Date, onDateSelect: (date: Date) => void }) => {
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
                                            booking.status === 'Pending' ? 'bg-yellow-100 border-yellow-300' :
                                                'bg-red-100 border-red-300';
                                        return (
                                            <TooltipProvider key={booking.id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className={cn("p-1.5 rounded-md border", statusColor)}>
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

const MonthView = ({ bookings, onDateSelect, selectedDate }: { bookings: Booking[], onDateSelect: (date: Date) => void, selectedDate: Date }) => {
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
                                                booking.status === 'Pending' ? 'bg-yellow-500' :
                                                    'bg-red-500';
                                            return (
                                                <div key={booking.id} className="flex items-center gap-1.5 w-full">
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

export default function RoomsPage() {
    const { workerProfile, canCreateRoomReservation } = useUserRole();
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const [view, setView] = useState('month'); // 'month', 'week', 'day'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduleFilter, setScheduleFilter] = useState('all');

    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const branchesRef = useMemoFirebase(() => collection(firestore, "branches"), [firestore]);
    const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesRef);

    const areasRef = useMemoFirebase(() => collection(firestore, "areas"), [firestore]);
    const { data: areas, isLoading: areasLoading } = useCollection<Area>(areasRef);

    const workersRef = useMemoFirebase(() => collection(firestore, 'workers'), [firestore]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    const reservationsQuery = useMemoFirebase(() => collectionGroup(firestore, 'reservations'), [firestore]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(reservationsQuery);

    const handleSaveBooking = async (bookingData: any): Promise<boolean> => {
        if (!bookingData.roomId || !workerProfile) {
            toast({ variant: "destructive", title: "Cannot save booking", description: "Worker profile not loaded or room not selected." });
            return false;
        }

        try {
            const reservationRef = await addDocumentNonBlocking(collection(firestore, 'rooms', bookingData.roomId, 'reservations'), bookingData);
            if (reservationRef?.id) {
                await addDocumentNonBlocking(collection(firestore, 'approvals'), {
                    requester: `${workerProfile.firstName} ${workerProfile.lastName}` || 'Unknown User',
                    type: 'Room Booking',
                    details: `"${bookingData.title}" for room: ${rooms?.find(r => r.id === bookingData.roomId)?.name}`,
                    date: serverTimestamp(),
                    status: 'Pending',
                    roomId: bookingData.roomId,
                    reservationId: reservationRef.id,
                    workerId: workerProfile.id
                });
                toast({ title: 'Booking Request Submitted', description: 'Your request has been sent for approval.' });
                return true;
            }
            toast({ variant: "destructive", title: "Request Failed", description: "Could not create reservation reference." });
            return false;
        } catch (error) {
            toast({ variant: "destructive", title: "Request Failed", description: "Could not submit booking request. A permission error might have occurred." });
            return false;
        }
    };

    const isLoading = roomsLoading || bookingsLoading || workersLoading || branchesLoading || areasLoading;

    const filteredRoomsForDayView = useMemo(() => {
        if (view !== 'day' || !rooms || !bookings) return rooms || [];

        const dayBookings = bookings.filter(b => b.start && isSameDay((b.start as any).toDate(), currentDate));
        const scheduledRoomIds = new Set(dayBookings.map(b => b.roomId));

        if (scheduleFilter === 'scheduled') {
            return rooms.filter(r => scheduledRoomIds.has(r.id));
        }
        if (scheduleFilter === 'available') {
            return rooms.filter(r => !scheduledRoomIds.has(r.id));
        }
        return rooms; // 'all'
    }, [view, rooms, bookings, currentDate, scheduleFilter]);

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
                        <Button onClick={() => setIsSheetOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Book a Room
                        </Button>
                    )}
                </div>
            </div>

            {view === 'day' && (
                <div className="flex justify-end items-center gap-2 mt-4">
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
            )}

            <div className="mt-4">
                {isLoading ? (
                    <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <>
                        {view === 'month' && <MonthView bookings={bookings || []} onDateSelect={handleDateSelect} selectedDate={currentDate} />}
                        {view === 'week' && <WeekView bookings={bookings || []} rooms={rooms || []} workers={workers || []} date={currentDate} onDateSelect={handleDateSelect} />}
                        {view === 'day' && <DayView bookings={bookings || []} rooms={filteredRoomsForDayView || []} workers={workers || []} date={currentDate} />}
                    </>
                )}
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="font-headline">Book a Room</SheetTitle>
                        <SheetDescription>Fill in the details to request a room booking. Requests are subject to approval.</SheetDescription>
                    </SheetHeader>
                    {rooms && branches && areas && !isLoading ? (
                        <BookingForm
                            rooms={rooms}
                            branches={branches}
                            areas={areas}
                            onSave={handleSaveBooking}
                            onClose={() => setIsSheetOpen(false)}
                        />
                    ) : (
                        <div className="flex items-center justify-center py-10">
                            <LoaderCircle className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
