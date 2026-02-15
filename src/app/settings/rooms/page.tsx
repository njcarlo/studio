
"use client";

import React, { useState, useMemo } from "react";
import { collection, doc, writeBatch } from "firebase/firestore";
import Papa from "papaparse";
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
import { MoreHorizontal, PlusCircle, LoaderCircle, Edit, Trash2, MapPin, Building, Users, Tv, Projector, Mic2, LandPlot, Upload } from "lucide-react";
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
  SelectLabel,
} from "@/components/ui/select";
import type { Room, Branch, Area } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const ALL_EQUIPMENT = [
    { id: 'Projector', label: 'Projector', icon: Projector },
    { id: 'TV', label: 'TV', icon: Tv },
    { id: 'Sound System', label: 'Sound System', icon: Mic2 },
    { id: 'Whiteboard', label: 'Whiteboard', icon: Edit },
];

// --- Branch Management ---

const BranchForm = ({ branch, onSave }: { branch: Partial<Branch> | null; onSave: (data: Partial<Branch>) => void; }) => {
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

const BranchesTab = ({ branches, areas, isLoading, onAdd, onEdit, onDelete }: { branches: Branch[], areas: Area[], isLoading: boolean, onAdd: () => void, onEdit: (loc: Branch) => void, onDelete: (loc: Branch) => void }) => {
    const getAreaCount = (branchId: string) => areas.filter(a => a.branchId === branchId).length;
    
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
                            <TableHead>Areas</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={3} className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>}
                        {branches.map(branch => {
                            const areaCount = getAreaCount(branch.id);
                            return (
                                <TableRow key={branch.id}>
                                    <TableCell className="font-medium">{branch.name}</TableCell>
                                    <TableCell>{areaCount}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => onEdit(branch)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => onDelete(branch)} disabled={areaCount > 0} className="text-destructive">Delete</DropdownMenuItem>
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

// --- Area Management ---

const AreaImportSheet = ({ branches, onImport, onClose }: { branches: Branch[]; onImport: (csvData: string) => void; onClose: () => void; }) => {
    const [csvData, setCsvData] = useState('');
    const csvFormat = "areaId,name,branchId";

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">Import Areas</SheetTitle>
                <SheetDescription>
                    Paste CSV data below to bulk-import areas. The first line must be a header row with `areaId`, `name`, and `branchId`.
                </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="csv-format">Required CSV Format</Label>
                    <Input id="csv-format" readOnly defaultValue={csvFormat} className="font-mono text-xs" />
                     <Card className="mt-2 text-xs text-muted-foreground p-3 max-h-40 overflow-y-auto">
                        <p className="font-bold mb-2">Available Branch IDs:</p>
                        <ul className="space-y-1">
                            {branches.map(branch => (
                                <li key={branch.id} className="font-mono">
                                    <span className="font-semibold">{branch.name}:</span> {branch.id}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="csv-data">CSV Data</Label>
                    <Textarea
                        id="csv-data"
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        placeholder={`areaId,name,branchId\nL1-Floor1,First Floor,branch_id_123`}
                        className="h-48 font-mono text-xs"
                    />
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </SheetClose>
                <Button onClick={() => onImport(csvData)}>Process Import</Button>
            </SheetFooter>
        </>
    )
}

const AreaForm = ({ area, branches, onSave }: { area: Partial<Area> | null; branches: Branch[]; onSave: (data: Partial<Area>) => void; }) => {
    const [formData, setFormData] = useState<Partial<Area>>({
        areaId: area?.areaId || '',
        name: area?.name || '',
        branchId: area?.branchId || ''
    });

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">{area ? 'Edit Area' : 'Add New Area'}</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="area-id">Area ID</Label>
                    <Input
                        id="area-id"
                        value={formData.areaId}
                        onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                        placeholder="e.g., L1-Floor1"
                        disabled={!!area}
                    />
                     { !area && <p className="text-xs text-muted-foreground">This unique ID cannot be changed later.</p> }
                </div>
                <div className="space-y-2">
                    <Label htmlFor="area-name">Area Name</Label>
                    <Input id="area-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Second Floor" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="area-branch">Branch</Label>
                    <Select value={formData.branchId} onValueChange={value => setFormData({ ...formData, branchId: value })}>
                        <SelectTrigger id="area-branch"><SelectValue placeholder="Select a branch" /></SelectTrigger>
                        <SelectContent>
                            {branches.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
                <Button onClick={() => onSave(formData)}>Save</Button>
            </SheetFooter>
        </>
    );
};

const AreasTab = ({ areas, branches, rooms, isLoading, onAdd, onEdit, onDelete, onImport }: { areas: Area[], branches: Branch[], rooms: Room[], isLoading: boolean, onAdd: () => void, onEdit: (area: Area) => void, onDelete: (area: Area) => void, onImport: () => void }) => {
    const getBranchName = (branchId: string) => branches.find(b => b.id === branchId)?.name || 'N/A';
    const getRoomCount = (areaId: string) => rooms.filter(r => r.areaId === areaId).length;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Areas</CardTitle>
                    <CardDescription>Manage areas or floors within your branches.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onImport}><Upload className="mr-2 h-4 w-4" /> Import</Button>
                    <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Area</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Area ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Rooms</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={5} className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>}
                        {areas.map(area => {
                            const roomCount = getRoomCount(area.areaId || '');
                            return (
                                <TableRow key={area.id}>
                                    <TableCell className="font-mono text-xs">{area.areaId}</TableCell>
                                    <TableCell className="font-medium">{area.name}</TableCell>
                                    <TableCell>{getBranchName(area.branchId)}</TableCell>
                                    <TableCell>{roomCount}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => onEdit(area)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => onDelete(area)} disabled={roomCount > 0} className="text-destructive">Delete</DropdownMenuItem>
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
const RoomImportSheet = ({ areas, branches, onImport, onClose }: { areas: Area[]; branches: Branch[]; onImport: (csvData: string) => void; onClose: () => void; }) => {
    const [csvData, setCsvData] = useState('');
    const csvFormat = "name,areaId,capacity,equipment";

    const groupedAreas = useMemo(() => {
        return branches.map(branch => ({
            branchName: branch.name,
            areas: areas.filter(area => area.branchId === branch.id)
        })).filter(group => group.areas.length > 0);
    }, [areas, branches]);

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">Import Rooms</SheetTitle>
                <SheetDescription>
                    Paste CSV data below to bulk-import rooms. The first line must be a header row.
                </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="csv-format">Required CSV Format</Label>
                    <Input id="csv-format" readOnly defaultValue={csvFormat} className="font-mono text-xs" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        `equipment` should be a semicolon-separated list (e.g., `Projector;TV`). Leave empty for no equipment.
                    </p>
                     <Card className="mt-2 text-xs text-muted-foreground p-3 max-h-40 overflow-y-auto">
                        <p className="font-bold mb-2">Available Area IDs:</p>
                         <ul className="space-y-1 font-mono">
                            {groupedAreas.map(group => (
                                <li key={group.branchName}>
                                    <p className="font-semibold">{group.branchName}</p>
                                    <ul className="pl-4">
                                        {group.areas.map(area => (
                                            <li key={area.id}>
                                                <span className="font-semibold">{area.name}:</span> {area.areaId}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="csv-data">CSV Data</Label>
                    <Textarea
                        id="csv-data"
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        placeholder={`name,areaId,capacity,equipment\nConference Room A,L1-Floor1,12,Projector;TV`}
                        className="h-48 font-mono text-xs"
                    />
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </SheetClose>
                <Button onClick={() => onImport(csvData)}>Process Import</Button>
            </SheetFooter>
        </>
    );
}

const RoomForm = ({ room, areas, branches, onSave }: { room: Partial<Room> | null; areas: Area[]; branches: Branch[]; onSave: (data: Partial<Room>) => void; }) => {
    const [formData, setFormData] = useState<Partial<Room>>({
        name: room?.name || '',
        capacity: room?.capacity || 0,
        equipment: room?.equipment || [],
        areaId: room?.areaId || '',
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
    
    const groupedAreas = useMemo(() => {
        return branches.map(branch => ({
            branchName: branch.name,
            areas: areas.filter(area => area.branchId === branch.id && area.areaId)
        })).filter(group => group.areas.length > 0);
    }, [areas, branches]);

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
                    <Label htmlFor="room-area">Area</Label>
                    <Select value={formData.areaId} onValueChange={value => setFormData({ ...formData, areaId: value })}>
                        <SelectTrigger id="room-area"><SelectValue placeholder="Select an area" /></SelectTrigger>
                        <SelectContent>
                             {groupedAreas.map(group => (
                                <SelectGroup key={group.branchName}>
                                    <SelectLabel>{group.branchName}</SelectLabel>
                                    {group.areas.map(area => (
                                        <SelectItem key={area.id} value={area.areaId!}>{area.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
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

const RoomsTab = ({ rooms, areas, branches, isLoading, onAdd, onEdit, onDelete, onImport }: { rooms: Room[], areas: Area[], branches: Branch[], isLoading: boolean, onAdd: () => void, onEdit: (room: Room) => void, onDelete: (room: Room) => void, onImport: () => void }) => {
    const getAreaAndBranch = (areaIdValue: string) => {
        const area = areas.find(a => a.areaId === areaIdValue);
        if (!area) return { areaName: 'N/A', branchName: 'N/A' };
        const branch = branches.find(b => b.id === area.branchId);
        return {
            areaName: area.name,
            branchName: branch ? branch.name : 'N/A'
        };
    };
    
    return (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Rooms</CardTitle>
                    <CardDescription>Manage bookable rooms and their equipment.</CardDescription>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={onImport}><Upload className="mr-2 h-4 w-4" /> Import</Button>
                    <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Room</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Room Name</TableHead>
                            <TableHead>Area</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Equipment</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={6} className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>}
                        {rooms.map(room => {
                            const { areaName, branchName } = getAreaAndBranch(room.areaId);
                            return (
                                <TableRow key={room.id}>
                                    <TableCell className="font-medium">{room.name}</TableCell>
                                    <TableCell>{areaName}</TableCell>
                                    <TableCell>{branchName}</TableCell>
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
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---

export default function RoomManagementPage() {
    const firestore = useFirestore();
    const { canManageRooms, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();

    // State for forms and dialogs
    const [isBranchSheetOpen, setIsBranchSheetOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

    const [isAreaSheetOpen, setIsAreaSheetOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<Area | null>(null);
    const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
    const [isAreaImportSheetOpen, setIsAreaImportSheetOpen] = useState(false);

    const [isRoomSheetOpen, setIsRoomSheetOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
    const [isRoomImportSheetOpen, setIsRoomImportSheetOpen] = useState(false);

    // Data fetching
    const branchesRef = useMemoFirebase(() => collection(firestore, "branches"), [firestore]);
    const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesRef);

    const areasRef = useMemoFirebase(() => collection(firestore, "areas"), [firestore]);
    const { data: areas, isLoading: areasLoading } = useCollection<Area>(areasRef);

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const isLoading = branchesLoading || roomsLoading || isRoleLoading || areasLoading;

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

    // --- Area Handlers ---
    const handleSaveArea = async (data: Partial<Area>) => {
        try {
            if (data.id) {
                await updateDocumentNonBlocking(doc(firestore, 'areas', data.id), data);
                toast({ title: 'Area Updated' });
            } else {
                 if (!data.areaId || !data.name || !data.branchId) {
                    toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out Area ID, Name, and Branch.' });
                    return;
                }
                await addDocumentNonBlocking(collection(firestore, 'areas'), data);
                toast({ title: 'Area Added' });
            }
            setIsAreaSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save area.' });
        }
    };

    const handleImportAreas = (csvData: string) => {
        if (!branches) {
            toast({ variant: 'destructive', title: 'Branches not loaded', description: 'Please wait for branches to load before importing.' });
            return;
        }

        const validBranchIds = new Set(branches.map(b => b.id));

        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const newAreas = results.data;
                if (newAreas.length === 0) {
                    toast({ variant: 'destructive', title: 'No Data Found', description: 'The CSV data was empty or invalid.'});
                    return;
                }

                try {
                    const batch = writeBatch(firestore);
                    let invalidRowCount = 0;

                    newAreas.forEach((newArea: any) => {
                        if (!newArea.areaId || !newArea.name || !newArea.branchId || !validBranchIds.has(newArea.branchId)) {
                            console.warn('Skipping invalid row:', newArea);
                            invalidRowCount++;
                            return;
                        }

                        const newDocRef = doc(collection(firestore, "areas"));
                        batch.set(newDocRef, {
                            areaId: newArea.areaId,
                            name: newArea.name,
                            branchId: newArea.branchId,
                        });
                    });
                    
                    if (invalidRowCount === newAreas.length) {
                         toast({
                            variant: "destructive",
                            title: "Import Failed",
                            description: `All ${invalidRowCount} rows were invalid. Please check that 'areaId' and 'name' are provided and 'branchId' is valid.`,
                        });
                        return;
                    }

                    await batch.commit();

                    let description = `${newAreas.length - invalidRowCount} areas were imported.`;
                    if (invalidRowCount > 0) {
                        description += ` ${invalidRowCount} rows were skipped due to invalid data.`
                    }

                    toast({
                        title: "Import Successful",
                        description: description
                    });
                    setIsAreaImportSheetOpen(false);

                } catch (error) {
                     toast({
                        variant: "destructive",
                        title: "Import Failed",
                        description: "An error occurred during the import. Check console for details.",
                    });
                    console.error("Import error:", error);
                }
            }
        })
    }

    const handleDeleteArea = async () => {
        if (!areaToDelete) return;
        try {
            await deleteDocumentNonBlocking(doc(firestore, 'areas', areaToDelete.id));
            toast({ title: 'Area Deleted' });
            setAreaToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete area.' });
        }
    };


    // --- Room Handlers ---
    const handleImportRooms = (csvData: string) => {
        if (!areas) {
            toast({ variant: 'destructive', title: 'Areas not loaded', description: 'Please wait for areas to load before importing.' });
            return;
        }

        const validAreaIds = new Set(areas.map(a => a.areaId).filter(Boolean));

        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const newRooms = results.data;
                if (newRooms.length === 0) {
                    toast({ variant: 'destructive', title: 'No Data Found', description: 'The CSV data was empty or invalid.'});
                    return;
                }

                try {
                    const batch = writeBatch(firestore);
                    let invalidRowCount = 0;

                    newRooms.forEach((newRoom: any) => {
                        const capacity = parseInt(newRoom.capacity, 10);
                        const areaIdFromCsv = newRoom.areaId;

                        if (!newRoom.name || !areaIdFromCsv || !validAreaIds.has(areaIdFromCsv) || isNaN(capacity)) {
                            console.warn('Skipping invalid row:', newRoom);
                            invalidRowCount++;
                            return;
                        }

                        const equipment = newRoom.equipment ? newRoom.equipment.split(';').map((e: string) => e.trim()).filter(Boolean) : [];

                        const newDocRef = doc(collection(firestore, "rooms"));
                        batch.set(newDocRef, {
                            name: newRoom.name,
                            areaId: areaIdFromCsv,
                            capacity: capacity,
                            equipment: equipment
                        });
                    });
                    
                    if (invalidRowCount === newRooms.length) {
                         toast({
                            variant: "destructive",
                            title: "Import Failed",
                            description: `All ${invalidRowCount} rows were invalid. Please check that 'name', a valid 'areaId', and a numeric 'capacity' are provided.`,
                        });
                        return;
                    }

                    await batch.commit();

                    let description = `${newRooms.length - invalidRowCount} rooms were imported.`;
                    if (invalidRowCount > 0) {
                        description += ` ${invalidRowCount} rows were skipped due to invalid data.`
                    }

                    toast({
                        title: "Import Successful",
                        description: description
                    });
                    setIsRoomImportSheetOpen(false);

                } catch (error) {
                     toast({
                        variant: "destructive",
                        title: "Import Failed",
                        description: "An error occurred during the import. Check console for details.",
                    });
                    console.error("Import error:", error);
                }
            }
        });
    };

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

    if (!canManageRooms) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Branches, Areas & Rooms</h1>
            </div>
            <p className="text-muted-foreground">Manage your organization's physical structure.</p>

            <Tabs defaultValue="rooms" className="mt-4">
                <TabsList>
                    <TabsTrigger value="rooms">Rooms</TabsTrigger>
                    <TabsTrigger value="areas">Areas</TabsTrigger>
                    <TabsTrigger value="branches">Branches</TabsTrigger>
                </TabsList>
                <TabsContent value="rooms" className="mt-4">
                    <RoomsTab
                        rooms={rooms || []}
                        areas={areas || []}
                        branches={branches || []}
                        isLoading={isLoading}
                        onAdd={() => { setSelectedRoom(null); setIsRoomSheetOpen(true); }}
                        onEdit={(room) => { setSelectedRoom(room); setIsRoomSheetOpen(true); }}
                        onDelete={(room) => setRoomToDelete(room)}
                        onImport={() => setIsRoomImportSheetOpen(true)}
                    />
                </TabsContent>
                <TabsContent value="areas" className="mt-4">
                     <AreasTab
                        areas={areas || []}
                        branches={branches || []}
                        rooms={rooms || []}
                        isLoading={isLoading}
                        onAdd={() => { setSelectedArea(null); setIsAreaSheetOpen(true); }}
                        onEdit={(area) => { setSelectedArea(area); setIsAreaSheetOpen(true); }}
                        onDelete={(area) => setAreaToDelete(area)}
                        onImport={() => setIsAreaImportSheetOpen(true)}
                    />
                </TabsContent>
                <TabsContent value="branches" className="mt-4">
                    <BranchesTab
                        branches={branches || []}
                        areas={areas || []}
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
                    <BranchForm branch={selectedBranch} onSave={handleSaveBranch} />
                </SheetContent>
            </Sheet>
             <Sheet open={isAreaSheetOpen} onOpenChange={setIsAreaSheetOpen}>
                <SheetContent>
                    <AreaForm area={selectedArea} branches={branches || []} onSave={handleSaveArea} />
                </SheetContent>
            </Sheet>
            <Sheet open={isAreaImportSheetOpen} onOpenChange={setIsAreaImportSheetOpen}>
                <SheetContent>
                    <AreaImportSheet branches={branches || []} onImport={handleImportAreas} onClose={() => setIsAreaImportSheetOpen(false)} />
                </SheetContent>
            </Sheet>
             <Sheet open={isRoomImportSheetOpen} onOpenChange={setIsRoomImportSheetOpen}>
                <SheetContent className="sm:max-w-lg">
                    <RoomImportSheet 
                        areas={areas || []} 
                        branches={branches || []} 
                        onImport={handleImportRooms} 
                        onClose={() => setIsRoomImportSheetOpen(false)} 
                    />
                </SheetContent>
            </Sheet>
            <Sheet open={isRoomSheetOpen} onOpenChange={setIsRoomSheetOpen}>
                <SheetContent className="sm:max-w-lg">
                    <RoomForm room={selectedRoom} areas={areas || []} branches={branches || []} onSave={handleSaveRoom} />
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
             <AlertDialog open={!!areaToDelete} onOpenChange={(open) => !open && setAreaToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the area <span className="font-bold">{areaToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteArea}>Delete</AlertDialogAction>
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
