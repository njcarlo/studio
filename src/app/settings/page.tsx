
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { writeBatch, doc, serverTimestamp, collection, query, orderBy } from "firebase/firestore";
import Link from "next/link";
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
import { LoaderCircle, Shield, AlertTriangle, PlusCircle, Trash2, Save, GanttChartSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFirestore, useDoc, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useUser } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/types";
import { allPermissions, type Permission } from "@/lib/permissions";


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

    // State for inline role editing
    const [editableRoles, setEditableRoles] = useState<Role[]>([]);

    useEffect(() => {
        if (roles) {
            setEditableRoles(roles.sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [roles]);

    // Role Matrix Handlers
    const handleRoleChange = (roleId: string, field: 'name' | 'privilege', value: any, privilegeKey?: Permission) => {
        setEditableRoles(currentRoles =>
            currentRoles.map(role => {
                if (role.id === roleId) {
                    if (field === 'name') {
                        return { ...role, name: value };
                    }
                    if (field === 'privilege' && privilegeKey) {
                        const newPrivileges = { ...role.privileges };
                        if (value) {
                            newPrivileges[privilegeKey] = true;
                        } else {
                            delete newPrivileges[privilegeKey];
                        }
                        return { ...role, privileges: newPrivileges };
                    }
                }
                return role;
            })
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
        setEditableRoles(currentRoles => [...currentRoles, { id: newId, name: '', privileges: {} }]);
    };
    
    // System Initializer
    const initializeSystem = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Not Logged In" });
            return;
        }
        try {
            const batch = writeBatch(firestore);
            
            // 1. Roles
            const rolesData = {
                admin: { name: 'Admin', privileges: { 'manage_users': true, 'manage_roles': true, 'manage_content': true, 'manage_approvals': true, 'operate_scanner': true, 'manage_meal_stubs': true, } },
                department_head: { name: 'Department Head', privileges: { 'manage_approvals': true } },
                facilities_manager: { name: 'Facilities Manager', privileges: { 'manage_approvals': true } },
                editor: { name: 'Editor', privileges: { 'manage_content': true } },
                viewer: { name: 'Viewer', privileges: {} }
            };
            for (const [roleId, roleData] of Object.entries(rolesData)) {
                batch.set(doc(firestore, 'roles', roleId), roleData);
            }
            
            // Set current user as admin
            batch.set(doc(firestore, 'users', user.uid), { roleId: 'admin', status: 'Active' }, { merge: true });

            // 2. Workflow
            const workflowId = "default_workflow";
            batch.set(doc(firestore, 'workflows', workflowId), { name: 'Default Approval Workflow', description: 'The standard multi-step workflow for all approval requests.' });
            
            // 3. Workflow States
            const states = [
                { id: 'open', name: 'Open', order: 1 },
                { id: 'dept_review', name: 'Department Head Review', order: 2 },
                { id: 'fac_review', name: 'Facilities Review', order: 3 },
                { id: 'approved', name: 'Approved', order: 4 },
                { id: 'rejected', name: 'Rejected', order: 5 },
            ];
            for (const state of states) {
                batch.set(doc(firestore, `workflows/${workflowId}/states`, state.id), { name: state.name, order: state.order, workflowId: workflowId });
            }

            // 4. Workflow Transitions
            const transitions = [
                { id: 'submit_review', name: 'Submit', from: 'open', to: 'dept_review', roles: ['viewer', 'editor', 'department_head', 'facilities_manager', 'admin'] },
                { id: 'dept_approve', name: 'Approve', from: 'dept_review', to: 'fac_review', roles: ['department_head', 'admin'] },
                { id: 'dept_reject', name: 'Reject', from: 'dept_review', to: 'rejected', roles: ['department_head', 'admin'] },
                { id: 'fac_approve', name: 'Approve', from: 'fac_review', to: 'approved', roles: ['facilities_manager', 'admin'] },
                { id: 'fac_reject', name: 'Reject', from: 'fac_review', to: 'rejected', roles: ['facilities_manager', 'admin'] },
                { id: 'admin_approve', name: 'Final Approve', from: 'fac_review', to: 'approved', roles: ['admin'] },
            ];
            for (const transition of transitions) {
                batch.set(doc(firestore, `workflows/${workflowId}/transitions`, transition.id), { 
                    name: transition.name, 
                    fromStateId: transition.from, 
                    toStateId: transition.to, 
                    workflowId: workflowId,
                    allowedRoles: transition.roles
                });
            }

            await batch.commit();
            toast({ title: "System Initialized", description: "Default roles and multi-step workflow have been created. Please refresh." });
        } catch (dbError: any) {
            toast({ variant: "destructive", title: "Database Seed Failed", description: dbError.message || "Could not seed the database." });
            console.error(dbError);
        }
    };

    const isLoading = isRoleLoading || isAdminRoleLoading || isUserLoading || rolesLoading;

    const needsSeeding = !adminRole && !isAdminRoleLoading;
    const canAccess = isSuperAdmin || needsSeeding;

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!user) {
         return <AppLayout><Card><CardHeader><CardTitle>Not Logged In</CardTitle><CardDescription>You must be logged in to access this page.</CardDescription></CardHeader></Card></AppLayout>;
    }
    
    if (!canAccess) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
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
                            <Button onClick={initializeSystem} variant="default">Initialize System</Button>
                        </CardContent>
                    </Card>
                )}
                
                {isSuperAdmin && (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="font-headline">Role & Permission Matrix</CardTitle>
                                    <CardDescription>Add roles and assign privileges inline.</CardDescription>
                                </div>
                                <Button size="sm" onClick={handleAddRoleRow}><PlusCircle className="h-4 w-4 mr-2" />Add Role</Button>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[200px] sticky left-0 bg-card z-10 p-2">Role Name</TableHead>
                                            {allPermissions.map(permission => (
                                                <TableHead key={permission} className="p-2 text-center min-w-[110px]">
                                                    <span className="capitalize text-xs font-medium">{permission.replace(/manage_|operate_/g, '').replace(/_/g, ' ')}</span>
                                                </TableHead>
                                            ))}
                                            <TableHead className="w-[100px] sticky right-0 bg-card z-10 p-2 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editableRoles?.map(role => (
                                            <TableRow key={role.id}>
                                                <TableCell className="p-2 font-medium sticky left-0 bg-card">
                                                    <Input
                                                        value={role.name}
                                                        onChange={e => handleRoleChange(role.id, 'name', e.target.value)}
                                                        disabled={role.id === 'admin'}
                                                        placeholder="New Role Name"
                                                        className="w-full h-9"
                                                    />
                                                </TableCell>
                                                {allPermissions.map(permission => (
                                                    <TableCell key={`${role.id}-${permission}`} className="p-2 text-center">
                                                        <Checkbox
                                                            checked={!!role.privileges?.[permission]}
                                                            onCheckedChange={(checked) => handleRoleChange(role.id, 'privilege', !!checked, permission)}
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell className="p-2 text-right sticky right-0 bg-card space-x-0">
                                                    <Button variant="ghost" size="icon" onClick={() => handleSaveRole(role)}><Save className="h-4 w-4" /></Button>
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
                                    This will create (or reset) the default user roles and approval workflow. This can be used to recover admin access or restore the default workflow.
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
        </AppLayout>
    );
}
