"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users, Tv, Projector, Mic, Monitor, LoaderCircle, Trash2, Pencil } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Booking, Room, Equipment } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useUser, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp, Timestamp } from "firebase/firestore";

const equipmentIcons: { [key: string]: React.ElementType } = {
  Projector: Projector,
  "Sound System": Mic,
  Whiteboard: Users,
  "Conference Phone": Users,
  TV: Tv,
  "Gaming Console": Users,
};

// --- FORMS ---

const BookingForm = ({ rooms, onSave, onClose }: { rooms: Room[], onSave: (booking: any) => void, onClose: () => void }) => {
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
    onClose();
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
                            <Calendar className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Time</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
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

const RoomForm = ({ room, equipment, onSave, onClose }: { room: Partial<Room> | null, equipment: Equipment[], onSave: (data: Partial<Room>) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<Room>>(room || { name: '', capacity: 0, equipment: [] });

    const handleEquipmentChange = (itemName: string, checked: boolean) => {
        const currentEquipment = formData.equipment || [];
        if (checked) {
            setFormData({ ...formData, equipment: [...currentEquipment, itemName] });
        } else {
            setFormData({ ...formData, equipment: currentEquipment.filter(e => e !== itemName) });
        }
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">{room?.id ? 'Edit Room' : 'Add New Room'}</SheetTitle>
                <SheetDescription>{room?.id ? 'Update the details for this room.' : 'Fill in the details for the new room.'}</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="room-name" className="text-right">Name</Label>
                    <Input id="room-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="room-capacity" className="text-right">Capacity</Label>
                    <Input id="room-capacity" type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Equipment</Label>
                    <div className="col-span-3 space-y-2">
                        {equipment.map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox id={`equip-${item.id}`} checked={formData.equipment?.includes(item.name)} onCheckedChange={(checked) => handleEquipmentChange(item.name, !!checked)} />
                                <label htmlFor={`equip-${item.id}`} className="text-sm font-medium leading-none">{item.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
                <Button onClick={handleSave}>Save Room</Button>
            </SheetFooter>
        </>
    )
}

const EquipmentForm = ({ onSave, onClose }: { onSave: (name: string) => void, onClose: () => void }) => {
    const [name, setName] = useState('');
    
    const handleSave = () => {
        if (!name) return;
        onSave(name);
        onClose();
    }

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">Add New Equipment</SheetTitle>
                <SheetDescription>Add a new piece of equipment that can be assigned to rooms.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="equip-name" className="text-right">Name</Label>
                    <Input id="equip-name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" placeholder="e.g., Projector" />
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
                <Button onClick={handleSave}>Save Equipment</Button>
            </SheetFooter>
        </>
    )
}


export default function RoomsPage() {
    const { isSuperAdmin, viewAsRole } = useUserRole();
    const isAdmin = viewAsRole === 'Admin' || isSuperAdmin;
    const firestore = useFirestore();

    const [sheetState, setSheetState] = useState<'booking' | 'addRoom' | 'editRoom' | 'addEquipment' | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const bookingsRef = useMemoFirebase(() => rooms?.[0]?.id ? collection(firestore, 'rooms', rooms[0].id, 'reservations') : null, [firestore, rooms]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsRef);
    
    const equipmentRef = useMemoFirebase(() => collection(firestore, "equipment"), [firestore]);
    const { data: equipment, isLoading: equipmentLoading } = useCollection<Equipment>(equipmentRef);

    const handleSaveBooking = (bookingData: any) => {
        if (!bookingData.roomId) return;
        addDocumentNonBlocking(collection(firestore, 'rooms', bookingData.roomId, 'reservations'), bookingData);
    };

    const handleSaveRoom = (roomData: Partial<Room>) => {
        if (selectedRoom?.id) {
            updateDocumentNonBlocking(doc(firestore, "rooms", selectedRoom.id), roomData);
        } else {
            addDocumentNonBlocking(collection(firestore, "rooms"), roomData);
        }
    };

    const handleDeleteRoom = (roomId: string) => {
        deleteDocumentNonBlocking(doc(firestore, "rooms", roomId));
    };

    const handleSaveEquipment = (name: string) => {
        addDocumentNonBlocking(collection(firestore, "equipment"), { name, available: true });
    };

    const handleDeleteEquipment = (equipmentId: string) => {
        deleteDocumentNonBlocking(doc(firestore, "equipment", equipmentId));
    };

    const isLoading = roomsLoading || bookingsLoading || equipmentLoading;
    
    return (
        <AppLayout>
            <Tabs defaultValue="bookings" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="bookings">Bookings</TabsTrigger>
                        {isAdmin && <TabsTrigger value="management">Management</TabsTrigger>}
                    </TabsList>
                    <Button onClick={() => setSheetState('booking')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Book a Room
                    </Button>
                </div>

                <TabsContent value="bookings" className="space-y-4">
                    {isLoading && <div className="flex justify-center"><LoaderCircle className="h-8 w-8 animate-spin" /></div>}
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
                                            const dayBookings = bookings?.filter(b => format((b.start as any).toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
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
                                        {rooms.map(room => (
                                            <div key={room.id} className="p-3 border rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold">{room.name}</h3>
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
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="management">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="font-headline">Manage Rooms</CardTitle>
                                    <Button size="sm" onClick={() => { setSelectedRoom(null); setSheetState('addRoom'); }}><PlusCircle className="h-4 w-4 mr-2" />Add Room</Button>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {rooms?.map(room => (
                                        <div key={room.id} className="flex items-center justify-between p-2 border rounded-md">
                                            <div>
                                                <p className="font-semibold">{room.name}</p>
                                                <p className="text-sm text-muted-foreground">Capacity: {room.capacity}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedRoom(room); setSheetState('editRoom'); }}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRoom(room.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="font-headline">Manage Equipment</CardTitle>
                                    <Button size="sm" onClick={() => setSheetState('addEquipment')}><PlusCircle className="h-4 w-4 mr-2" />Add Equipment</Button>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {equipment?.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                                            <p className="font-semibold">{item.name}</p>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEquipment(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            <Sheet open={!!sheetState} onOpenChange={(open) => !open && setSheetState(null)}>
              <SheetContent className="sm:max-w-lg">
                {sheetState === 'booking' && rooms && <BookingForm rooms={rooms} onSave={handleSaveBooking} onClose={() => setSheetState(null)} />}
                {(sheetState === 'addRoom' || sheetState === 'editRoom') && equipment && <RoomForm room={selectedRoom} equipment={equipment} onSave={handleSaveRoom} onClose={() => setSheetState(null)} />}
                {sheetState === 'addEquipment' && <EquipmentForm onSave={handleSaveEquipment} onClose={() => setSheetState(null)} />}
              </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
