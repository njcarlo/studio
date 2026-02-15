
"use client";

import React, { useState, useMemo } from "react";
import { collection, doc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, PlusCircle, LoaderCircle, Edit, Trash2, MapPin, Building, Users, Tv, Projector, Mic2 } from "lucide-react";
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
import type { Room, Location } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { Badge } from "@/components/ui/badge";

const ALL_EQUIPMENT = [
    { id: 'Projector', label: 'Projector', icon: Projector },
    { id: 'TV', label: 'TV', icon: Tv },
    { id: 'Sound System', label: 'Sound System', icon: Mic2 },
    { id: 'Whiteboard', label: 'Whiteboard', icon: Edit },
];

// --- Location Management ---

const LocationForm = ({ location, onSave, onClose }: { location: Partial<Location> | null; onSave: (data: Partial<Location>) => void; onClose: () => void; }) => {
    const [name, setName] = useState(location?.name || '');

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">{location ? 'Edit Location' : 'Add New Location'}</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="location-name">Location Name</Label>
                    <Input id="location-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Main Campus" />
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
                <Button onClick={() => onSave({ ...location, name })}>Save</Button>
            </SheetFooter>
        </>
    );
};

const LocationsTab = ({ rooms, locations, isLoading, onAdd, onEdit, onDelete }: { rooms: Room[], locations: Location[], isLoading: boolean, onAdd: () => void, onEdit: (loc: Location) => void, onDelete: (loc: Location) => void }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Locations</CardTitle>
                    <CardDescription>Manage physical locations and buildings.</CardDescription>
                </div>
                <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Location</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Rooms</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={3} className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>}
                        {locations.map(loc => {
                            const roomCount = rooms.filter(r => r.locationId === loc.id).length;
                            return (
                                <TableRow key={loc.id}>
                                    <TableCell className="font-medium">{loc.name}</TableCell>
                                    <TableCell>{roomCount}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => onEdit(loc)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => onDelete(loc)} disabled={roomCount > 0} className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

// --- Room Management ---

const RoomForm = ({ room, locations, onSave, onClose }: { room: Partial<Room> | null; locations: Location[]; onSave: (data: Partial<Room>) => void; onClose: () => void; }) => {
    const [formData, setFormData] = useState<Partial<Room>>({
        name: room?.name || '',
        capacity: room?.capacity || 0,
        equipment: room?.equipment || [],
        locationId: room?.locationId || '',
    });

    const handleEquipmentChange = (equipmentId: string, checked: boolean) => {
        setFormData(prev => {
            const currentEquipment = prev.equipment || [];
            if (checked) {
                return { ...prev, equipment: [...currentEquipment, equipmentId] };
            } else {
                return { ...prev, equipment: currentEquipment.filter(id => id !== equipmentId) };
            }
        });
    };
    
    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">{room ? 'Edit Room' : 'Add New Room'}</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input id="room-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Conference Room A" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="room-location">Location</Label>
                    <Select value={formData.locationId} onValueChange={value => setFormData({ ...formData, locationId: value })}>
                        <SelectTrigger id="room-location"><SelectValue placeholder="Select a location" /></SelectTrigger>
                        <SelectContent>
                            {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="room-capacity">Capacity</Label>
                    <Input id="room-capacity" type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })} />
                </div>
                 <div className="space-y-2">
                    <Label>Equipment</Label>
                    <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                        {ALL_EQUIPMENT.map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`equip-${item.id}`}
                                    checked={formData.equipment?.includes(item.id)}
                                    onCheckedChange={(checked) => handleEquipmentChange(item.id, !!checked)}
                                />
                                <Label htmlFor={`equip-${item.id}`} className="font-normal flex items-center gap-2">
                                   <item.icon className="h-4 w-4" /> {item.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
                <Button onClick={() => onSave(formData)}>Save</Button>
            </SheetFooter>
        </>
    );
};

const RoomsTab = ({ rooms, locations, isLoading, onAdd, onEdit, onDelete }: { rooms: Room[], locations: Location[], isLoading: boolean, onAdd: () => void, onEdit: (room: Room) => void, onDelete: (room: Room) => void }) => {
    const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || 'N/A';
    
    return (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Rooms</CardTitle>
                    <CardDescription>Manage bookable rooms and their equipment.</CardDescription>
                </div>
                <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Room</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Room Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Equipment</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={5} className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>}
                        {rooms.map(room => (
                            <TableRow key={room.id}>
                                <TableCell className="font-medium">{room.name}</TableCell>
                                <TableCell>{getLocationName(room.locationId)}</TableCell>
                                <TableCell>{room.capacity}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {room.equipment?.map(eq => <Badge key={eq} variant="secondary">{eq}</Badge>)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => onEdit(room)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onDelete(room)} className="text-destructive">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---

export default function RoomManagementPage() {
    const firestore = useFirestore();
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();

    // State for forms and dialogs
    const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
    const [isRoomSheetOpen, setIsRoomSheetOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

    // Data fetching
    const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
    const { data: locations, isLoading: locationsLoading } = useCollection<Location>(locationsRef);

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const isLoading = locationsLoading || roomsLoading || isRoleLoading;

    // --- Location Handlers ---
    const handleSaveLocation = async (data: Partial<Location>) => {
        try {
            if (data.id) {
                await updateDocumentNonBlocking(doc(firestore, 'locations', data.id), data);
                toast({ title: 'Location Updated' });
            } else {
                await addDocumentNonBlocking(collection(firestore, 'locations'), data);
                toast({ title: 'Location Added' });
            }
            setIsLocationSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save location.' });
        }
    };

    const handleDeleteLocation = async () => {
        if (!locationToDelete) return;
        try {
            await deleteDocumentNonBlocking(doc(firestore, 'locations', locationToDelete.id));
            toast({ title: 'Location Deleted' });
            setLocationToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete location.' });
        }
    };

    // --- Room Handlers ---
    const handleSaveRoom = async (data: Partial<Room>) => {
        try {
            if (data.id) {
                await updateDocumentNonBlocking(doc(firestore, 'rooms', data.id), data);
                toast({ title: 'Room Updated' });
            } else {
                await addDocumentNonBlocking(collection(firestore, 'rooms'), data);
                toast({ title: 'Room Added' });
            }
            setIsRoomSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save room.' });
        }
    };

    const handleDeleteRoom = async () => {
        if (!roomToDelete) return;
        try {
            await deleteDocumentNonBlocking(doc(firestore, 'rooms', roomToDelete.id));
            toast({ title: 'Room Deleted' });
            setRoomToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete room.' });
        }
    };

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!isSuperAdmin) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Locations & Rooms</h1>
            </div>
            <p className="text-muted-foreground">Manage locations and the rooms within them.</p>

            <Tabs defaultValue="rooms" className="mt-4">
                <TabsList>
                    <TabsTrigger value="rooms">Rooms</TabsTrigger>
                    <TabsTrigger value="locations">Locations</TabsTrigger>
                </TabsList>
                <TabsContent value="rooms" className="mt-4">
                    <RoomsTab
                        rooms={rooms || []}
                        locations={locations || []}
                        isLoading={isLoading}
                        onAdd={() => { setSelectedRoom(null); setIsRoomSheetOpen(true); }}
                        onEdit={(room) => { setSelectedRoom(room); setIsRoomSheetOpen(true); }}
                        onDelete={(room) => setRoomToDelete(room)}
                    />
                </TabsContent>
                <TabsContent value="locations" className="mt-4">
                    <LocationsTab
                        rooms={rooms || []}
                        locations={locations || []}
                        isLoading={isLoading}
                        onAdd={() => { setSelectedLocation(null); setIsLocationSheetOpen(true); }}
                        onEdit={(loc) => { setSelectedLocation(loc); setIsLocationSheetOpen(true); }}
                        onDelete={(loc) => setLocationToDelete(loc)}
                    />
                </TabsContent>
            </Tabs>
            
            {/* Sheets */}
            <Sheet open={isLocationSheetOpen} onOpenChange={setIsLocationSheetOpen}>
                <SheetContent>
                    <LocationForm location={selectedLocation} onSave={handleSaveLocation} onClose={() => setIsLocationSheetOpen(false)} />
                </SheetContent>
            </Sheet>
            <Sheet open={isRoomSheetOpen} onOpenChange={setIsRoomSheetOpen}>
                <SheetContent className="sm:max-w-lg">
                    <RoomForm room={selectedRoom} locations={locations || []} onSave={handleSaveRoom} onClose={() => setIsRoomSheetOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Dialogs */}
            <AlertDialog open={!!locationToDelete} onOpenChange={(open) => !open && setLocationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the location <span className="font-bold">{locationToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLocation}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the room <span className="font-bold">{roomToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRoom}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

    