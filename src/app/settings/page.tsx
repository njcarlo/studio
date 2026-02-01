
"use client";

import React, { useState, useEffect } from "react";
import { collection, doc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
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
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Pencil, LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Ministry, Room, Equipment, Worker, Department } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";

// --- FORMS for Settings Page ---

const MinistryForm = ({ ministry, workers, departments, onSave, onClose }: { ministry?: Partial<Ministry> | null; workers: Worker[]; departments: Department[]; onSave: (ministry: Partial<Ministry>) => void; onClose: () => void }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Ministry>>({});

  useEffect(() => {
    if (ministry) {
        setFormData(ministry);
    } else {
        setFormData({
            name: '',
            description: '',
            leaderId: '',
            department: 'Worship',
            memberIds: [],
        });
    }
  }, [ministry]);

  const handleSave = () => {
    if (!formData.name || !formData.leaderId) {
        toast({
          variant: "destructive",
          title: "Missing required fields",
          description: "A ministry must have a name and a leader.",
        });
        return;
    }
    onSave(formData);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">{ministry?.id ? 'Edit Ministry' : 'Add New Ministry'}</SheetTitle>
        <SheetDescription>
          Fill in the details for the ministry.
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Name</Label>
          <Input id="name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="description" className="text-right pt-2">Description</Label>
          <Textarea id="description" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="department" className="text-right">Department</Label>
          <Select value={formData.department} onValueChange={(value: Department) => setFormData({...formData, department: value})}>
            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a department" /></SelectTrigger>
            <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="leader" className="text-right">Leader</Label>
          <Select value={formData.leaderId} onValueChange={(value: string) => setFormData({...formData, leaderId: value})}>
            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a leader" /></SelectTrigger>
            <SelectContent>{workers.map(w => <SelectItem key={w.id} value={`${w.id}`}>{`${w.firstName} ${w.lastName}`}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
       <SheetFooter>
        <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
        <Button onClick={handleSave}>Save Ministry</Button>
      </SheetFooter>
    </>
  );
};

const RoomForm = ({ room, equipment, onSave, onClose }: { room?: Partial<Room> | null, equipment: Equipment[], onSave: (data: Partial<Room>) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<Room>>({});
    
    useEffect(() => {
        if (room) {
            setFormData(room);
        } else {
            setFormData({ name: '', capacity: 0, equipment: [] });
        }
    }, [room]);


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
                    <Input id="room-name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="room-capacity" className="text-right">Capacity</Label>
                    <Input id="room-capacity" type="number" value={formData.capacity as number} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} className="col-span-3" />
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


export default function SettingsPage() {
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data fetching
    const ministriesRef = useMemoFirebase(() => collection(firestore, "ministries"), [firestore]);
    const { data: ministries, isLoading: ministriesLoading } = useCollection<Ministry>(ministriesRef);

    const workersRef = useMemoFirebase(() => collection(firestore, "worker_profiles"), [firestore]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);
    
    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const equipmentRef = useMemoFirebase(() => collection(firestore, "equipment"), [firestore]);
    const { data: equipment, isLoading: equipmentLoading } = useCollection<Equipment>(equipmentRef);

    // Form / Sheet states
    const [sheetContent, setSheetContent] = useState<React.ReactNode | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const closeSheet = () => setIsSheetOpen(false);

    // Handlers for Ministries
    const handleSaveMinistry = async (ministryData: Partial<Ministry>) => {
        if (ministryData.id) {
          const { id, ...data } = ministryData;
          await updateDocumentNonBlocking(doc(firestore, "ministries", id), data);
          toast({ title: "Ministry Updated" });
        } else {
          await addDocumentNonBlocking(collection(firestore, "ministries"), ministryData);
          toast({ title: "Ministry Added" });
        }
        closeSheet();
    };
    const handleDeleteMinistry = async (id: string) => {
        await deleteDocumentNonBlocking(doc(firestore, "ministries", id));
        toast({ title: "Ministry Deleted" });
    };
    const openMinistryForm = (ministry?: Ministry) => {
        if (!workers) return;
        const departments: Department[] = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'];
        setSheetContent(<MinistryForm key={ministry?.id || 'new'} ministry={ministry} workers={workers} departments={departments} onSave={handleSaveMinistry} onClose={closeSheet} />);
        setIsSheetOpen(true);
    };

    // Handlers for Rooms
    const handleSaveRoom = async (roomData: Partial<Room>) => {
        if (roomData.id) {
            const { id, ...data } = roomData;
            await updateDocumentNonBlocking(doc(firestore, "rooms", id), data);
            toast({ title: "Room Updated" });
        } else {
            await addDocumentNonBlocking(collection(firestore, "rooms"), roomData);
            toast({ title: "Room Added" });
        }
        closeSheet();
    };
    const handleDeleteRoom = async (id: string) => {
        await deleteDocumentNonBlocking(doc(firestore, "rooms", id));
        toast({ title: "Room Deleted" });
    };
    const openRoomForm = (room?: Room) => {
        if (!equipment) return;
        setSheetContent(<RoomForm key={room?.id || 'new'} room={room} equipment={equipment} onSave={handleSaveRoom} onClose={closeSheet} />);
        setIsSheetOpen(true);
    };

    // Handlers for Equipment
    const handleSaveEquipment = async (name: string) => {
        await addDocumentNonBlocking(collection(firestore, "equipment"), { name, available: true });
        toast({ title: "Equipment Added" });
        closeSheet();
    };
    const handleDeleteEquipment = async (id: string) => {
        await deleteDocumentNonBlocking(doc(firestore, "equipment", id));
        toast({ title: "Equipment Deleted" });
    };
    const openEquipmentForm = () => {
        setSheetContent(<EquipmentForm onSave={handleSaveEquipment} onClose={closeSheet} />);
        setIsSheetOpen(true);
    };

    const isLoading = isRoleLoading || ministriesLoading || workersLoading || roomsLoading || equipmentLoading;
    
    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!isSuperAdmin) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">App Settings</h1>
            </div>
            <p className="text-muted-foreground">Manage core application settings like ministries, rooms, and equipment.</p>

            <Tabs defaultValue="ministries" className="mt-4">
                <TabsList>
                    <TabsTrigger value="ministries">Ministries</TabsTrigger>
                    <TabsTrigger value="rooms">Rooms</TabsTrigger>
                    <TabsTrigger value="equipment">Equipment</TabsTrigger>
                </TabsList>
                <TabsContent value="ministries">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline">Manage Ministries</CardTitle>
                                <CardDescription>Add, edit, or remove ministries.</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => openMinistryForm()}><PlusCircle className="h-4 w-4 mr-2" />Add Ministry</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Leader</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {ministries?.map(ministry => (
                                        <TableRow key={ministry.id}>
                                            <TableCell className="font-medium">{ministry.name}</TableCell>
                                            <TableCell>{ministry.department}</TableCell>
                                            <TableCell>{workers?.find(w => w.id === ministry.leaderId)?.firstName} {workers?.find(w => w.id === ministry.leaderId)?.lastName}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openMinistryForm(ministry)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteMinistry(ministry.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="rooms">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline">Manage Rooms</CardTitle>
                                <CardDescription>Add, edit, or remove rooms available for booking.</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => openRoomForm()}><PlusCircle className="h-4 w-4 mr-2" />Add Room</Button>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Capacity</TableHead><TableHead>Equipment</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {rooms?.map(room => (
                                        <TableRow key={room.id}>
                                            <TableCell className="font-medium">{room.name}</TableCell>
                                            <TableCell>{room.capacity}</TableCell>
                                            <TableCell>{room.equipment.join(', ')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openRoomForm(room)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRoom(room.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="equipment">
                    <Card>
                         <CardHeader className="flex flex-row items-center justify-between">
                             <div>
                                <CardTitle className="font-headline">Manage Equipment</CardTitle>
                                <CardDescription>Add or remove equipment that can be in rooms.</CardDescription>
                            </div>
                            <Button size="sm" onClick={openEquipmentForm}><PlusCircle className="h-4 w-4 mr-2" />Add Equipment</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {equipment?.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEquipment(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent className="sm:max-w-lg">
                {sheetContent}
              </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
