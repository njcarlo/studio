"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@studio/ui";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@studio/ui";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@studio/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import {
  LoaderCircle, PlusCircle, Trash2, Save, ShieldCheck,
  Shield, ArrowLeft, Search, MoreHorizontal, RefreshCw,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useRoles } from "@/hooks/use-roles";
import { useWorkers } from "@/hooks/use-workers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@studio/ui";
import {
  setRolePermissionsByKeys, createRole, updateRole, deleteRole,
} from "@/actions/db";
import { seedPermissions } from "@/actions/seed-permissions";
import { ALL_PERMISSIONS } from "@/lib/permissions/registry";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ── Permission categories ──────────────────────────────────────────────────────
const PERMISSION_CATEGORIES = (() => {
  const grouped: Record<string, { key: string; label: string; description: string }[]> = {};
  for (const p of ALL_PERMISSIONS) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push({ key: `${p.module}:${p.action}`, label: p.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), description: p.description || "" });
  }
  const MODULE_LABELS: Record<string, string> = {
    roles: "Roles", workers: "Workers", ministries: "Ministries", facilities: "Facilities",
    venues: "Room Reservations", approvals: "Approvals", attendance: "Scanner & Attendance",
    meals: "Meal Stubs", mentorship: "Connect 2 Souls", reports: "Reports",
    system: "System", venue_assistance: "Venue Assistance", schedule: "Service Schedule", inventory: "Inventory",
  };
  return Object.entries(grouped).map(([module, permissions]) => ({ module, category: MODULE_LABELS[module] || module, permissions }));
})();

// ── Permission Sheet ───────────────────────────────────────────────────────────
function RolePermissionSheet({ role, isOpen, onOpenChange, onSave, onDelete, isSaving }: {
  role: any | null; isOpen: boolean; onOpenChange: (open: boolean) => void;
  onSave: (name: string, permKeys: string[]) => void;
  onDelete: (roleId: string) => void; isSaving?: boolean;
}) {
  const [name, setName] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setName(role?.name || "New Role");
      setSelectedKeys((role?.rolePermissions || []).map((rp: any) => `${rp.permission.module}:${rp.permission.action}`));
    }
  }, [role, isOpen]);

  const isAdminRole = role?.isSuperAdmin || role?.id === "admin";

  const toggle = (key: string, checked: boolean) =>
    setSelectedKeys(curr => checked ? [...curr, key] : curr.filter(k => k !== key));

  const toggleModule = (moduleKeys: string[], checked: boolean) =>
    setSelectedKeys(curr => {
      if (checked) { const next = new Set(curr); moduleKeys.forEach(k => next.add(k)); return [...next]; }
      return curr.filter(k => !moduleKeys.includes(k));
    });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">{role?.id ? "Edit Role" : "Add New Role"}</SheetTitle>
          <SheetDescription>{isAdminRole ? "Super Admin roles have all permissions and cannot be changed." : "Configure granular permissions for this role."}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input id="role-name" value={name} onChange={e => setName(e.target.value)} disabled={isAdminRole} placeholder="e.g., Ministry Coordinator" />
          </div>
          {!isAdminRole && (
            <div className="space-y-2">
              <Label>Permissions</Label>
              <Accordion type="multiple" className="w-full border rounded-lg" defaultValue={PERMISSION_CATEGORIES.map(c => c.module)}>
                {PERMISSION_CATEGORIES.map(({ module, category, permissions }) => {
                  const moduleKeys = permissions.map(p => p.key);
                  const selectedCount = moduleKeys.filter(k => selectedKeys.includes(k)).length;
                  const allSelected = selectedCount === moduleKeys.length;
                  const someSelected = selectedCount > 0 && !allSelected;
                  return (
                    <AccordionItem value={module} key={module} className="px-4">
                      <div className="flex items-center gap-2 py-1">
                        <Checkbox id={`module-all-${module}`} checked={allSelected} data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"} onCheckedChange={checked => toggleModule(moduleKeys, !!checked)} onClick={e => e.stopPropagation()} className="shrink-0" />
                        <AccordionTrigger className="flex-1 text-base font-semibold py-2 hover:no-underline">
                          <span className="flex items-center gap-2">{category}<Badge variant={selectedCount > 0 ? "default" : "outline"} className="text-xs">{selectedCount}/{moduleKeys.length}</Badge></span>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="pt-1 pb-3 pl-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                          {permissions.map(permission => (
                            <div className="flex items-start space-x-2" key={permission.key}>
                              <Checkbox id={`${role?.id || "new"}-${permission.key}`} checked={selectedKeys.includes(permission.key)} onCheckedChange={checked => toggle(permission.key, !!checked)} />
                              <div className="grid gap-1 leading-none">
                                <Label htmlFor={`${role?.id || "new"}-${permission.key}`} className="font-medium cursor-pointer text-xs font-mono text-muted-foreground">{permission.key}</Label>
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
            {role?.id && <Button type="button" variant="ghost" className="text-destructive hover:text-destructive mr-auto" onClick={() => onDelete(role.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete Role</Button>}
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" disabled={isSaving} onClick={() => onSave(name, selectedKeys)}>
              {isSaving ? <><LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : <><Save className="h-4 w-4 mr-2" /> Save Role</>}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RoleManagementPage() {
  const { canManageRoles } = useUserRole();
  const { roles, isLoading } = useRoles();
  const { workers } = useWorkers({ limit: 999999 });
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "system" | "custom">("all");

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
    } catch { toast({ variant: "destructive", title: "Sync failed" }); }
    finally { setIsSyncing(false); }
  };

  const saveMutation = useMutation({
    mutationFn: async ({ role, name, permKeys }: { role: any | null; name: string; permKeys: string[] }) => {
      if (role?.id) { await updateRole(role.id, { name }); await setRolePermissionsByKeys(role.id, permKeys); return { id: role.id, name }; }
      const created = await createRole({ name, permissions: [] });
      await setRolePermissionsByKeys(created.id, permKeys);
      return created;
    },
    onSuccess: async (result, { role }) => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
      await logAction(role?.id ? "Updated Role" : "Created Role", "Roles", `${role?.id ? "Updated" : "Created"} role "${result.name}"`);
      toast({ title: role?.id ? "Role Updated" : "Role Created" });
      setSheetOpen(false);
    },
    onError: err => toast({ variant: "destructive", title: "Save Failed", description: err instanceof Error ? err.message : "Could not save the role." }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      await logAction("Deleted Role", "Roles", `Deleted role "${roleToDelete?.name}"`);
      toast({ title: "Role Deleted" });
      setRoleToDelete(null);
    },
    onError: () => toast({ variant: "destructive", title: "Delete Failed" }),
  });

  const handleSaveRole = (name: string, permKeys: string[]) => {
    if (!name.trim()) { toast({ variant: "destructive", title: "Role name is required." }); return; }
    saveMutation.mutate({ role: selectedRole, name, permKeys });
  };

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!canManageRoles) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>No permission.</CardDescription></CardHeader></Card></AppLayout>;

  const sortedRoles = [...(roles || [])].sort((a: any, b: any) => a.isSuperAdmin ? -1 : b.isSuperAdmin ? 1 : a.name.localeCompare(b.name));

  const filtered = sortedRoles.filter((r: any) => {
    const q = search.trim().toLowerCase();
    if (q && !r.name.toLowerCase().includes(q)) return false;
    if (typeFilter === "system" && !r.isSystemRole) return false;
    if (typeFilter === "custom" && r.isSystemRole) return false;
    return true;
  });

  // Count workers per role
  const workerCountByRole = (roleId: string) =>
    (workers || []).filter(w => w.roleId === roleId || (w as any).roles?.some((wr: any) => wr.roleId === roleId)).length;

  // Permission labels for display (max 5)
  const getPermLabels = (role: any): string[] => {
    if (role.isSuperAdmin) return ["All Access"];
    return (role.rolePermissions || []).slice(0, 5).map((rp: any) => {
      const action = rp.permission?.action || "";
      return action.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    });
  };

  return (
    <AppLayout>
      <div className="space-y-7 pb-12 w-full">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 shrink-0 mt-0.5">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground leading-none">Role Management</h1>
            <div className="flex items-center justify-between gap-4 -mt-1">
              <p className="text-sm text-muted-foreground leading-none">Define roles and fine-grained permissions across the app.</p>
              <Link href="/settings" className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors shrink-0">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-4 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search roles...." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex items-center gap-2">
            {/* Type filter */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
              {(["all", "system", "custom"] as const).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                    typeFilter === t ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={() => { setSelectedRole(null); setSheetOpen(true); }}
              className="h-9 px-4 flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              <PlusCircle className="h-4 w-4" /> New Role
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 border-b border-border/40">
                  {["Role", "Type", "Members", "Permissions", "Actions"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-14 text-center text-sm text-muted-foreground">No roles found.</td></tr>
                ) : filtered.map((role: any) => {
                  const permLabels = getPermLabels(role);
                  const memberCount = workerCountByRole(role.id);
                  return (
                    <tr key={role.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{role.name}</span>
                          {role.isSuperAdmin && <ShieldCheck className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {role.isSystemRole
                          ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> System</span>
                          : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Custom</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{memberCount}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {permLabels.map(label => (
                            <span key={label} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{label}</span>
                          ))}
                          {(role.rolePermissions?.length || 0) > 5 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">+{(role.rolePermissions?.length || 0) - 5} more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => { setSelectedRole(role); setSheetOpen(true); }}>Edit Role</DropdownMenuItem>
                            {!role.isSystemRole && (
                              <DropdownMenuItem className="text-destructive" onClick={() => setRoleToDelete(role)}>Delete Role</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RolePermissionSheet isOpen={sheetOpen} onOpenChange={setSheetOpen} role={selectedRole} onSave={handleSaveRole} isSaving={saveMutation.isPending}
        onDelete={roleId => { const role = sortedRoles.find((r: any) => r.id === roleId); if (role) { setRoleToDelete(role); setSheetOpen(false); } }} />

      <AlertDialog open={!!roleToDelete} onOpenChange={open => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <span className="font-bold">{roleToDelete?.name}</span> and remove it from all assigned workers.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(roleToDelete.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
