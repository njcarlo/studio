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
import { PlusCircle, Trash2, Pencil, LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Role } from "@/lib/types";
import { allPermissions, type Permission } from "@/lib/permissions";
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";

// RoleForm component copied from settings/page.tsx
const RoleForm = ({ role, onSave, onClose }: { role?: Partial<Role> | null; onSave: (data: Partial<Role>) => void; onClose: () => void }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Partial<Role>>({ name: '', privileges: {} });

    useEffect(() => {
        setFormData(role || { name: '', privileges: {} });
    }, [role]);

    const handlePrivilegeChange = (privilege: Permission, checked: boolean) => {
        const currentPrivileges = { ...(formData.privileges || {}) };
        if (checked) {
            currentPrivileges[privilege] = true;
        } else {
            delete currentPrivileges[privilege];
        }
        setFormData({ ...formData, privileges: currentPrivileges });
    };

    const handleSave = () => {
        if (!formData.name) {
            toast({ variant: 'destructive', title: 'Role name is required.' });
            return;
        }
        onSave(formData);
    };

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">{role?.id ? 'Edit Role' : 'Add New Role'}</SheetTitle>
                <SheetDescription>Define the role name and its associated privileges for each module.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input id="role-name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Content Editor"/>
                </div>
                <div className="space-y-2">
                    <Label>Privileges</Label>
                    <div className="space-y-2 rounded-md border p-4 grid grid-cols-2 gap-4">
                        {allPermissions.map(privilege => (
                            <div key={privilege} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`priv-${privilege}`} 
                                    checked={!!formData.privileges?.[privilege]} 
                                    onCheckedChange={(checked) => handlePrivilegeChange(privilege, !!checked)}
                                />
                                <label htmlFor={`priv-${privilege}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                                    {privilege.replace(/_/g, ' ')}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose>
                <Button onClick={handleSave}>Save Role</Button>
            </SheetFooter>
        </>
    );
};


export default function DashboardPage() {
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data
    const rolesRef = useMemoFirebase(() => collection(firestore, "roles"), [firestore]);
    const { data: roles, isLoading: rolesLoading } = useCollection<Role>(rolesRef);

    // Form/Sheet State
    const [sheetContent, setSheetContent] = useState<React.ReactNode | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    const closeSheet = () => setIsSheetOpen(false);

    // Role Handlers
    const handleSaveRole = async (roleData: Partial<Role>) => {
        try {
            if (roleData.id) {
                const { id, ...data } = roleData;
                await updateDocumentNonBlocking(doc(firestore, "roles", id), data);
                toast({ title: "Role Updated" });
            } else {
                await addDocumentNonBlocking(collection(firestore, "roles"), roleData);
                toast({ title: "Role Added" });
            }
            closeSheet();
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save role." });
        }
    };

    const handleDeleteRole = async (id: string) => {
        // Prevent deleting admin role
        if (id === 'admin') {
            toast({ variant: 'destructive', title: 'Cannot Delete Admin Role' });
            return;
        }
        try {
            await deleteDocumentNonBlocking(doc(firestore, "roles", id));
            toast({ title: "Role Deleted" });
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete role." });
        }
    };
    
    const openRoleForm = (role?: Role) => {
        setSheetContent(<RoleForm key={role?.id || 'new-role'} role={role} onSave={handleSaveRole} onClose={closeSheet} />);
        setIsSheetOpen(true);
    };

    const isLoading = isRoleLoading || rolesLoading;
    
    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!isSuperAdmin) {
        return <AppLayout>
             <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-headline font-bold tracking-tight">
                    Dashboard
                </h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome</CardTitle>
                        <CardDescription>You do not have administrative privileges to view advanced settings.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage user roles and permissions for the application modules.</p>

            <div className="mt-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-headline">Role & Permission Matrix</CardTitle>
                            <CardDescription>Add, edit, or remove user roles and their privileges.</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => openRoleForm()}><PlusCircle className="h-4 w-4 mr-2" />Add Role</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Role Name</TableHead><TableHead>Privileges</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {roles?.map(role => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium capitalize">{role.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{Object.keys(role.privileges || {}).map(p => p.replace(/_/g, ' ')).join(', ')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openRoleForm(role)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRole(role.id)} disabled={role.id === 'admin'}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent className="sm:max-w-2xl">
                {sheetContent}
              </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
