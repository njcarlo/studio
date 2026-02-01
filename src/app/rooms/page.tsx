"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users, Tv, Projector, Mic, Monitor, LoaderCircle } from "lucide-react";
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
import type { Booking, Room } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useUser, useCollection, addDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, Timestamp } from "firebase/firestore";

const equipmentIcons: { [key: string]: React.ElementType } = {
  Projector: Projector,
  "Sound System": Mic,
  Whiteboard: Users,
  "Conference Phone": Users,
  TV: Tv,
  "Gaming Console": Users,
};

const BookingForm = ({ rooms, onSave }: { rooms: Room[], onSave: (booking: any) => void }) => {
  const { user } = useUser();
  const [date, setDate] = useState<Date>();
  const [room, setRoom] = useState<string>('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSave = () => {
    if (!date || !room || !title || !startTime || !endTime || !user) return;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const start = new Date(date);
    start.setHours(startH, startM);

    const end = new Date(date);
    end.setHours(endH, endM);
    
    onSave({
        roomId: room,
        workerProfileId: user.uid,
        title,
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(end),
        status: 'Pending',
    });
  };
  
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="room" className="text-right">Room</Label>
        <Select value={room} onValueChange={setRoom}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map(room => (
              <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
            ))}
          </SelectContent>
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
            <Button
              variant={"outline"}
              className={cn(
                "col-span-3 justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Time</Label>
        <div className="col-span-3 grid grid-cols-2 gap-2">
            <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
        <Button onClick={handleSave}><SheetClose>Request Booking</SheetClose></Button>
      </SheetFooter>
    </div>
  );
};


export default function RoomsPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const { isSuperAdmin } = useUserRole();
    const firestore = useFirestore();

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    // This is not efficient for a large number of rooms/bookings.
    // In a real app, you would query bookings for the selected date range and rooms.
    const bookingsRef = useMemoFirebase(() => collection(firestore, 'rooms', 'R1', 'reservations'), [firestore]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsRef);
    
    const handleSaveBooking = (bookingData: any) => {
        if (!bookingData.roomId) return;
        addDocumentNonBlocking(collection(firestore, 'rooms', bookingData.roomId, 'reservations'), bookingData);
        setIsSheetOpen(false);
    };

    const isLoading = roomsLoading || bookingsLoading;
    
    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Room Reservations</h1>
                <Button onClick={() => setIsSheetOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Book a Room
                </Button>
            </div>
            
            {isLoading && <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />}
            
            {!isLoading && rooms && (
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="font-headline">Calendar</CardTitle>
                            <CardDescription>Click a date to see bookings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Calendar 
                                mode="single"
                                className="p-0"
                                classNames={{
                                    day: "h-12 w-12 text-base md:h-16 md:w-16 md:text-lg",
                                    head_cell: "w-12 md:w-16",
                                }}
                                components={{
                                    DayContent: ({ date, ...props }) => {
                                        const dayBookings = bookings?.filter(b => format((b.start as any).toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
                                        return <div className="relative h-full w-full flex items-center justify-center">
                                            <span>{date.getDate()}</span>
                                            {dayBookings && dayBookings.length > 0 && 
                                                <div className="absolute bottom-1 w-full flex justify-center gap-0.5">
                                                    {dayBookings.slice(0, 3).map(b => (
                                                        <div key={b.id} className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                    ))}
                                                </div>
                                            }
                                            </div>;
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Available Rooms</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {rooms.map(room => (
                                    <div key={room.id} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h3 className="font-semibold">{room.name}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Capacity: {room.capacity}</p>
                                          </div>
                                          {isSuperAdmin && (
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/rooms/${room.id}/display`}>
                                                    <Monitor className="mr-2 h-4 w-4"/>
                                                    Display
                                                </Link>
                                            </Button>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {room.equipment.map(item => {
                                                const Icon = equipmentIcons[item] || Users;
                                                return <Badge key={item} variant="secondary" className="flex items-center gap-1"><Icon className="h-3 w-3" /> {item}</Badge>
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}


            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-headline">Book a Room</SheetTitle>
                  <SheetDescription>
                    Fill in the details to request a room booking. Requests are subject to approval.
                  </SheetDescription>
                </SheetHeader>
                {rooms && <BookingForm rooms={rooms} onSave={handleSaveBooking} />}
              </SheetContent>
            </Sheet>

        </AppLayout>
    );
}
