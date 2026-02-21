
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users as UsersIcon, Tv, Projector, Mic, Monitor, LoaderCircle, Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
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
import type { Booking, Room, Worker } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
                            <div />
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

export default function ReservationCalendarPage() {
    const { canCreateRoomReservation } = useUserRole();
    const firestore = useFirestore();
    const router = useRouter();

    const [view, setView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduleFilter, setScheduleFilter] = useState('all');

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const workersRef = useMemoFirebase(() => collection(firestore, 'workers'), [firestore]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    const reservationsQuery = useMemoFirebase(() => collectionGroup(firestore, 'reservations'), [firestore]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(reservationsQuery);

    const isLoading = roomsLoading || bookingsLoading || workersLoading;

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
        return rooms;
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
                        <Button onClick={() => router.push("/reservations/new")}>
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
        </AppLayout>
    );
}
