"use client";

import React, { useState, useEffect } from "react";
import { doc, collection } from "firebase/firestore";
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
import { LoaderCircle, PlusCircle, Trash2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/types";


export default function RoleManagementPage() {
    const { isSuperAdmin, isLoading, allRoles } = useUserRole();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [editableRoles, setEditableRoles] = useState<Role[]>([]);

    useEffect(() => {
        if (allRoles) {
            setEditableRoles(allRoles.sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [allRoles]);

    const handleRoleChange = (roleId: string, value: string) => {
        setEditableRoles(currentRoles =>
            currentRoles.map(role => (role.id === roleId ? { ...role, name: value } : role))
        );
    };

    const handleSaveRole = async (roleData: Role) => {
        const { id, ...data } = roleData;
        if (!data.name) {
            toast({ variant: 'destructive', title: 'Role name is required.' });
            return;
        }
        try {
            if (id.startsWith('new_')) {
                await addDocumentNonBlocking(collection(firestore, "roles"), data);
                toast({ title: "Role Added", description: `The "${data.name}" role has been created.` });
            } else {
                await updateDocumentNonBlocking(doc(firestore, "roles", id), data);
                toast({ title: "Role Updated", description: `The "${data.name}" role has been saved.` });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save the role." });
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (id === 'admin') {
            toast({ variant: 'destructive', title: 'Cannot Delete Admin Role' });
            return;
        }
        if (id.startsWith('new_')) {
            setEditableRoles(currentRoles => currentRoles.filter(r => r.id !== id));
        } else {
            try {
                await deleteDocumentNonBlocking(doc(firestore, "roles", id));
                toast({ title: "Role Deleted" });
            } catch (error) {
                toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete role." });
            }
        }
    };

    const handleAddRoleRow = () => {
        const newId = `new_${Date.now()}`;
        setEditableRoles(currentRoles => [...currentRoles, { id: newId, name: '' }]);
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
                <h1 className="text-2xl font-headline font-bold">Role Management</h1>
            </div>
            <p className="text-muted-foreground">Add, edit, or remove roles.</p>

            <div className="mt-4 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-headline">Roles</CardTitle>
                            <CardDescription>Manage user roles across the application.</CardDescription>
                        </div>
                        <Button size="sm" onClick={handleAddRoleRow}><PlusCircle className="h-4 w-4 mr-2" />Add Role</Button>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {editableRoles?.map(role => (
                                    <TableRow key={role.id}>
                                        <TableCell className="p-2 font-medium">
                                            <Input
                                                value={role.name}
                                                onChange={e => handleRoleChange(role.id, e.target.value)}
                                                disabled={role.id === 'admin'}
                                                placeholder="New Role Name"
                                                className="w-full h-9 max-w-xs"
                                            />
                                        </TableCell>
                                        <TableCell className="p-2 text-right space-x-0">
                                            <Button variant="ghost" size="icon" onClick={() => handleSaveRole(role)}><Save className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRole(role.id)} disabled={role.id === 'admin'}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
