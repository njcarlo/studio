"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users, Tv, Projector, Mic } from "lucide-react";
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
import { rooms, bookings as initialBookings } from "@/lib/placeholder-data";
import type { Booking, Room } from "@/lib/types";

const equipmentIcons: { [key: string]: React.ElementType } = {
  Projector: Projector,
  "Sound System": Mic,
  Whiteboard: Users,
  "Conference Phone": Users,
  TV: Tv,
  "Gaming Console": Users,
};

const BookingForm = ({ onSave }: { onSave: (booking: any) => void }) => {
  const [date, setDate] = useState<Date>();

  const handleSave = () => {
    // In a real app, form state would be managed more robustly
    onSave({});
  };
  
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="room" className="text-right">Room</Label>
        <Select>
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
        <Input id="title" placeholder="e.g., Weekly Meeting" className="col-span-3" />
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
            <Input id="start-time" type="time" />
            <Input id="end-time" type="time" />
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
        <SheetClose asChild><Button onClick={handleSave}>Request Booking</Button></SheetClose>
      </SheetFooter>
    </div>
  );
};


export default function RoomsPage() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [bookings, setBookings] = useState(initialBookings);

    const handleSaveBooking = (bookingData: any) => {
        // Mock save
        setIsSheetOpen(false);
    };
    
    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Room Reservations</h1>
                <Button onClick={() => setIsSheetOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Book a Room
                </Button>
            </div>
            
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
                                day: "h-16 w-16 text-lg",
                                head_cell: "w-16",
                            }}
                            components={{
                                DayContent: ({ date, ...props }) => {
                                    const dayBookings = bookings.filter(b => format(b.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
                                    return <div className="relative h-full w-full flex items-center justify-center">
                                        <span>{date.getDate()}</span>
                                        {dayBookings.length > 0 && 
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
                                    <h3 className="font-semibold">{room.name}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Capacity: {room.capacity}</p>
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

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-headline">Book a Room</SheetTitle>
                  <SheetDescription>
                    Fill in the details to request a room booking. Requests are subject to approval.
                  </SheetDescription>
                </SheetHeader>
                <BookingForm onSave={handleSaveBooking} />
              </SheetContent>
            </Sheet>

        </AppLayout>
    );
}
