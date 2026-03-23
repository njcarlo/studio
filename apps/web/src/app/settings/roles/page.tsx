"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@studio/ui";
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
    SheetClose,
} from "@studio/ui";
import { LoaderCircle, PlusCircle, Trash2, Save, ShieldCheck, Edit } from "lucide-react";
import { Input } from "@studio/ui";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/use-audit-log";
import type { Role } from "@studio/types";
import { Checkbox } from "@studio/ui";
import { Label } from "@studio/ui";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@studio/ui";
import { Badge } from "@studio/ui";
import { useRoles } from "@/hooks/use-roles";

const PERMISSION_CATEGORIES = [
    {
        category: 'General',
        permissions: [
            { id: 'manage_roles', label: 'Manage Roles', description: 'Can create, edit, delete roles and assign permissions.' },
        ]
    },
    {
        category: 'Workers',
        permissions: [
            { id: 'manage_workers', label: 'Manage Workers', description: 'Can add, edit, import, and delete worker profiles.' },
        ]
    },
    {
        category: 'Ministries',
        permissions: [
            { id: 'manage_ministries', label: 'Manage Ministries & Departments', description: 'Can create and edit ministries, departments, and appoint approvers.' },
        ]
    },
    {
        category: 'Facilities',
        permissions: [
            { id: 'manage_facilities', label: 'Manage Facilities', description: 'Can manage rooms, areas, and branches.' },
        ]
    },
    {
        category: 'Room Reservations',
        permissions: [
            { id: 'create_room_reservation', label: 'Create Room Reservation', description: 'Can submit requests to book rooms.' },
            { id: 'edit_room_reservation', label: 'Edit Room Reservation', description: 'Can edit details of existing reservations.' },
            { id: 'delete_room_reservation', label: 'Delete Room Reservation', description: 'Can cancel or remove existing reservations.' },
            { id: 'approve_room_reservation', label: 'Approve Room Reservation', description: 'Can approve or reject pending room booking requests.' },
            { id: 'view_schedule_masterview', label: 'View Schedule Masterview', description: 'Can access the full schedule masterview and daily view.' },
        ]
    },
    {
        category: 'Approvals',
        permissions: [
            { id: 'manage_approvals', label: 'Manage Other Approvals', description: 'Can approve or reject other requests (new workers, etc.).' },
        ]
    },
    {
        category: 'Scanner & Attendance',
        permissions: [
            { id: 'operate_scanner', label: 'Operate Scanner', description: 'Can use the QR code scanner for attendance and meal stubs.' },
            { id: 'view_attendance_log', label: 'View Own Attendance', description: 'Can access their personal attendance page and QR code.' },
        ]
    },
    {
        category: 'Meal Stubs',
        permissions: [
            { id: 'view_meal_stubs', label: 'View Own Meal Stubs', description: 'Can access their personal meal stubs page and generate stubs.' },
            { id: 'manage_all_mealstubs', label: 'Manage All Meal Stubs', description: 'Can view all meal stub records and reports.' },
        ]
    },
    {
        category: 'Connect 2 Souls',
        permissions: [
            { id: 'manage_c2s', label: 'Manage Connect 2 Souls', description: 'Can create, edit, and delete Connect 2 Souls groups and mentees.' },
            { id: 'view_c2s_analytics', label: 'View C2S Analytics', description: 'Can view the growth and performance analytics for Connect 2 Souls.' },
        ]
    },
    {
        category: 'Reports',
        permissions: [
            { id: 'view_reports', label: 'View Reports', description: 'Can access the reports page for attendance, meal stubs, and room reservations.' },
        ]
    },
    {
        category: 'System',
        permissions: [
            { id: 'view_transaction_logs', label: 'View Transaction Logs', description: 'Can access the transaction logs in settings.' },
            { id: 'manage_ors_sync', label: 'ORS Legacy Sync', description: 'Can run and manage the ORS legacy data sync.' },
        ]
    },
];


const RolePermissionSheet = ({
    role,
    isOpen,
    onOpenChange,
    onSave,
    onDelete
}: {
    role: Partial<Role> | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (role: Partial<Role>) => void;
    onDelete: (roleId: string) => void;
}) => {
    const [name, setName] = useState(role?.name || "New Role");
    const [permissions, setPermissions] = useState(role?.permissions || []);

    useEffect(() => {
        if (isOpen) {
            setName(role?.name || "New Role");
            setPermissions(role?.permissions || []);
        }
    }, [role, isOpen]);

    const isAdminRole = role?.id === 'admin';

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        setPermissions(current =>
            checked ? [...current, permissionId] : current.filter(p => p !== permissionId)
        );
    };

    const handleSave = () => {
        onSave({ ...role, name, permissions });
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="font-headline">{role ? 'Edit Role' : 'Add New Role'}</SheetTitle>
                    <SheetDescription>
                        {isAdminRole ? "The Admin role has all permissions by default and cannot be changed." : "Assign permissions for this role."}
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role-name">Role Name</Label>
                        <Input
                            id="role-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isAdminRole}
                            placeholder="New Role Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Permissions</Label>
                        <Accordion type="multiple" className="w-full border rounded-lg" defaultValue={PERMISSION_CATEGORIES.map(c => c.category)}>
                            {PERMISSION_CATEGORIES.map(category => (
                                <AccordionItem value={category.category} key={category.category} className="px-4">
                                    <AccordionTrigger className="text-base font-semibold py-3">{category.category}</AccordionTrigger>
                                    <AccordionContent className="pt-2 pl-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            {category.permissions.map(permission => (
                                                <div className="flex items-start space-x-2" key={permission.id}>
                                                    <Checkbox
                                                        id={`${role?.id || 'new'}-${permission.id}`}
                                                        checked={isAdminRole || permissions.includes(permission.id)}
                                                        onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                                        disabled={isAdminRole}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <Label htmlFor={`${role?.id || 'new'}-${permission.id}`} className="font-medium cursor-pointer">
                                                            {permission.label}
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>

                {!isAdminRole && (
                    <SheetFooter className="pt-4">
                        {role?.id && (
                            <Button variant="ghost" className="text-destructive hover:text-destructive mr-auto" onClick={() => onDelete(role.id!)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Role
                            </Button>
                        )}
                        <SheetClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </SheetClose>
                        <Button onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" /> Save Role
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}

export default function RoleManagementPage() {
    const { canManageRoles } = useUserRole();
    const { roles, isLoading, createRole, updateRole, deleteRole } = useRoles();
    const { toast } = useToast();
    const { logAction } = useAuditLog();

    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const handleAddNew = () => {
        setSelectedRole(null);
        setSheetOpen(true);
    };

    const handleEdit = (role: Role) => {
        setSelectedRole(role);
        setSheetOpen(true);
    }

    const handleSaveRole = async (roleData: Partial<Role>) => {
        const { id, ...data } = roleData;
        if (!data.name) {
            toast({ variant: 'destructive', title: 'Role name is required.' });
            return;
        }
        try {
            if (id) {
                await updateRole({ id, data });
                await logAction('Updated Role (SQL)', 'Roles', `Updated permissions for role "${data.name}"`);
                toast({ title: "Role Updated", description: `The "${data.name}" role has been saved to SQL database.` });
            } else {
                await createRole(data);
                await logAction('Created Role (SQL)', 'Roles', `Created new role "${data.name}"`);
                toast({ title: "Role Added", description: `The "${data.name}" role has been created in SQL database.` });
            }
            setSheetOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save the role." });
        }
    };

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role);
        setSheetOpen(false);
    }

    const handleDeleteRoleConfirm = async () => {
        if (!roleToDelete) return;

        try {
            await deleteRole(roleToDelete.id);
            await logAction('Deleted Role (SQL)', 'Roles', `Deleted role "${roleToDelete.name}"`);
            toast({ title: "Role Deleted" });
            setRoleToDelete(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete role." });
        }
    };

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!canManageRoles) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    const sortedRoles = roles?.sort((a, b) => (a.id === 'admin' ? -1 : b.id === 'admin' ? 1 : a.name.localeCompare(b.name))) || [];

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Role Management</h1>
                    <p className="text-muted-foreground">Define roles and their access permissions across the application.</p>
                </div>
                <Button onClick={handleAddNew}><PlusCircle className="h-4 w-4 mr-2" />Add New Role</Button>
            </div>

            <Card className="mt-6">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={3} className="text-center h-24"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>}
                            {sortedRoles.map(role => {
                                const isAdminRole = role.id === 'admin';
                                const permissionsCount = role.permissions?.length || 0;
                                return (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {role.name}
                                                {isAdminRole && <ShieldCheck className="h-4 w-4 text-primary" />}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isAdminRole
                                                ? <Badge variant="secondary">All Permissions</Badge>
                                                : <Badge variant="outline">{permissionsCount} permission{permissionsCount !== 1 && 's'}</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <RolePermissionSheet
                isOpen={sheetOpen}
                onOpenChange={setSheetOpen}
                role={selectedRole}
                onSave={handleSaveRole}
                onDelete={(roleId) => {
                    const role = sortedRoles.find(r => r.id === roleId);
                    if (role) handleDeleteClick(role);
                }}
            />

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
                        <AlertDialogAction onClick={handleDeleteRoleConfirm}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
