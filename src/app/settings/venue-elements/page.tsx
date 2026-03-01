"use client";

import React, { useState } from "react";
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
    SheetClose,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MoreHorizontal, PlusCircle, LoaderCircle, Wrench, Users, Package } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { VenueElement, Ministry } from "@/lib/types";
import { useFirestore, useCollection, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";

const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
        case 'Equipment': return <Wrench className="h-4 w-4" />;
        case 'Manpower': return <Users className="h-4 w-4" />;
        default: return <Package className="h-4 w-4" />;
    }
};

const ElementForm = ({
    element,
    ministries,
    onSave,
}: {
    element: Partial<VenueElement> | null;
    ministries: Ministry[];
    onSave: (data: Partial<VenueElement>) => void;
}) => {
    const [formData, setFormData] = useState<Partial<VenueElement>>({
        id: element?.id,
        name: element?.name || '',
        category: element?.category || 'Equipment',
        providerMinistryId: element?.providerMinistryId || '',
    });

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">{element ? 'Edit Venue Element' : 'Add Venue Element'}</SheetTitle>
                <SheetDescription>Configure requirements that can be requested for venues.</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="element-name">Element Name</Label>
                    <Input id="element-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., TV, LED Wall, Lyrics Operator" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="element-category">Category</Label>
                    <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger id="element-category"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Manpower">Manpower</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="element-ministry">Provider Ministry</Label>
                    <Select value={formData.providerMinistryId} onValueChange={value => setFormData({ ...formData, providerMinistryId: value })}>
                        <SelectTrigger id="element-ministry"><SelectValue placeholder="Select providing ministry" /></SelectTrigger>
                        <SelectContent>
                            {ministries.map(ministry => (
                                <SelectItem key={ministry.id} value={ministry.id}>{ministry.name}</SelectItem>
                            ))}
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

export default function VenueElementsManagementPage() {
    const firestore = useFirestore();
    const { canManageFacilities, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<VenueElement | null>(null);

    const elementsRef = useMemoFirebase(() => collection(firestore, "venueElements"), [firestore]);
    const { data: elements, isLoading: elementsLoading } = useCollection<VenueElement>(elementsRef);

    const ministriesRef = useMemoFirebase(() => collection(firestore, "ministries"), [firestore]);
    const { data: ministries, isLoading: ministriesLoading } = useCollection<Ministry>(ministriesRef);

    const isLoading = elementsLoading || ministriesLoading || isRoleLoading;

    const handleSave = async (data: Partial<VenueElement>) => {
        if (!data.name || !data.providerMinistryId || !data.category) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out all required fields.' });
            return;
        }

        try {
            if (data.id) {
                await updateDocumentNonBlocking(doc(firestore, 'venueElements', data.id), data);
                toast({ title: 'Element Updated' });
            } else {
                const prefix = data.category.charAt(0).toUpperCase();
                const cleanName = data.name.replace(/[^a-zA-Z0-9]/g, '');
                const customId = `${prefix}-${cleanName}-${Date.now().toString().slice(-4)}`;

                await setDocumentNonBlocking(doc(firestore, 'venueElements', customId), {
                    ...data,
                    id: customId
                }, { merge: true });
                toast({ title: 'Element Added' });
            }
            setIsSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save venue element.' });
        }
    };

    const handleDelete = async (element: VenueElement) => {
        if (confirm(`Are you sure you want to delete ${element.name}?`)) {
            try {
                await deleteDocumentNonBlocking(doc(firestore, 'venueElements', element.id));
                toast({ title: 'Element Deleted' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete venue element.' });
            }
        }
    };

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!canManageFacilities) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    const getMinistryName = (id: string) => ministries?.find(m => m.id === id)?.name || 'Unknown';

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Venue Elements</h1>
            </div>
            <p className="text-muted-foreground mt-2 mb-6">Manage deployable requirements and assignments for your venues.</p>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Elements Directory</CardTitle>
                        <CardDescription>Items arrayed across categories like equipment or manpower.</CardDescription>
                    </div>
                    <Button onClick={() => { setSelectedElement(null); setIsSheetOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Element
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Element</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {elements?.map(element => (
                                <TableRow key={element.id}>
                                    <TableCell className="font-medium">{element.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon category={element.category} />
                                            {element.category}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getMinistryName(element.providerMinistryId)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => { setSelectedElement(element); setIsSheetOpen(true); }}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDelete(element)} className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!elements || elements.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                        No elements found. Add your first venue element above.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    {isSheetOpen && (
                        <ElementForm
                            element={selectedElement}
                            ministries={ministries || []}
                            onSave={handleSave}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
