

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users, Tv, Projector, Mic, Monitor, LoaderCircle, Calendar as CalendarIcon, MapPin } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Booking, Room, Worker, Location } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useUser, useCollection, addDocumentNonBlocking, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const equipmentIcons: { [key: string]: React.ElementType } = {
  Projector: Projector,
  "Sound System": Mic,
  Whiteboard: Users,
  "Conference Phone": Users,
  TV: Tv,
  "Gaming Console": Users,
};

// --- FORMS ---

const BookingForm = ({ rooms, onSave, onClose }: { rooms: Room[], onSave: (booking: any) => Promise<boolean>, onClose: () => void }) => {
  const { user } = useUser();
  const [date, setDate] = useState<Date>();
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
        <SheetHeader>
            <SheetTitle className="font-headline">Book a Room</SheetTitle>
            <SheetDescription>Fill in the details to request a room booking. Requests are subject to approval.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room" className="text-right">Room</Label>
                <Select value={room} onValueChange={setRoom}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a room" /></SelectTrigger>
                    <SelectContent>{rooms.map(room => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Purpose</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Weekly Meeting" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                </Popover>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <div />
                <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox id="whole-day" checked={isWholeDay} onCheckedChange={(checked) => setIsWholeDay(!!checked)} />
                    <Label htmlFor="whole-day" className="font-normal">Book for whole day (6:00 AM - 9:00 PM)</Label>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Time</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
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


export default function RoomsPage() {
    const { isSuperAdmin } = useUserRole();
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'worker_profiles', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<Worker>(userProfileRef);


    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
    const { data: locations, isLoading: locationsLoading } = useCollection<Location>(locationsRef);

    const bookingsRef = useMemoFirebase(() => rooms?.[0]?.id ? collection(firestore, 'rooms', rooms[0].id, 'reservations') : null, [firestore, rooms]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsRef);

    const handleSaveBooking = async (bookingData: any): Promise<boolean> => {
        if (!bookingData.roomId || !userProfile) {
            toast({
                variant: "destructive",
                title: "Cannot save booking",
                description: "User profile not loaded or room not selected.",
            });
            return false;
        }
    
        try {
            const reservationRef = await addDocumentNonBlocking(
                collection(firestore, 'rooms', bookingData.roomId, 'reservations'), 
                bookingData
            );
    
            if (reservationRef) {
                await addDocumentNonBlocking(collection(firestore, 'approvals'), {
                    requester: `${userProfile.firstName} ${userProfile.lastName}` || 'Unknown User',
                    type: 'Room Booking',
                    details: `"${bookingData.title}" for room: ${rooms?.find(r => r.id === bookingData.roomId)?.name}`,
                    date: serverTimestamp(),
                    status: 'Pending',
                    roomId: bookingData.roomId,
                    reservationId: reservationRef.id
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

    const isLoading = roomsLoading || bookingsLoading || locationsLoading;
    
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
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="font-headline">Calendar</CardTitle>
                                <CardDescription>Click a date to see bookings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Calendar 
                                    mode="single" className="p-0"
                                    classNames={{ day: "h-12 w-12 text-base md:h-16 md:w-16 md:text-lg", head_cell: "w-12 md:w-16" }}
                                    components={{ DayContent: ({ date }) => {
                                        const dayBookings = bookings?.filter(b => b.start && format((b.start as any).toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
                                        return <div className="relative h-full w-full flex items-center justify-center">
                                            <span>{date.getDate()}</span>
                                            {dayBookings && dayBookings.length > 0 && 
                                                <div className="absolute bottom-1 w-full flex justify-center gap-0.5">
                                                    {dayBookings.slice(0, 3).map(b => <div key={b.id} className="h-1.5 w-1.5 rounded-full bg-primary" />)}
                                                </div>
                                            }
                                        </div>;
                                    }}}
                                />
                            </CardContent>
                        </Card>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="font-headline">Available Rooms</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    {rooms.map(room => {
                                        const location = locations?.find(l => l.id === room.locationId);
                                        return (
                                        <div key={room.id} className="p-3 border rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold">{room.name}</h3>
                                                    {location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3"/>{location.name}</p>}
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Capacity: {room.capacity}</p>
                                                </div>
                                                {isSuperAdmin && <Button asChild variant="outline" size="sm"><Link href={`/rooms/${room.id}/display`}><Monitor className="mr-2 h-4 w-4"/>Display</Link></Button>}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {room.equipment.map(item => {
                                                    const Icon = equipmentIcons[item] || Users;
                                                    return <Badge key={item} variant="secondary" className="flex items-center gap-1"><Icon className="h-3 w-3" /> {item}</Badge>
                                                })}
                                            </div>
                                        </div>
                                    )})}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent className="sm:max-w-lg">
                {rooms && <BookingForm rooms={rooms} onSave={handleSaveBooking} onClose={() => setIsSheetOpen(false)} />}
              </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
