"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@studio/ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@studio/ui";
import { Input } from "@studio/ui";
import { Label } from "@studio/ui";
import { Textarea } from "@studio/ui";
import { Switch } from "@studio/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@studio/ui";
import { LoaderCircle, MoreHorizontal, PlusCircle, ShieldAlert } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { getMinistries } from "@/actions/db";
import {
    getMajorEventCatalog,
    createMajorEventCatalogItem,
    updateMajorEventCatalogItem,
    deleteMajorEventCatalogItem,
    getMajorEventSetting,
    updateMajorEventSetting,
} from "@/actions/major-events";

type CatalogItem = Awaited<ReturnType<typeof getMajorEventCatalog>>[number];

export default function MajorEventSettingsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { isLoading: isPermissionsLoading, canManageMajorEvents } = useUserRole();

    const { data: ministries = [], isLoading: isMinistriesLoading } = useQuery({
        queryKey: ["ministries"],
        queryFn: getMinistries,
        enabled: canManageMajorEvents,
    });

    const { data: catalog = [], isLoading: isCatalogLoading } = useQuery({
        queryKey: ["majorEventCatalog"],
        queryFn: getMajorEventCatalog,
        enabled: canManageMajorEvents,
    });

    const { data: setting, isLoading: isSettingLoading } = useQuery({
        queryKey: ["majorEventSetting"],
        queryFn: async () => {
            const res = await getMajorEventSetting();
            return res.success ? res.data : null;
        },
        enabled: canManageMajorEvents,
    });

    const ministryNameById = useMemo(
        () => new Map(ministries.map((m: any) => [m.id, m.name])),
        [ministries],
    );

    const catalogByMinistry = useMemo(() => {
        const map = new Map<string, CatalogItem[]>();
        for (const item of catalog) {
            if (!map.has(item.ministryId)) map.set(item.ministryId, []);
            map.get(item.ministryId)!.push(item);
        }
        return map;
    }, [catalog]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
    const [formMinistryId, setFormMinistryId] = useState<string>("");
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const openCreate = (ministryId: string) => {
        setEditingItem(null);
        setFormMinistryId(ministryId);
        setFormName("");
        setFormDescription("");
        setIsFormOpen(true);
    };

    const openEdit = (item: CatalogItem) => {
        setEditingItem(item);
        setFormMinistryId(item.ministryId);
        setFormName(item.name);
        setFormDescription(item.description ?? "");
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        const name = formName.trim();
        if (!name) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }

        setIsSaving(true);
        try {
            const res = editingItem
                ? await updateMajorEventCatalogItem(editingItem.id, { name, description: formDescription })
                : await createMajorEventCatalogItem({ ministryId: formMinistryId, name, description: formDescription });

            if (!res.success) throw new Error(res.error);
            toast({ title: editingItem ? "Item updated" : "Item added" });
            queryClient.invalidateQueries({ queryKey: ["majorEventCatalog"] });
            setIsFormOpen(false);
        } catch (err: any) {
            toast({ variant: "destructive", title: "Save failed", description: err?.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            const res = await deleteMajorEventCatalogItem(itemToDelete.id);
            if (!res.success) throw new Error(res.error);
            toast({ title: "Item deleted" });
            queryClient.invalidateQueries({ queryKey: ["majorEventCatalog"] });
        } catch (err: any) {
            toast({ variant: "destructive", title: "Delete failed", description: err?.message });
        } finally {
            setItemToDelete(null);
        }
    };

    const handleToggleEnabled = async (enabled: boolean) => {
        try {
            const res = await updateMajorEventSetting(enabled);
            if (!res.success) throw new Error(res.error);
            queryClient.invalidateQueries({ queryKey: ["majorEventSetting"] });
        } catch (err: any) {
            toast({ variant: "destructive", title: "Update failed", description: err?.message });
        }
    };

    const isLoading = isPermissionsLoading || isMinistriesLoading || isCatalogLoading || isSettingLoading;

    if (isPermissionsLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!canManageMajorEvents) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You do not have permission to manage Major Event Request settings.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Major Event Requests</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage the service catalogue and enable/disable Major Event requests.
                    </p>
                </div>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base">Major Event Request Button</CardTitle>
                    <CardDescription>
                        When disabled, workers will not be able to submit new Major Event requests.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={setting?.enabled ?? true}
                            onCheckedChange={handleToggleEnabled}
                            disabled={isLoading}
                        />
                        <span className="text-sm font-medium">
                            {setting?.enabled ?? true ? "Enabled" : "Disabled"}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 space-y-6">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    ministries.map((ministry: any) => {
                        const items = catalogByMinistry.get(ministry.id) ?? [];
                        return (
                            <Card key={ministry.id}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">{ministry.name}</CardTitle>
                                        <CardDescription>
                                            {items.length} service item{items.length === 1 ? "" : "s"}
                                        </CardDescription>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => openCreate(ministry.id)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                                    </Button>
                                </CardHeader>
                                {items.length > 0 && (
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-muted-foreground">{item.description}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onSelect={() => setTimeout(() => openEdit(item), 100)}>
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onSelect={() => setTimeout(() => setItemToDelete(item), 100)}
                                                                        className="text-destructive"
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Create / Edit dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? "Edit Service Item" : `Add Service Item — ${ministryNameById.get(formMinistryId) ?? ""}`}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="item-name">Name</Label>
                            <Input id="item-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="item-description">Description</Label>
                            <Textarea id="item-description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Service Item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{itemToDelete?.name}</strong>? This will not
                            affect existing Major Event requests that already reference it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
