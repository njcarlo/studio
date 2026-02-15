
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
import type { Room, Branch } from "@/lib/types";
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

// --- Branch Management ---

const BranchForm = ({ branch, onSave, onClose }: { branch: Partial<Branch> | null; onSave: (data: Partial<Branch>) => void; onClose: () => void; }) => {
    const [name, setName] = useState(branch?.name || '');

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">{branch ? 'Edit Branch' : 'Add New Branch'}</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="branch-name">Branch Name</Label>
                    <Input id="branch-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Main Campus" />
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
                <Button onClick={() => onSave({ ...branch, name })}>Save</Button>
            </SheetFooter>
        </>
    );
};

const BranchesTab = ({ rooms, branches, isLoading, onAdd, onEdit, onDelete }: { rooms: Room[], branches: Branch[], isLoading: boolean, onAdd: () => void, onEdit: (loc: Branch) => void, onDelete: (loc: Branch) => void }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Branches</CardTitle>
                    <CardDescription>Manage physical branches and buildings.</CardDescription>
                </div>
                <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Branch</Button>
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
                        {branches.map(branch => {
                            const roomCount = rooms.filter(r => r.branchId === branch.id).length;
                            return (
                                <TableRow key={branch.id}>
                                    <TableCell className="font-medium">{branch.name}</TableCell>
                                    <TableCell>{roomCount}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => onEdit(branch)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => onDelete(branch)} disabled={roomCount > 0} className="text-destructive">Delete</DropdownMenuItem>
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

const RoomForm = ({ room, branches, onSave, onClose }: { room: Partial<Room> | null; branches: Branch[]; onSave: (data: Partial<Room>) => void; onClose: () => void; }) => {
    const [formData, setFormData] = useState<Partial<Room>>({
        name: room?.name || '',
        capacity: room?.capacity || 0,
        equipment: room?.equipment || [],
        branchId: room?.branchId || '',
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
                    <Label htmlFor="room-branch">Branch</Label>
                    <Select value={formData.branchId} onValueChange={value => setFormData({ ...formData, branchId: value })}>
                        <SelectTrigger id="room-branch"><SelectValue placeholder="Select a branch" /></SelectTrigger>
                        <SelectContent>
                            {branches.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
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

const RoomsTab = ({ rooms, branches, isLoading, onAdd, onEdit, onDelete }: { rooms: Room[], branches: Branch[], isLoading: boolean, onAdd: () => void, onEdit: (room: Room) => void, onDelete: (room: Room) => void }) => {
    const getBranchName = (branchId: string) => branches.find(l => l.id === branchId)?.name || 'N/A';
    
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
                            <TableHead>Branch</TableHead>
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
                                <TableCell>{getBranchName(room.branchId)}</TableCell>
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
    const [isBranchSheetOpen, setIsBranchSheetOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
    const [isRoomSheetOpen, setIsRoomSheetOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

    // Data fetching
    const branchesRef = useMemoFirebase(() => collection(firestore, "branches"), [firestore]);
    const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesRef);

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const isLoading = branchesLoading || roomsLoading || isRoleLoading;

    // --- Branch Handlers ---
    const handleSaveBranch = async (data: Partial<Branch>) => {
        try {
            if (data.id) {
                await updateDocumentNonBlocking(doc(firestore, 'branches', data.id), data);
                toast({ title: 'Branch Updated' });
            } else {
                await addDocumentNonBlocking(collection(firestore, 'branches'), data);
                toast({ title: 'Branch Added' });
            }
            setIsBranchSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save branch.' });
        }
    };

    const handleDeleteBranch = async () => {
        if (!branchToDelete) return;
        try {
            await deleteDocumentNonBlocking(doc(firestore, 'branches', branchToDelete.id));
            toast({ title: 'Branch Deleted' });
            setBranchToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete branch.' });
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
                <h1 className="text-2xl font-headline font-bold">Branches & Rooms</h1>
            </div>
            <p className="text-muted-foreground">Manage branches and the rooms within them.</p>

            <Tabs defaultValue="rooms" className="mt-4">
                <TabsList>
                    <TabsTrigger value="rooms">Rooms</TabsTrigger>
                    <TabsTrigger value="branches">Branches</TabsTrigger>
                </TabsList>
                <TabsContent value="rooms" className="mt-4">
                    <RoomsTab
                        rooms={rooms || []}
                        branches={branches || []}
                        isLoading={isLoading}
                        onAdd={() => { setSelectedRoom(null); setIsRoomSheetOpen(true); }}
                        onEdit={(room) => { setSelectedRoom(room); setIsRoomSheetOpen(true); }}
                        onDelete={(room) => setRoomToDelete(room)}
                    />
                </TabsContent>
                <TabsContent value="branches" className="mt-4">
                    <BranchesTab
                        rooms={rooms || []}
                        branches={branches || []}
                        isLoading={isLoading}
                        onAdd={() => { setSelectedBranch(null); setIsBranchSheetOpen(true); }}
                        onEdit={(loc) => { setSelectedBranch(loc); setIsBranchSheetOpen(true); }}
                        onDelete={(loc) => setBranchToDelete(loc)}
                    />
                </TabsContent>
            </Tabs>
            
            {/* Sheets */}
            <Sheet open={isBranchSheetOpen} onOpenChange={setIsBranchSheetOpen}>
                <SheetContent>
                    <BranchForm branch={selectedBranch} onSave={handleSaveBranch} onClose={() => setIsBranchSheetOpen(false)} />
                </SheetContent>
            </Sheet>
            <Sheet open={isRoomSheetOpen} onOpenChange={setIsRoomSheetOpen}>
                <SheetContent className="sm:max-w-lg">
                    <RoomForm room={selectedRoom} branches={branches || []} onSave={handleSaveRoom} onClose={() => setIsRoomSheetOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Dialogs */}
            <AlertDialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the branch <span className="font-bold">{branchToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBranch}>Delete</AlertDialogAction>
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

    
