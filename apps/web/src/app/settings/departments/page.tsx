"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Building2, UserCog, LoaderCircle, Users, Utensils, ArrowRight, ArrowLeft } from "lucide-react";
import type { Department, Worker } from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useWorkers } from "@/hooks/use-workers";
import { useDepartments } from "@/hooks/use-departments";
import { useMinistries } from "@/hooks/use-ministries";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { Button } from "@studio/ui";
import { Input } from "@studio/ui";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@studio/ui";
import { Label } from "@studio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@studio/ui";
import { Textarea } from "@studio/ui";
import { cn } from "@/lib/utils";
import { subDays } from "date-fns";
import { useMemo } from "react";

type DepartmentData = {
  id: string;
  headId?: string | null;
  description?: string | null;
  mealStubWeekdayAllocation?: number;
  mealStubSundayAllocation?: number;
};

// ── Manage Department Sheet ────────────────────────────────────────────────────
function ManageDepartmentSheet({ departmentName, departmentData, workers, onSave, onClose }: {
  departmentName: Department;
  departmentData: DepartmentData | null;
  workers: Worker[];
  onSave: (id: string, headId: string | null, desc: string, weekday: number, sunday: number) => void;
  onClose: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>(departmentData?.headId || "none");
  const [description, setDescription] = useState(departmentData?.description || "");
  const [weekdayAlloc, setWeekdayAlloc] = useState(departmentData?.mealStubWeekdayAllocation || 0);
  const [sundayAlloc, setSundayAlloc] = useState(departmentData?.mealStubSundayAllocation || 0);

  const sorted = [...workers].sort((a, b) => a.firstName.localeCompare(b.firstName));

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">Manage {departmentName}</SheetTitle>
        <SheetDescription>Assign a department head and update allocations for the {departmentName} department.</SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the department's purpose..." />
        </div>
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-xs font-bold uppercase text-primary">Meal Stub Allocation</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Weekday Pool</Label><Input type="number" min="0" value={weekdayAlloc} onChange={e => setWeekdayAlloc(parseInt(e.target.value) || 0)} /></div>
            <div className="space-y-2"><Label>Sunday Pool</Label><Input type="number" min="0" value={sundayAlloc} onChange={e => setSundayAlloc(parseInt(e.target.value) || 0)} /></div>
          </div>
        </div>
        <div className="space-y-2 pt-4 border-t">
          <Label>Department Head</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger><SelectValue placeholder="Select a department head" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Remove Department Head)</SelectItem>
              {sorted.map(w => <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button></SheetClose>
        <Button onClick={() => onSave(departmentName, selectedUserId === "none" ? null : selectedUserId, description, weekdayAlloc, sundayAlloc)}>
          Save Changes
        </Button>
      </SheetFooter>
    </>
  );
}

// ── Worker initials ────────────────────────────────────────────────────────────
function WorkerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-[11px] font-black shrink-0">{init}</span>;
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DepartmentManagementPage() {
  const { canManageMinistries, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [deptToManage, setDeptToManage] = useState<Department | null>(null);

  const { workers, isLoading: workersLoading } = useWorkers({ limit: 999999 });
  const { departments: deptDataList, isLoading: deptsLoading, upsertDepartment } = useDepartments();
  const { ministries } = useMinistries();

  const monthAgo = useMemo(() => subDays(new Date(), 30), []);
  const { mealStubs } = useMealStubs({ dateFrom: monthAgo });

  const isLoading = workersLoading || deptsLoading || isRoleLoading;

  const departments: Department[] = ["Worship", "Outreach", "Relationship", "Discipleship", "Administration"];

  const getDeptData = (name: string): DepartmentData | null =>
    (deptDataList as any[])?.find(d => d.id === name) || null;

  const getWorker = (id: string) => workers?.find(w => w.id === id);

  const getMinistryCount = (deptName: string) =>
    (ministries as any[] || []).filter(m => m.department === deptName || m.departmentCode === deptName.toUpperCase()).length;

  // Compute used meal stubs per department from mealstubs this month
  const getUsedPool = (deptName: string) => {
    const deptMinistryIds = (ministries as any[] || [])
      .filter(m => m.department === deptName || m.departmentCode === deptName.toUpperCase())
      .map(m => m.id);
    const deptWorkerIds = (workers || [])
      .filter(w => deptMinistryIds.includes(w.majorMinistryId))
      .map(w => w.id);
    return (mealStubs as any[] || []).filter(s => deptWorkerIds.includes(s.workerId)).length;
  };

  const handleSave = async (id: string, headId: string | null, desc: string, weekday: number, sunday: number) => {
    try {
      await upsertDepartment({ id, data: { headId, description: desc, mealStubWeekdayAllocation: weekday, mealStubSundayAllocation: sunday } });
      toast({ title: "Department Updated", description: `${id} department updated successfully.` });
      setSheetOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!canManageMinistries) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>No permission.</CardDescription></CardHeader></Card></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-7 pb-12 w-full">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 shrink-0 mt-0.5">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground leading-none">Department Management</h1>
            <div className="flex items-center justify-between gap-4 -mt-1">
              <p className="text-sm text-muted-foreground leading-none">Manage overarching departments and assign department heads.</p>
              <Link href="/settings" className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors shrink-0">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </div>
          </div>
        </div>

        {/* Department cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map(deptName => {
            const data = getDeptData(deptName);
            const head = data?.headId ? getWorker(data.headId) : null;
            const weekday = data?.mealStubWeekdayAllocation || 0;
            const sunday = data?.mealStubSundayAllocation || 0;
            const total = weekday + sunday;
            const used = getUsedPool(deptName);
            const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
            const ministryCount = getMinistryCount(deptName);

            return (
              <div key={deptName} className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{deptName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{data?.description || "Description"}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                </div>

                {/* Meal Stub Pool progress */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-muted-foreground">Meal Stub Pool</span>
                    <span className="text-muted-foreground">{used.toLocaleString()} / {total.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{pct}% allocated</p>
                </div>

                {/* Weekday / Sunday boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-background px-3 py-2.5">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Weekday
                    </p>
                    <p className="text-2xl font-black text-foreground leading-none">{weekday}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background px-3 py-2.5">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Sunday
                    </p>
                    <p className="text-2xl font-black text-foreground leading-none">{sunday}</p>
                  </div>
                </div>

                {/* Department Head */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2.5">
                  {head ? (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <WorkerInitials name={`${head.firstName} ${head.lastName}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{head.firstName} {head.lastName}</p>
                          <p className="text-[10px] text-muted-foreground">Department Head</p>
                        </div>
                      </div>
                      {ministryCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">{ministryCount} ministr{ministryCount !== 1 ? "ies" : "y"}</span>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-xs italic">No head assigned</span>
                    </div>
                  )}
                </div>

                {/* Manage button */}
                <button
                  onClick={() => { setDeptToManage(deptName); setSheetOpen(true); }}
                  className="flex items-center justify-between w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors group"
                >
                  Manage department
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          {deptToManage && workers && (
            <ManageDepartmentSheet
              departmentName={deptToManage}
              departmentData={getDeptData(deptToManage)}
              workers={workers}
              onSave={handleSave}
              onClose={() => setSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
