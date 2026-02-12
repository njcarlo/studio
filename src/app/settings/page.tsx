
"use client";

import React, { useState, useEffect } from "react";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
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
import { PlusCircle, Trash2, Pencil, LoaderCircle, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Role } from "@/lib/types";
import { allPermissions, type Permission } from "@/lib/permissions";
import { useFirestore, useAuth, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";

const RoleForm = ({ role, onSave, onClose }: { role?: Partial<Role> | null; onSave: (data: Partial<Role>) => void; onClose: () => void }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Partial<Role>>({ name: '', privileges: [] });

    useEffect(() => {
        setFormData(role || { name: '', privileges: [] });
    }, [role]);

    const handlePrivilegeChange = (privilege: Permission, checked: boolean) => {
        const currentPrivileges = formData.privileges || [];
        if (checked) {
            setFormData({ ...formData, privileges: [...currentPrivileges, privilege] });
        } else {
            setFormData({ ...formData, privileges: currentPrivileges.filter(p => p !== privilege) });
        }
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
                <SheetDescription>Define the role name and its associated privileges.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input id="role-name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Content Editor"/>
                </div>
                <div className="space-y-2">
                    <Label>Privileges</Label>
                    <div className="space-y-2 rounded-md border p-4">
                        {allPermissions.map(privilege => (
                            <div key={privilege} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`priv-${privilege}`} 
                                    checked={formData.privileges?.includes(privilege)} 
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
    const firestore = useFirestore();
    const auth = useAuth();
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

    // System Seeder
    const initializeSystem = async () => {
        let adminUser;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, 'admin@system.com', 'password');
            adminUser = userCredential.user;
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, 'admin@system.com', 'password');
                    adminUser = userCredential.user;
                } catch (signInError: any) {
                    toast({ variant: "destructive", title: "Initialization Failed", description: "Admin user exists but failed to sign in." });
                    return;
                }
            } else {
                toast({ variant: "destructive", title: "Initialization Failed", description: error.message || "An unknown error occurred." });
                return;
            }
        }
        
        if (!adminUser) {
            toast({ variant: "destructive", title: "Initialization Failed", description: "Could not retrieve admin user." });
            return;
        }

        try {
            const batch = writeBatch(firestore);
            const rolesData = {
                admin: { name: 'Admin', privileges: allPermissions },
                editor: { name: 'Editor', privileges: ['edit_all'] },
                viewer: { name: 'Viewer', privileges: [] }
            };
            for (const [roleId, roleData] of Object.entries(rolesData)) {
                batch.set(doc(firestore, 'roles', roleId), roleData);
            }
            batch.set(doc(firestore, 'users', adminUser.uid), {
                email: 'admin@system.com',
                roleId: 'admin',
                status: 'active',
                createdAt: serverTimestamp()
            });
            await batch.commit();
            toast({ title: "System Initialized", description: "Admin account and roles created." });
        } catch (dbError: any) {
            toast({ variant: "destructive", title: "Database Seed Failed", description: "Could not seed the database." });
        }
    };

    const isLoading = isRoleLoading || rolesLoading;
    
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
            <p className="text-muted-foreground">Manage core application settings, roles, and permissions.</p>

            <Tabs defaultValue="roles" className="mt-4">
                <TabsList>
                    <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>
                <TabsContent value="roles">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline">Manage Roles</CardTitle>
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
                                            <TableCell className="text-muted-foreground text-xs">{role.privileges.join(', ')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openRoleForm(role)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRole(role.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="system">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Shield /> System Seed</CardTitle>
                            <CardDescription>
                                Initialize the system with default roles and an admin user. This is a one-time operation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={initializeSystem}>
                                Initialize System
                            </Button>
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
