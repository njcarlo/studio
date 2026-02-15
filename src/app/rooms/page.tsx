
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users as UsersIcon, Tv, Projector, Mic, Monitor, LoaderCircle, Calendar as CalendarIcon, MapPin } from "lucide-react";
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
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Booking, Room, Worker, Location } from "@/lib/types";
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

const BookingForm = ({ rooms, onSave, onClose }: { rooms: Room[], onSave: (booking: any) => Promise<boolean>, onClose: () => void }) => {
  const { user } = useUser();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
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
                <Label htmlFor="room">Room</Label>
                <Select value={room} onValueChange={setRoom}>
                    <SelectTrigger id="room"><SelectValue placeholder="Select a room" /></SelectTrigger>
                    <SelectContent>{rooms.map(room => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}</SelectContent>
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

const DailyScheduleView = ({ bookings, rooms, workers, date }: { bookings: Booking[], rooms: Room[] | undefined, workers: Worker[] | undefined, date: Date }) => {
    if (!date) return null;

    const getUserName = (userId: string) => {
        const user = workers?.find(w => w.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
    }

    if (!bookings || bookings.length === 0 || !rooms) {
        return <p className="text-muted-foreground text-center py-8">No bookings for this day.</p>;
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
        <div className="space-y-4">
            <div className="relative border-b pb-2">
                 <div className="grid grid-cols-[6rem_1fr] gap-2">
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
                    const roomBookings = bookings.filter(b => b.roomId === room.id);
                    if (roomBookings.length === 0) return null;

                    return (
                        <div key={room.id} className="grid grid-cols-[6rem_1fr] items-center gap-2">
                            <div className="font-semibold text-sm truncate pr-2 text-right">{room.name}</div>
                            <div className="relative h-16 bg-muted/50 rounded-lg">
                                {/* Background grid lines */}
                                {timeSlots.slice(1).map(hour => (
                                    <div key={`line-${hour}`} className="absolute h-full border-l" style={{ left: `${((hour - dayStartHour) / totalHours) * 100}%` }} />
                                ))}
                                {roomBookings.map(booking => {
                                    const bookingStart = (booking.start as any)?.toDate ? (booking.start as any).toDate() : new Date(booking.start);
                                    const bookingEnd = (booking.end as any)?.toDate ? (booking.end as any).toDate() : new Date(booking.end);
                                    
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
    );
}

const RoomScheduleList = ({ bookings, workers }: { bookings: Booking[], workers: Worker[] | undefined }) => {
    const getUserName = (userId: string) => {
        const user = workers?.find(w => w.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
    };

    const bookingsByDate = useMemo(() => {
        const grouped = new Map<string, Booking[]>();
        bookings.forEach(booking => {
            if (!booking.start) return;
            const dateKey = format((booking.start as any).toDate(), 'yyyy-MM-dd');
            const dayBookings = grouped.get(dateKey) || [];
            dayBookings.push(booking);
            grouped.set(dateKey, dayBookings);
        });
        return grouped;
    }, [bookings]);

    const sortedDates = useMemo(() => Array.from(bookingsByDate.keys()).sort(), [bookingsByDate]);

    if (bookings.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No upcoming bookings for this room.</p>;
    }

    return (
        <div className="space-y-6">
            {sortedDates.map(date => {
                const dayBookings = bookingsByDate.get(date)!;
                return (
                    <div key={date}>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                           {format(new Date(date + 'T00:00:00'), 'eeee, MMMM d')}
                        </h4>
                        <div className="space-y-3 border-l-2 pl-6 ml-2">
                            {dayBookings.map(booking => {
                                const bookingStart = (booking.start as any).toDate();
                                const bookingEnd = (booking.end as any).toDate();

                                return (
                                    <div key={booking.id} className="flex items-start space-x-4 relative">
                                        <div className="absolute -left-[2.1rem] top-2 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{booking.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(bookingStart, 'p')} - {format(bookingEnd, 'p')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                by {getUserName((booking as any).workerProfileId)}
                                            </p>
                                        </div>
                                        <Badge variant={booking.status === 'Approved' ? 'default' : 'secondary'} className={`ml-auto ${booking.status === 'Approved' ? 'bg-green-100 text-green-800' : booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{booking.status}</Badge>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
};


export default function RoomsPage() {
    const { isSuperAdmin, workerProfile } = useUserRole();
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("schedule");
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    const roomsRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, "rooms");
    }, [firestore, user]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const locationsRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, "locations");
    }, [firestore, user]);
    const { data: locations, isLoading: locationsLoading } = useCollection<Location>(locationsRef);
    
    const workersRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, 'workers');
    }, [firestore, user]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    const reservationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return collectionGroup(firestore, 'reservations');
    }, [firestore, user]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(reservationsQuery);


    const handleSaveBooking = async (bookingData: any): Promise<boolean> => {
        if (!bookingData.roomId || !workerProfile) {
            toast({
                variant: "destructive",
                title: "Cannot save booking",
                description: "Worker profile not loaded or room not selected.",
            });
            return false;
        }
    
        try {
            const reservationRef = await addDocumentNonBlocking(
                collection(firestore, 'rooms', bookingData.roomId, 'reservations'), 
                bookingData
            );
    
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
    
                toast({
                    title: 'Booking Request Submitted',
                    description: 'Your request has been sent for approval.',
                });
                return true;
            }
            toast({
                variant: "destructive",
                title: "Request Failed",
                description: "Could not create reservation reference.",
            });
            return false;

        } catch (error) {
             toast({
                variant: "destructive",
                title: "Request Failed",
                description: "Could not submit booking request. A permission error might have occurred.",
            });
            return false;
        }
    };
    
    const handleViewRoomSchedule = (room: Room) => {
        setSelectedRoom(room);
        setActiveTab('room-schedule');
    };

    const isLoading = roomsLoading || bookingsLoading || locationsLoading || workersLoading;

    const bookingsByDate = useMemo(() => {
        if (!bookings) return new Map<string, Booking[]>();

        const newMap = new Map<string, Booking[]>();
        for (const booking of bookings) {
            if (!booking.start) continue;
            const dateKey = format((booking.start as any).toDate(), 'yyyy-MM-dd');
            
            const existingBookings = newMap.get(dateKey) || [];
            if (!existingBookings.find(b => b.id === booking.id)) {
                newMap.set(dateKey, [...existingBookings, booking]);
            }
        }
        return newMap;

    }, [bookings]);

    const dayBookings = useMemo(() => {
        if (!selectedDate || !bookingsByDate) return [];
        return bookingsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    }, [selectedDate, bookingsByDate]);
    
    const roomBookings = useMemo(() => {
        if (!selectedRoom || !bookings) return [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return bookings
            .filter(b => {
                if (b.roomId !== selectedRoom.id) return false;
                const bookingEndDate = (b.end as any)?.toDate();
                if (!bookingEndDate) return false;
                return bookingEndDate >= today;
            })
            .sort((a, b) => (a.start as any).seconds - (b.start as any).seconds);
    }, [selectedRoom, bookings]);
    
    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Room Reservations</h1>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Book a Room
                </Button>
            </div>

            <div className="mt-4 space-y-4">
                {isLoading && <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>}
                {!isLoading && rooms && (
                    <div className="grid md:grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
                       <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Calendar</CardTitle>
                                <CardDescription>Select a date to view schedules.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center overflow-x-auto">
                                <Calendar 
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="p-0"
                                    classNames={{ day: "h-12 w-12 text-base", head_cell: "w-12 text-center" }}
                                    components={{ DayContent: ({ date }) => {
                                        const bookingsOnDay = bookingsByDate.get(format(date, 'yyyy-MM-dd'));
                                        return <div className="relative h-full w-full flex items-center justify-center">
                                            <span>{date.getDate()}</span>
                                            {bookingsOnDay && bookingsOnDay.length > 0 && (
                                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </div>;
                                    }}}
                                />
                            </CardContent>
                        </Card>
                        
                        <Tabs value={activeTab} onValueChange={(tab) => {
                                if (tab !== 'room-schedule') setSelectedRoom(null);
                                setActiveTab(tab);
                            }} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="schedule">Schedule for {selectedDate ? format(selectedDate, 'MMM d') : 'selected day'}</TabsTrigger>
                                <TabsTrigger value="rooms">All Rooms</TabsTrigger>
                                <TabsTrigger value="room-schedule" disabled={!selectedRoom}>
                                    {selectedRoom ? `${selectedRoom.name}` : 'Room Schedule'}
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="schedule" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="font-headline">Daily Schedule</CardTitle>
                                        <CardDescription>Visual timeline of all room bookings for the selected day.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <DailyScheduleView bookings={dayBookings} rooms={rooms} workers={workers} date={selectedDate!} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="rooms" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="font-headline">Available Rooms</CardTitle>
                                        <CardDescription>All bookable rooms and their equipment.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {rooms.map(room => {
                                            const location = locations?.find(l => l.id === room.locationId);
                                            return (
                                            <div key={room.id} className="p-4 border rounded-lg bg-card">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold">{room.name}</h3>
                                                        {location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3"/>{location.name}</p>}
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><UsersIcon className="h-4 w-4" /> Capacity: {room.capacity}</p>
                                                    </div>
                                                     <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleViewRoomSchedule(room)}><CalendarIcon className="mr-2 h-4 w-4"/>Schedule</Button>
                                                        {isSuperAdmin && <Button asChild variant="outline" size="sm"><Link href={`/rooms/${room.id}/display`}><Monitor className="mr-2 h-4 w-4"/>Display</Link></Button>}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {room.equipment.map(item => {
                                                        const Icon = equipmentIcons[item] || UsersIcon;
                                                        return <Badge key={item} variant="secondary" className="flex items-center gap-1"><Icon className="h-3 w-3" /> {item}</Badge>
                                                    })}
                                                </div>
                                            </div>
                                        )})}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="room-schedule" className="mt-4">
                                {selectedRoom ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="font-headline">Upcoming Schedule for {selectedRoom.name}</CardTitle>
                                            <CardDescription>All future and current bookings for this room.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <RoomScheduleList bookings={roomBookings} workers={workers} />
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">Select a room from the 'All Rooms' tab to see its schedule.</div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent className="sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="font-headline">Book a Room</SheetTitle>
                    <SheetDescription>Fill in the details to request a room booking. Requests are subject to approval.</SheetDescription>
                </SheetHeader>
                {rooms && !isLoading ? (
                    <BookingForm rooms={rooms} onSave={handleSaveBooking} onClose={() => setIsSheetOpen(false)} />
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

