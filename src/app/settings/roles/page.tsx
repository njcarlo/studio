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
  CardFooter
} from "@/components/ui/card";
import { LoaderCircle, PlusCircle, Trash2, Save, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

const ALL_PERMISSIONS = [
  { id: 'manage_workers', label: 'Manage Workers', description: 'Can add, edit, and delete worker profiles.' },
  { id: 'manage_roles', label: 'Manage Roles', description: 'Can create, edit, delete roles and assign permissions.' },
  { id: 'manage_ministries', label: 'Manage Ministries', description: 'Can create, edit, and delete ministries.' },
  { id: 'manage_rooms', label: 'Manage Facilities', description: 'Can manage rooms, areas, and branches.' },
  { id: 'manage_approvals', label: 'Manage Approvals', description: 'Can approve or reject pending requests.' },
  { id: 'operate_scanner', label: 'Operate Scanner', description: 'Can use the QR code scanner for attendance and meals.' },
  { id: 'manage_meal_stubs', label: 'Manage Meal Stubs', description: 'Can view all meal stub records and reports.' },
];

const RoleCard = ({ role, onUpdate, onDelete }: { role: Role, onUpdate: (role: Role) => void, onDelete: (roleId: string) => void }) => {
    const [name, setName] = useState(role.name);
    const [permissions, setPermissions] = useState(role.permissions || []);

    const isAdminRole = role.id === 'admin';

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        setPermissions(current => 
            checked ? [...current, permissionId] : current.filter(p => p !== permissionId)
        );
    };

    const handleSave = () => {
        onUpdate({ ...role, name, permissions });
    }

    return (
        <Card className={isAdminRole ? "bg-primary/5 border-primary/20" : ""}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                     <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={isAdminRole}
                        placeholder="New Role Name"
                        className="text-lg font-semibold border-0 shadow-none -ml-2 p-1 h-auto focus-visible:ring-1"
                    />
                    {isAdminRole && <ShieldCheck className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription>
                    {isAdminRole ? "The Admin role has all permissions by default and cannot be changed." : "Assign permissions for this role."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <h4 className="font-medium text-sm">Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {ALL_PERMISSIONS.map(permission => (
                         <div className="flex items-start space-x-2" key={permission.id}>
                            <Checkbox
                                id={`${role.id}-${permission.id}`}
                                checked={isAdminRole || permissions.includes(permission.id)}
                                onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                disabled={isAdminRole}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor={`${role.id}-${permission.id}`} className="font-medium cursor-pointer">
                                    {permission.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            {!isAdminRole && (
                 <CardFooter className="flex justify-end gap-2">
                    <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(role.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" /> Save
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}

export default function RoleManagementPage() {
    const { canManageRoles, isLoading, allRoles } = useUserRole();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

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

    const handleDeleteRole = async () => {
        if (!roleToDelete) return;
        
        try {
            await deleteDocumentNonBlocking(doc(firestore, "roles", roleToDelete.id));
            toast({ title: "Role Deleted" });
            setRoleToDelete(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete role." });
        }
    };

    const handleAddRole = async () => {
        const newRoleData = {
            name: "New Role",
            permissions: []
        };
        try {
            await addDocumentNonBlocking(collection(firestore, "roles"), newRoleData);
            toast({ title: "New Role Added", description: "A new role has been created. You can now edit its name and permissions." });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to Add Role", description: "Could not create a new role." });
        }
    };
    
    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!canManageRoles) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Role Management</h1>
                    <p className="text-muted-foreground">Define roles and their access permissions across the application.</p>
                </div>
                 <Button onClick={handleAddRole}><PlusCircle className="h-4 w-4 mr-2" />Add New Role</Button>
            </div>

            <div className="mt-6 space-y-6">
                {allRoles?.sort((a,b) => (a.id === 'admin' ? -1 : b.id === 'admin' ? 1 : a.name.localeCompare(b.name))).map(role => (
                    <RoleCard 
                        key={role.id} 
                        role={role} 
                        onUpdate={handleSaveRole}
                        onDelete={() => setRoleToDelete(role)}
                    />
                ))}
            </div>

            <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the role <span className="font-bold">{roleToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRole}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
