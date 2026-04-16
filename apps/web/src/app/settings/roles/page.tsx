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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@studio/ui";
import { Badge } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import {
  LoaderCircle,
  PlusCircle,
  Trash2,
  Save,
  ShieldCheck,
  Edit,
  RefreshCw,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useRoles } from "@/hooks/use-roles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  setRolePermissionsByKeys,
  createRole,
  updateRole,
  deleteRole,
} from "@/actions/db";
import { seedPermissions } from "@/actions/seed-permissions";
import { ALL_PERMISSIONS } from "@/lib/permissions/registry";

// Group permissions by module for the accordion UI
const PERMISSION_CATEGORIES = (() => {
  const grouped: Record<
    string,
    { key: string; label: string; description: string }[]
  > = {};
  for (const p of ALL_PERMISSIONS) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push({
      key: `${p.module}:${p.action}`,
      label: p.action
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      description: p.description || "",
    });
  }
  // Friendly module labels
  const MODULE_LABELS: Record<string, string> = {
    roles: "Roles",
    workers: "Workers",
    ministries: "Ministries",
    facilities: "Facilities",
    venues: "Room Reservations",
    approvals: "Approvals",
    attendance: "Scanner & Attendance",
    meals: "Meal Stubs",
    mentorship: "Connect 2 Souls",
    reports: "Reports",
    system: "System",
    venue_assistance: "Venue Assistance",
    schedule: "Service Schedule",
    inventory: "Inventory",
  };
  return Object.entries(grouped).map(([module, permissions]) => ({
    module,
    category: MODULE_LABELS[module] || module,
    permissions,
  }));
})();

const RolePermissionSheet = ({
  role,
  isOpen,
  onOpenChange,
  onSave,
  onDelete,
  isSaving,
}: {
  role: any | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, permKeys: string[]) => void;
  onDelete: (roleId: string) => void;
  isSaving?: boolean;
}) => {
  const [name, setName] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setName(role?.name || "New Role");
      const keys = (role?.rolePermissions || []).map(
        (rp: any) => `${rp.permission.module}:${rp.permission.action}`,
      );
      setSelectedKeys(keys);
    }
  }, [role, isOpen]);

  const isAdminRole = role?.isSuperAdmin || role?.id === "admin";

  const toggle = (key: string, checked: boolean) => {
    setSelectedKeys((curr) =>
      checked ? [...curr, key] : curr.filter((k) => k !== key),
    );
  };

  const toggleModule = (moduleKeys: string[], checked: boolean) => {
    setSelectedKeys((curr) => {
      if (checked) {
        // Add all keys for this module that aren't already selected
        const next = new Set(curr);
        moduleKeys.forEach(k => next.add(k));
        return [...next];
      } else {
        return curr.filter(k => !moduleKeys.includes(k));
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">
            {role?.id ? "Edit Role" : "Add New Role"}
          </SheetTitle>
          <SheetDescription>
            {isAdminRole
              ? "Super Admin roles have all permissions and cannot be changed."
              : "Configure granular permissions for this role."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isAdminRole}
              placeholder="e.g., Ministry Coordinator"
            />
          </div>

          {!isAdminRole && (
            <div className="space-y-2">
              <Label>Permissions</Label>
              <Accordion
                type="multiple"
                className="w-full border rounded-lg"
                defaultValue={PERMISSION_CATEGORIES.map((c) => c.module)}
              >
                {PERMISSION_CATEGORIES.map(({ module, category, permissions }) => {
                  const moduleKeys = permissions.map(p => p.key);
                  const selectedCount = moduleKeys.filter(k => selectedKeys.includes(k)).length;
                  const allSelected = selectedCount === moduleKeys.length;
                  const someSelected = selectedCount > 0 && !allSelected;

                  return (
                    <AccordionItem value={module} key={module} className="px-4">
                      <div className="flex items-center gap-2 py-1">
                        {/* Select-all checkbox for this module */}
                        <Checkbox
                          id={`module-all-${module}`}
                          checked={allSelected}
                          data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                          onCheckedChange={(checked) => toggleModule(moduleKeys, !!checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        />
                        <AccordionTrigger className="flex-1 text-base font-semibold py-2 hover:no-underline">
                          <span className="flex items-center gap-2">
                            {category}
                            <Badge variant={selectedCount > 0 ? "default" : "outline"} className="text-xs">
                              {selectedCount}/{moduleKeys.length}
                            </Badge>
                          </span>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="pt-1 pb-3 pl-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                          {permissions.map((permission) => (
                            <div className="flex items-start space-x-2" key={permission.key}>
                              <Checkbox
                                id={`${role?.id || "new"}-${permission.key}`}
                                checked={selectedKeys.includes(permission.key)}
                                onCheckedChange={(checked) => toggle(permission.key, !!checked)}
                              />
                              <div className="grid gap-1 leading-none">
                                <Label
                                  htmlFor={`${role?.id || "new"}-${permission.key}`}
                                  className="font-medium cursor-pointer text-xs font-mono text-muted-foreground"
                                >
                                  {permission.key}
                                </Label>
                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </div>

        {!isAdminRole && (
          <SheetFooter className="pt-4 border-t shrink-0">
            {role?.id && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive mr-auto"
                onClick={() => onDelete(role.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Role
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => onSave(name, selectedKeys)}
            >
              {isSaving
                ? <><LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4 mr-2" /> Save Role</>
              }
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default function RoleManagementPage() {
  const { canManageRoles } = useUserRole();
  const { roles, isLoading } = useRoles();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-sync permissions on mount — ensures new permissions (e.g. inventory:manage)
  // are inserted into the Permission table without requiring manual action.
  useEffect(() => {
    if (!canManageRoles) return;
    seedPermissions().catch(console.error);
  }, [canManageRoles]);

  const handleSyncPermissions = async () => {
    setIsSyncing(true);
    try {
      const result = await seedPermissions();
      toast({ title: `Permissions synced — ${result.permissions} entries, ${result.roles} roles migrated` });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    } catch {
      toast({ variant: "destructive", title: "Sync failed" });
    } finally {
      setIsSyncing(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      role,
      name,
      permKeys,
    }: {
      role: any | null;
      name: string;
      permKeys: string[];
    }) => {
      try {
        if (role?.id) {
          await updateRole(role.id, { name });
          await setRolePermissionsByKeys(role.id, permKeys);
          return { id: role.id, name };
        } else {
          const created = await createRole({ name, permissions: [] });
          await setRolePermissionsByKeys(created.id, permKeys);
          return created;
        }
      } catch (err) {
        console.error('[RoleManagement] mutationFn error:', err);
        throw err;
      }
    },
    onSuccess: async (result, { role }) => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
      await logAction(
        role?.id ? "Updated Role" : "Created Role",
        "Roles",
        `${role?.id ? "Updated" : "Created"} role "${result.name}"`,
      );
      toast({ title: role?.id ? "Role Updated" : "Role Created" });
      setSheetOpen(false);
    },
    onError: (error) => {
      console.error('[RoleManagement] Save failed:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Could not save the role.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      await logAction(
        "Deleted Role",
        "Roles",
        `Deleted role "${roleToDelete?.name}"`,
      );
      toast({ title: "Role Deleted" });
      setRoleToDelete(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete role.",
      });
    },
  });

  const handleSaveRole = (name: string, permKeys: string[]) => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Role name is required." });
      return;
    }
    console.log('[RoleManagement] Saving role:', { role: selectedRole?.id, name, permKeys });
    saveMutation.mutate({ role: selectedRole, name, permKeys });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!canManageRoles) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </AppLayout>
    );
  }

  const sortedRoles = [...(roles || [])].sort((a: any, b: any) =>
    a.isSuperAdmin ? -1 : b.isSuperAdmin ? 1 : a.name.localeCompare(b.name),
  );

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Role Management</h1>
          <p className="text-muted-foreground">
            Define roles and their granular access permissions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncPermissions} disabled={isSyncing}>
            {isSyncing ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync Permissions
          </Button>
          <Button
            onClick={() => {
              setSelectedRole(null);
              setSheetOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add New Role
          </Button>
        </div>
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
              {sortedRoles.map((role: any) => {
                const permCount = role.rolePermissions?.length || 0;
                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.name}
                        {role.isSuperAdmin && (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        )}
                        {role.isSystemRole && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {role.isSuperAdmin ? (
                        <Badge variant="secondary">All Permissions</Badge>
                      ) : (
                        <Badge variant="outline">
                          {permCount} permission{permCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setSheetOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
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
        isSaving={saveMutation.isPending}
        onDelete={(roleId) => {
          const role = sortedRoles.find((r: any) => r.id === roleId);
          if (role) {
            setRoleToDelete(role);
            setSheetOpen(false);
          }
        }}
      />

      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-bold">{roleToDelete?.name}</span> and remove
              it from all assigned workers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(roleToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
