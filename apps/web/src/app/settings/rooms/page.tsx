
"use client";

import React, { useState, useMemo } from "react";
import Papa from "papaparse";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@studio/ui";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose
} from "@studio/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@studio/ui";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@studio/ui";
import { MoreHorizontal, PlusCircle, LoaderCircle, Upload } from "lucide-react";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@studio/ui";
import type { Room, Branch, Area, VenueElement } from "@studio/types";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useRooms } from "@/hooks/use-rooms";
import { useVenueElements } from "@/hooks/use-venue-elements";
import { Badge } from "@studio/ui";
import { Textarea } from "@studio/ui";

// --- Satellite (Branch) Management ---

const BranchForm = ({ branch, onSave }: { branch: Partial<Branch> | null; onSave: (data: Partial<Branch>) => void; }) => {
    const [name, setName] = useState(branch?.name || '');

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">{branch ? 'Edit Satellite' : 'Add New Satellite'}</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="branch-name">Satellite Name</Label>
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
                    <CardTitle>Satellites</CardTitle>
                    <CardDescription>Manage physical satellites and buildings.</CardDescription>
                </div>
                <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Satellite</Button>
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
                                                <DropdownMenuItem onSelect={() => setTimeout(() => onEdit(branch), 100)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => setTimeout(() => onDelete(branch), 100)} disabled={areaCount > 0} className="text-destructive">Delete</DropdownMenuItem>
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
                        <p className="font-bold mb-2">Available Satellite IDs:</p>
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
        id: area?.id,
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
                    <Label htmlFor="area-name">Area Name</Label>
                    <Input id="area-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Second Floor" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="area-branch">Satellite</Label>
                    <Select value={formData.branchId} onValueChange={value => setFormData({ ...formData, branchId: value })}>
                        <SelectTrigger id="area-branch"><SelectValue placeholder="Select a satellite" /></SelectTrigger>
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
                    <CardDescription>Manage areas or floors within your satellites.</CardDescription>
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
                            <TableHead>Satellite</TableHead>
                            <TableHead>Rooms</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={5} className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>}
                        {areas.map(area => {
                            const roomCount = getRoomCount(area.id);
                            return (
                                <TableRow key={area.id}>
                                    <TableCell className="font-mono text-xs">{area.areaId || area.id}</TableCell>
                                    <TableCell className="font-medium">{area.name}</TableCell>
                                    <TableCell>{getBranchName(area.branchId)}</TableCell>
                                    <TableCell>{roomCount}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setTimeout(() => onEdit(area), 100)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => setTimeout(() => onDelete(area), 100)} disabled={roomCount > 0} className="text-destructive">Delete</DropdownMenuItem>
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
    const csvFormat = "name,areaId,capacity,elements";

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
                        `elements` should be a semicolon-separated list of element IDs (e.g., `Eq-Projector-1234`). Leave empty for no elements.
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
                                                <span className="font-semibold">{area.name}:</span> {area.areaId || area.id}
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
                        placeholder={`name,areaId,capacity,elements\nConference Room A,L1-Floor1,12,Id1;Id2`}
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

const RoomForm = ({ room, areas, branches, venueElements, onSave }: { room: Partial<Room> | null; areas: Area[]; branches: Branch[]; venueElements: VenueElement[]; onSave: (data: Partial<Room>) => void; }) => {
    const [formData, setFormData] = useState<Partial<Room>>({
        id: room?.id,
        name: room?.name || '',
        capacity: room?.capacity || 0,
        elements: room?.elements || [],
        areaId: room?.areaId || '',
        weight: room?.weight || 0,
    });

    const handleElementChange = (elementId: string, checked: boolean) => {
        setFormData(prev => {
            const currentElements = prev.elements || [];
            if (checked) {
                return { ...prev, elements: [...currentElements, elementId] };
            } else {
                return { ...prev, elements: currentElements.filter(id => id !== elementId) };
            }
        });
    };

    const groupedAreas = useMemo(() => {
        return branches.map(branch => ({
            branchName: branch.name,
            areas: areas.filter(area => area.branchId === branch.id)
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
                                        <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
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
                    <Label htmlFor="room-weight">Weight (for sorting)</Label>
                    <Input id="room-weight" type="number" value={formData.weight} onChange={e => setFormData({ ...formData, weight: parseInt(e.target.value, 10) || 0 })} placeholder="0" />
                </div>
                <div className="space-y-2">
                    <Label>Venue Elements</Label>
                    <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                        {venueElements.map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`elem-${item.id}`}
                                    checked={formData.elements?.includes(item.id)}
                                    onCheckedChange={(checked) => handleElementChange(item.id, !!checked)}
                                />
                                <Label htmlFor={`elem-${item.id}`} className="font-normal flex items-center gap-2">
                                    {item.name} ({item.category})
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

const RoomsTab = ({ rooms, areas, branches, venueElements, isLoading, onAdd, onEdit, onDelete, onImport }: { rooms: Room[], areas: Area[], branches: Branch[], venueElements: VenueElement[], isLoading: boolean, onAdd: () => void, onEdit: (room: Room) => void, onDelete: (room: Room) => void, onImport: () => void }) => {
    const getAreaAndBranch = (areaIdValue: string) => {
        const area = areas.find(a => a.id === areaIdValue);
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
                    <CardDescription>Manage bookable rooms and their elements.</CardDescription>
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
                            <TableHead>Satellite</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Elements</TableHead>
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
                                    <TableCell>{room.weight || 0}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {room.elements?.map(elmId => {
                                                const elem = venueElements.find(e => e.id === elmId);
                                                return <Badge key={elmId} variant="secondary">{elem?.name || elmId}</Badge>;
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setTimeout(() => onEdit(room), 100)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => setTimeout(() => onDelete(room), 100)} className="text-destructive">Delete</DropdownMenuItem>
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
    const { canManageFacilities, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();

    // SQL Hooks
    const {
        rooms, areas, branches, isLoading: roomsDataLoading,
        createRoom, updateRoom, deleteRoom, createRooms,
        createArea, updateArea, deleteArea, createAreas,
        createBranch, updateBranch, deleteBranch
    } = useRooms();
    const { venueElements, isLoading: venueElementsLoading } = useVenueElements();

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

    const isLoading = roomsDataLoading || isRoleLoading || venueElementsLoading;

    // --- Branch Handlers ---
    const handleSaveBranch = async (data: Partial<Branch>) => {
        try {
            if (data.id) {
                await updateBranch({ id: data.id, data });
                toast({ title: 'Satellite Updated' });
            } else {
                const customId = `B-${data.name!.trim().replace(/\s+/g, ' ')}`;
                await createBranch({ ...data, id: customId });
                toast({ title: 'Satellite Added' });
            }
            setIsBranchSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save satellite.' });
        }
    };

    const handleDeleteBranch = async () => {
        if (!branchToDelete) return;
        try {
            await deleteBranch(branchToDelete.id);
            toast({ title: 'Satellite Deleted' });
            setBranchToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete satellite.' });
        }
    };

    // --- Area Handlers ---
    const handleSaveArea = async (data: Partial<Area>) => {
        try {
            if (data.id) {
                await updateArea({ id: data.id, data });
                toast({ title: 'Area Updated' });
            } else {
                if (!data.name || !data.branchId) {
                    toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out Name and Satellite.' });
                    return;
                }
                const branchName = branches?.find(b => b.id === data.branchId)?.name || 'X';
                const branchInitial = branchName.charAt(0).toUpperCase();
                const customId = `${branchInitial}-${data.name!.trim()}`;

                await createArea({
                    ...data,
                    id: customId,
                    areaId: customId
                });
                toast({ title: 'Area Added' });
            }
            setIsAreaSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save area.' });
        }
    };

    const handleImportAreas = (csvData: string) => {
        if (!branches) {
            toast({ variant: 'destructive', title: 'Satellites not loaded', description: 'Please wait for satellites to load before importing.' });
            return;
        }

        const validBranchIds = new Set(branches.map(b => b.id));

        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const newAreasData = results.data;
                if (newAreasData.length === 0) {
                    toast({ variant: 'destructive', title: 'No Data Found', description: 'The CSV data was empty or invalid.' });
                    return;
                }

                try {
                    const toImport: any[] = [];
                    let invalidRowCount = 0;

                    newAreasData.forEach((newArea: any) => {
                        if (!newArea.areaId || !newArea.name || !newArea.branchId || !validBranchIds.has(newArea.branchId)) {
                            console.warn('Skipping invalid row:', newArea);
                            invalidRowCount++;
                            return;
                        }

                        toImport.push({
                            id: newArea.areaId,
                            areaId: newArea.areaId,
                            name: newArea.name,
                            branchId: newArea.branchId,
                        });
                    });

                    if (toImport.length === 0) {
                        toast({
                            variant: "destructive",
                            title: "Import Failed",
                            description: `All ${invalidRowCount} rows were invalid. Please check that 'areaId' and 'name' are provided and 'branchId' is valid.`,
                        });
                        return;
                    }

                    await createAreas(toImport);

                    let description = `${toImport.length} areas were imported.`;
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
            await deleteArea(areaToDelete.id);
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

        const validAreaIds = new Set(areas.map(a => a.id));

        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const newRoomsData = results.data;
                if (newRoomsData.length === 0) {
                    toast({ variant: 'destructive', title: 'No Data Found', description: 'The CSV data was empty or invalid.' });
                    return;
                }

                try {
                    const toImport: any[] = [];
                    let invalidRowCount = 0;

                    newRoomsData.forEach((newRoom: any) => {
                        const capacity = parseInt(newRoom.capacity, 10);
                        const areaIdFromCsv = newRoom.areaId;

                        if (!newRoom.name || !areaIdFromCsv || !validAreaIds.has(areaIdFromCsv) || isNaN(capacity)) {
                            console.warn('Skipping invalid row:', newRoom);
                            invalidRowCount++;
                            return;
                        }

                        const elements = newRoom.elements ? newRoom.elements.split(';').map((e: string) => e.trim()).filter(Boolean) : [];

                        toImport.push({
                            name: newRoom.name,
                            areaId: areaIdFromCsv,
                            capacity: capacity,
                            elements: elements
                        });
                    });

                    if (toImport.length === 0) {
                        toast({
                            variant: "destructive",
                            title: "Import Failed",
                            description: `All ${invalidRowCount} rows were invalid. Please check that 'name', a valid 'areaId', and a numeric 'capacity' are provided.`,
                        });
                        return;
                    }

                    await createRooms(toImport);

                    let description = `${toImport.length} rooms were imported.`;
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
                await updateRoom({ id: data.id, data });
                toast({ title: 'Room Updated' });
            } else {
                const area = areas?.find(a => a.id === data.areaId);
                const areaName = area?.name || 'X';
                const areaInitial = areaName.charAt(0).toUpperCase();
                const customId = `${areaInitial}-${data.name!.trim()}`;

                await createRoom({
                    ...data,
                    id: customId
                });
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
            await deleteRoom(roomToDelete.id);
            toast({ title: 'Room Deleted' });
            setRoomToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete room.' });
        }
    };

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!canManageFacilities) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Facilities Management</h1>
            </div>
            <p className="text-muted-foreground">Manage your organization's physical structure: satellites, areas, and rooms.</p>

            <Tabs defaultValue="rooms" className="mt-4">
                <TabsList>
                    <TabsTrigger value="rooms">Rooms</TabsTrigger>
                    <TabsTrigger value="areas">Areas</TabsTrigger>
                    <TabsTrigger value="branches">Satellites</TabsTrigger>
                </TabsList>
                <TabsContent value="rooms" className="mt-4">
                    <RoomsTab
                        rooms={[...(rooms || [])].sort((a, b) => {
                            const weightA = a.weight ?? 0;
                            const weightB = b.weight ?? 0;
                            if (weightA !== weightB) return weightA - weightB;
                            return a.name.localeCompare(b.name);
                        })}
                        areas={areas || []}
                        branches={branches || []}
                        venueElements={venueElements || []}
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
                    <RoomForm room={selectedRoom} areas={areas || []} branches={branches || []} venueElements={venueElements || []} onSave={handleSaveRoom} />
                </SheetContent>
            </Sheet>

            {/* Dialogs */}
            <AlertDialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the satellite <span className="font-bold">{branchToDelete?.name}</span>. This action cannot be undone.
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
