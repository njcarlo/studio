"use client";

import React, { useState, useEffect } from "react";
import { writeBatch, doc, serverTimestamp, collection } from "firebase/firestore";
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
import { LoaderCircle, Shield, AlertTriangle, PlusCircle, Trash2, Pencil } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFirestore, useDoc, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useUser } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/types";
import { allPermissions, type Permission } from "@/lib/permissions";

// RoleForm component
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
                    <div className="space-y-2 rounded-md border p-4 grid grid-cols-3 gap-4">
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


export default function SettingsPage() {
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Check if the admin role exists to determine if seeding is needed.
    const adminRoleRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'roles', 'admin');
    }, [firestore, user]);
    const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc<Role>(adminRoleRef);
    
    // Data for Role Matrix
    const rolesRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, "roles");
    }, [firestore, user]);
    const { data: roles, isLoading: rolesLoading } = useCollection<Role>(rolesRef);

    // Form/Sheet State for Role Matrix
    const [sheetContent, setSheetContent] = useState<React.ReactNode | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    const closeSheet = () => setIsSheetOpen(false);

    // Role Handlers from dashboard
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


    const initializeSystem = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to initialize the system." });
            return;
        }

        try {
            const batch = writeBatch(firestore);
            
            const rolesData = {
                admin: { 
                    name: 'Admin', 
                    privileges: {
                        'manage_users': true,
                        'manage_roles': true,
                        'manage_content': true,
                        'manage_approvals': true,
                        'operate_scanner': true,
                        'manage_meal_stubs': true,
                    } 
                },
                editor: { name: 'Editor', privileges: { 'manage_content': true } },
                viewer: { name: 'Viewer', privileges: {} }
            };

            for (const [roleId, roleData] of Object.entries(rolesData)) {
                batch.set(doc(firestore, 'roles', roleId), roleData);
            }
            
            batch.set(doc(firestore, 'users', user.uid), {
                roleId: 'admin',
                status: 'Active',
            }, { merge: true });

            await batch.commit();
            toast({ title: "System Initialized", description: "You are now an administrator. Please refresh the page for changes to take effect." });
        } catch (dbError: any) {
            console.error("Database Seed Failed:", dbError);
            toast({ variant: "destructive", title: "Database Seed Failed", description: "Could not seed the database. Check console for details." });
        }
    };

    const isLoading = isRoleLoading || isAdminRoleLoading || isUserLoading || rolesLoading;

    const needsSeeding = !adminRole && !isAdminRoleLoading;
    const canAccess = isSuperAdmin || needsSeeding;

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!user) {
         return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Not Logged In</CardTitle>
                        <CardDescription>You must be logged in to access this page.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }
    
    if (!canAccess) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">System Settings</h1>
            </div>
            <p className="text-muted-foreground">Manage core application settings and user roles.</p>

            <div className="mt-4 space-y-6">
                 {needsSeeding && (
                    <Card className="border-amber-500 bg-amber-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-700"><AlertTriangle /> Initial Setup Required</CardTitle>
                            <CardDescription>
                                Your application has not been initialized. Click the button below to create the default roles and make your account the master administrator.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={initializeSystem} variant="default">
                                Initialize System
                            </Button>
                        </CardContent>
                    </Card>
                )}
                
                {isSuperAdmin && (
                    <>
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

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Shield /> System Seed</CardTitle>
                                <CardDescription>
                                    This will create (or reset) the default user roles ('Admin', 'Editor', 'Viewer'). It will also ensure the currently logged-in user has the 'Admin' role. This can be used to recover admin access.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={initializeSystem}>
                                    Initialize / Reset System
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                )}

            </div>
            
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent className="sm:max-w-3xl">
                {sheetContent}
              </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
