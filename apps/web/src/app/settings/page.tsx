"use client";

import React from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import {
  LoaderCircle, AlertTriangle, Settings, Shield, Building2,
  Building, Utensils, MapPin, Clock, Database, ArrowRight,
  Users, UtensilsCrossed, TrendingUp, Zap,
} from "lucide-react";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { upsertRole, updateWorker, getRoles, getWorkers, getMinistries, getRooms, getDepartmentSettings } from "@/actions/db";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@studio/ui";
import { Button } from "@studio/ui";
import { cn } from "@/lib/utils";

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconBg }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={cn("p-2 rounded-xl shrink-0", iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-4xl font-black tracking-tight text-foreground leading-none">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
    </div>
  );
}

// ── Module card ────────────────────────────────────────────────────────────────
function ModuleCard({ href, icon: Icon, iconBg, title, description, badge }: {
  href: string; icon: React.ElementType; iconBg: string;
  title: string; description: string; badge?: string;
}) {
  return (
    <Link href={href}
      className="group bg-card rounded-2xl border border-border/60 shadow-card-dark p-6 flex flex-col gap-4 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer">
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl", iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      {badge && <p className="text-xs font-semibold text-muted-foreground">{badge}</p>}
    </Link>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { isLoading, needsSeeding, workerProfile, canManageRoles, canManageMinistries, canManageFacilities } = useUserRole();
  const { user } = useAuthStore();
  const { toast } = useToast();

  // Live counts from DB
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: getRoles });
  const { data: workers } = useQuery({ queryKey: ["workers-all"], queryFn: () => getWorkers() });
  const { data: ministries } = useQuery({ queryKey: ["ministries"], queryFn: getMinistries });
  const { data: rooms } = useQuery({ queryKey: ["rooms"], queryFn: getRooms });
  const { data: deptSettings } = useQuery({ queryKey: ["department-settings"], queryFn: getDepartmentSettings });

  const roleCount = roles?.length ?? 0;
  const systemRoles = (roles as any[] || []).filter(r => r.isSystemRole).length;
  const customRoles = roleCount - systemRoles;
  const totalMembers = workers?.length ?? 0;
  const ministryCount = (ministries as any[] || []).length;
  const deptCount = (deptSettings as any[] || []).length;
  const facilityCount = rooms?.length ?? 0;
  const weeklyMealPool = (ministries as any[] || []).reduce((sum, m) => sum + (m.mealStubWeeklyLimit || 0), 0);
  const activeWorkers = (workers as any[] || []).filter(w => w.status === "Active").length;

  const initializeSystem = async () => {
    if (!user) { toast({ variant: "destructive", title: "Not Logged In" }); return; }
    try {
      const rolesData = [
        { id: "admin", name: "Admin", permissions: [], isSuperAdmin: true, isSystemRole: true },
        { id: "approver", name: "Approver", permissions: ["manage_approvals"], isSystemRole: true },
        { id: "editor", name: "Editor", permissions: ["manage_ministries", "manage_rooms"], isSystemRole: true },
        { id: "viewer", name: "Viewer", permissions: [], isSystemRole: true },
      ];
      for (const role of rolesData) {
        await upsertRole(role.id, { name: role.name, permissions: role.permissions, isSuperAdmin: role.isSuperAdmin, isSystemRole: role.isSystemRole });
      }
      await updateWorker(user.uid, { roleId: "admin", status: "Active" });
      toast({ title: "System Initialized", description: "Default roles created. Please refresh." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Initialization Failed", description: e.message });
    }
  };

  const canAccess = canManageRoles || canManageMinistries || canManageFacilities || needsSeeding || (workerProfile && !workerProfile.roleId);

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!user) return <AppLayout><Card><CardHeader><CardTitle>Not Logged In</CardTitle></CardHeader></Card></AppLayout>;
  if (!canAccess) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-7 pb-12 w-full">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage every part of your COG App configuration from one place.</p>
        </div>

        {/* Seeding banner */}
        {needsSeeding && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Initial Setup Required</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Your application has not been initialized. Create default roles and set your account as master administrator.</p>
            </div>
            <Button onClick={initializeSystem} size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
              Initialize System
            </Button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Roles" value={roleCount} sub={`${systemRoles} system · ${customRoles} custom`}
            icon={Shield} iconBg="bg-primary/10 text-primary" />
          <StatCard label="Total Members" value={totalMembers.toLocaleString()} sub={`Across ${ministryCount} ministries`}
            icon={Users} iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500" />
          <StatCard label="Weekly Meal Pool" value={weeklyMealPool.toLocaleString()} sub={`${activeWorkers} allocated`}
            icon={UtensilsCrossed} iconBg="bg-orange-50 dark:bg-orange-950/40 text-orange-500" />
          <StatCard label="Facilities" value={facilityCount} sub={`${deptCount} departments`}
            icon={Building} iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-500" />
        </div>

        {/* Modules */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Modules</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <ModuleCard
              href="/settings/general"
              icon={Settings}
              iconBg="bg-primary/10 text-primary"
              title="General"
              description="Application name, system preferences and global defaults."
              badge="12 preferences"
            />
            {canManageRoles && (
              <ModuleCard
                href="/settings/roles"
                icon={Shield}
                iconBg="bg-primary/10 text-primary"
                title="Role Management"
                description="Define roles and fine-grained permissions across the app."
                badge={`${roleCount} role${roleCount !== 1 ? "s" : ""}`}
              />
            )}
            {canManageMinistries && (
              <ModuleCard
                href="/settings/departments"
                icon={Building2}
                iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-500"
                title="Department Management"
                description="Organise departments, heads and meal stub pools."
                badge={`${deptCount} department${deptCount !== 1 ? "s" : ""}`}
              />
            )}
            {canManageMinistries && (
              <ModuleCard
                href="/settings/ministries"
                icon={Building}
                iconBg="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500"
                title="Ministry Management"
                description="Manage ministries, leaders and weekly allocations."
                badge={`${ministryCount} ministr${ministryCount !== 1 ? "ies" : "y"}`}
              />
            )}
            {canManageMinistries && (
              <ModuleCard
                href="/settings/meal-stubs"
                icon={Utensils}
                iconBg="bg-orange-50 dark:bg-orange-950/40 text-orange-500"
                title="Meal Stub Allocation"
                description="Distribute the weekly meal stub pool across teams."
                badge={`${weeklyMealPool.toLocaleString()} / week`}
              />
            )}
            {canManageFacilities && (
              <ModuleCard
                href="/settings/rooms"
                icon={MapPin}
                iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500"
                title="Facilities Management"
                description="Rooms, areas and satellite campuses in one place."
                badge={`${facilityCount} facilit${facilityCount !== 1 ? "ies" : "y"}`}
              />
            )}
            {canManageRoles && (
              <ModuleCard
                href="/settings/transaction-logs"
                icon={Clock}
                iconBg="bg-slate-100 dark:bg-slate-800 text-slate-500"
                title="Transaction Logs"
                description="Full audit trail of activity across every module."
                badge="Live"
              />
            )}

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
