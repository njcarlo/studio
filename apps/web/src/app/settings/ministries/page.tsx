"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import {
  Building2, HeartHandshake, User as UserIcon, Users, LoaderCircle,
  Upload, PlusCircle, MoreHorizontal, Edit, Trash2, UserCog, Utensils,
  Eye, ArrowLeft, Search,
} from "lucide-react";
import type { Ministry, Worker, Department } from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@studio/ui";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@studio/ui";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@studio/ui";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import { Textarea } from "@studio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@studio/ui";
import { Copy, ClipboardCheck, Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { useMinistries } from "@/hooks/use-ministries";
import { useWorkers } from "@/hooks/use-workers";
import { createMinistries } from "@/actions/db";
import { cn } from "@/lib/utils";

const generateMinistryId = (name: string, department: string) =>
  `${department.charAt(0).toUpperCase()}-${name.trim()}`;

// ── Worker initials ────────────────────────────────────────────────────────────
function WorkerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-[11px] font-black shrink-0">{init}</span>;
}

// ── Ministry Form ──────────────────────────────────────────────────────────────
function MinistryForm({ ministry, workers, departments, onSave, onClose }: {
  ministry: Partial<Ministry> | null; workers: Worker[]; departments: Department[];
  onSave: (data: Partial<Ministry>) => void; onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Ministry>>({ name: "", description: "", department: "Worship", leaderId: "", headId: "" });
  useEffect(() => { if (ministry) setFormData(ministry); else setFormData({ name: "", description: "", department: "Worship", leaderId: "", headId: "", weight: 0 }); }, [ministry]);
  const set = (field: keyof Ministry, value: string | number) => setFormData(p => ({ ...p, [field]: value }));
  return (
    <>
      <SheetHeader><SheetTitle className="font-headline">{ministry ? "Edit Ministry" : "Add New Ministry"}</SheetTitle><SheetDescription>Fill in the details for the ministry.</SheetDescription></SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2"><Label>Ministry Name</Label><Input value={formData.name} onChange={e => set("name", e.target.value)} /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => set("description", e.target.value)} /></div>
        <div className="space-y-2"><Label>Department</Label>
          <Select value={formData.department} onValueChange={v => set("department", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Leader</Label>
          <Select value={formData.leaderId || "none"} onValueChange={v => set("leaderId", v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Select a leader" /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem>{workers.map(w => <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Ministry Head</Label>
          <Select value={formData.headId || "none"} onValueChange={v => set("headId", v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Select a ministry head" /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem>{workers.map(w => <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Weight (for sorting)</Label><Input type="number" value={formData.weight ?? 0} onChange={e => set("weight", parseInt(e.target.value, 10) || 0)} /></div>
      </div>
      <SheetFooter><SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose><Button onClick={() => onSave(formData)}>Save Changes</Button></SheetFooter>
    </>
  );
}

// ── Appoint Sheet ──────────────────────────────────────────────────────────────
function AppointSheet({ ministry, workers, onSave, onClose, type = "approver" }: {
  ministry: Ministry; workers: Worker[];
  onSave: (id: string, userId: string | null, type: "approver" | "assigner" | "head") => void;
  onClose: () => void; type?: "approver" | "assigner" | "head";
}) {
  const init = type === "approver" ? (ministry.approverId || "none") : type === "assigner" ? (ministry.mealStubAssignerId || "none") : (ministry.headId || "none");
  const [sel, setSel] = useState<string>(init);
  const sorted = [...workers].sort((a, b) => a.firstName.localeCompare(b.firstName));
  const label = type === "approver" ? "Approver" : type === "assigner" ? "Meal Stub Assigner" : "Ministry Head";
  return (
    <>
      <SheetHeader><SheetTitle>Appoint {label}</SheetTitle><SheetDescription>Select a worker for {ministry.name}.</SheetDescription></SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2"><Label>{label}</Label>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">None (Remove {label})</SelectItem>{sorted.map(w => <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <SheetFooter><SheetClose asChild><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button></SheetClose><Button onClick={() => onSave(ministry.id, sel === "none" ? null : sel, type)}>Save Changes</Button></SheetFooter>
    </>
  );
}

// ── Import Sheet ───────────────────────────────────────────────────────────────
function ImportSheetContent({ onImport, onClose }: { onImport: (csv: string) => void; onClose: () => void }) {
  const [csvData, setCsvData] = useState("");
  return (
    <>
      <SheetHeader><SheetTitle>Import Ministries</SheetTitle><SheetDescription>Paste CSV data. First line must be: name,department (1=Worship, 2=Outreach, 3=Relationship, 4=Discipleship, 5=Administration)</SheetDescription></SheetHeader>
      <div className="py-4 space-y-4">
        <Input readOnly defaultValue="name,department" className="font-mono text-xs" />
        <Textarea value={csvData} onChange={e => setCsvData(e.target.value)} placeholder={`name,department\nPrayer Ministry,1`} className="h-64 font-mono text-xs" />
      </div>
      <SheetFooter><SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose><Button onClick={() => onImport(csvData)}>Process Import</Button></SheetFooter>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MinistryManagementPage() {
  const { canManageMinistries, canAppointApprovers, workerProfile, isLoading: isRoleLoading } = useUserRole();
  const { ministries, isLoading: ministriesLoading, createMinistry, updateMinistry, deleteMinistry } = useMinistries();
  const { workers, isLoading: workersLoading } = useWorkers({ limit: 999999 });
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const [importOpen, setImportOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsMinistry, setDetailsMinistry] = useState<Ministry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ministry | null>(null);
  const [appointOpen, setAppointOpen] = useState(false);
  const [appointType, setAppointType] = useState<"approver" | "assigner" | "head">("approver");
  const [appointTarget, setAppointTarget] = useState<Ministry | null>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<"all" | Department>("all");

  const departments: Department[] = ["Worship", "Outreach", "Relationship", "Discipleship", "Administration"];
  const getWorker = (id?: string | null) => id ? workers?.find(w => w.id === id) : null;
  const isLoading = ministriesLoading || workersLoading || isRoleLoading;

  const handleSaveMinistry = async (data: Partial<Ministry>) => {
    try {
      if (selectedMinistry) {
        await updateMinistry({ id: selectedMinistry.id, data });
        await logAction("Updated Ministry", "Ministries", `Updated "${data.name || selectedMinistry.name}"`);
        toast({ title: "Ministry Updated" });
      } else {
        const id = generateMinistryId(data.name || "New", data.department as string || "Worship");
        await createMinistry({ ...data, id, description: data.description || "", leaderId: data.leaderId || "", headId: data.headId || "" });
        await logAction("Created Ministry", "Ministries", `Created "${data.name}" in ${data.department}`);
        toast({ title: "Ministry Added" });
      }
      setFormOpen(false);
    } catch { toast({ variant: "destructive", title: "Save Failed" }); }
  };

  const handleSaveAppointed = async (ministryId: string, userId: string | null, type: "approver" | "assigner" | "head") => {
    try {
      const field = type === "approver" ? "approverId" : type === "assigner" ? "mealStubAssignerId" : "headId";
      await updateMinistry({ id: ministryId, data: { [field]: userId === null ? "" : userId } });
      const label = type === "approver" ? "Approver" : type === "assigner" ? "Meal Stub Assigner" : "Ministry Head";
      toast({ title: `${label} Updated` });
      setAppointOpen(false);
    } catch { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMinistry(deleteTarget.id);
      await logAction("Deleted Ministry", "Ministries", `Deleted "${deleteTarget.name}"`);
      toast({ title: "Ministry Deleted" });
      setDeleteTarget(null);
    } catch { toast({ variant: "destructive", title: "Delete Failed" }); }
  };

  const handleImport = (csvData: string) => {
    const deptMap: Record<string, Department> = { "1": "Worship", "2": "Outreach", "3": "Relationship", "4": "Discipleship", "5": "Administration" };
    Papa.parse(csvData, {
      header: true, skipEmptyLines: true,
      complete: async results => {
        const data = (results.data as any[]).map(row => {
          const dept = deptMap[row.department];
          if (!row.name || !dept) return null;
          return { id: generateMinistryId(row.name, dept), name: row.name, department: dept, description: "", leaderId: "", headId: "" };
        }).filter(Boolean);
        if (!data.length) { toast({ variant: "destructive", title: "No valid rows found" }); return; }
        try { await createMinistries(data as any[]); toast({ title: "Import Successful", description: `${data.length} ministries imported.` }); setImportOpen(false); }
        catch { toast({ variant: "destructive", title: "Import Failed" }); }
      },
    });
  };

  const filteredMinistries = (ministries as Ministry[] || []).filter(m => {
    const q = search.trim().toLowerCase();
    if (q && !m.name.toLowerCase().includes(q)) return false;
    if (deptFilter !== "all" && m.department !== deptFilter) return false;
    return true;
  }).sort((a, b) => { const wa = a.weight ?? 0, wb = b.weight ?? 0; return wa !== wb ? wa - wb : a.name.localeCompare(b.name); });

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
            <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground leading-none">Ministry Management</h1>
            <div className="flex items-center justify-between gap-4 -mt-1">
              <p className="text-sm text-muted-foreground leading-none">Manage ministries, leaders and weekly allocations.</p>
              <Link href="/settings" className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors shrink-0">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search ministries...." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 h-9 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            {/* Dept filter tabs */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 overflow-x-auto">
              {(["all", ...departments] as const).map(d => (
                <button key={d} onClick={() => setDeptFilter(d as any)}
                  className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
                    deptFilter === d ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {d === "all" ? "All" : d}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { setSelectedMinistry(null); setFormOpen(true); }}
            className="h-9 px-4 flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0">
            <PlusCircle className="h-4 w-4" /> Add Ministry
          </button>
        </div>

        {/* Ministry cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMinistries.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No ministries found.</p>
          ) : filteredMinistries.map(ministry => {
            const head = getWorker(ministry.headId);
            const approver = getWorker(ministry.approverId);
            const assigner = getWorker(ministry.mealStubAssignerId);
            const memberCount = (workers || []).filter(w => w.majorMinistryId === ministry.id || w.minorMinistryId === ministry.id).length;
            const weeklyPool = (ministry as any).mealStubWeeklyLimit || 0;

            return (
              <div key={ministry.id} className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 flex flex-col gap-4">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{ministry.name}</h3>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary mt-0.5">{ministry.department}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => { setDetailsMinistry(ministry); setDetailsOpen(true); }}><Eye className="mr-2 h-3.5 w-3.5" /> View Details</DropdownMenuItem>
                        {canManageMinistries && <DropdownMenuItem onClick={() => { setSelectedMinistry(ministry); setFormOpen(true); }}><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => { setAppointTarget(ministry); setAppointType("head"); setAppointOpen(true); }}><Users className="mr-2 h-3.5 w-3.5" /> Appoint Head</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAppointTarget(ministry); setAppointType("approver"); setAppointOpen(true); }}><UserCog className="mr-2 h-3.5 w-3.5" /> Appoint Approver</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAppointTarget(ministry); setAppointType("assigner"); setAppointOpen(true); }}><Utensils className="mr-2 h-3.5 w-3.5" /> Appoint Assigner</DropdownMenuItem>
                        {canManageMinistries && <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(ministry)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Ministry Head */}
                <div className="rounded-xl border border-border/60 bg-background px-3 py-2.5 flex items-center gap-2.5">
                  {head ? (
                    <>
                      <WorkerInitials name={`${head.firstName} ${head.lastName}`} />
                      <div>
                        <p className="text-xs font-bold text-foreground">{head.firstName} {head.lastName}</p>
                        <p className="text-[10px] text-muted-foreground">Ministry Head</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-xs italic">No head assigned</span>
                    </div>
                  )}
                </div>

                {/* Approver + Assigner */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1 mb-0.5">
                      <UserCog className="h-3 w-3" /> Approver
                    </p>
                    <p className="font-semibold text-foreground truncate">{approver ? `${approver.firstName} ${approver.lastName}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1 mb-0.5">
                      <Utensils className="h-3 w-3" /> Meal Stub Assigner
                    </p>
                    <p className="font-semibold text-foreground truncate">{assigner ? `${assigner.firstName} ${assigner.lastName}` : "—"}</p>
                  </div>
                </div>

                {/* Members + Weekly pool */}
                <div className="flex items-center justify-between pt-1 border-t border-border/30">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {memberCount} members
                  </span>
                  {weeklyPool > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ✦ {weeklyPool}/week
                    </span>
                  )}
                </div>

                {/* View Details */}
                <button onClick={() => { setDetailsMinistry(ministry); setDetailsOpen(true); }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-border/60 bg-background text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors">
                  <Eye className="h-4 w-4" /> View Details
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ministry Form Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="sm:max-w-md">
          <MinistryForm ministry={selectedMinistry} workers={workers || []} departments={departments} onSave={handleSaveMinistry} onClose={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Appoint Sheet */}
      <Sheet open={appointOpen} onOpenChange={setAppointOpen}>
        <SheetContent className="sm:max-w-md">
          {appointTarget && <AppointSheet ministry={appointTarget} workers={workers || []} onSave={handleSaveAppointed} onClose={() => setAppointOpen(false)} type={appointType} />}
        </SheetContent>
      </Sheet>

      {/* Import Sheet */}
      <Sheet open={importOpen} onOpenChange={setImportOpen}>
        <SheetContent className="sm:max-w-md">
          <ImportSheetContent onImport={handleImport} onClose={() => setImportOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {detailsMinistry && (() => {
            const m = detailsMinistry;
            const head = getWorker(m.headId);
            const approver = getWorker(m.approverId);
            const assigner = getWorker(m.mealStubAssignerId);
            const leader = getWorker(m.leaderId);
            const members = (workers || []).filter(w => w.majorMinistryId === m.id || w.minorMinistryId === m.id);
            return (
              <div className="flex flex-col gap-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{m.name}</h2>
                    <p className="text-xs text-muted-foreground">{m.department} Department</p>
                  </div>
                </div>
                {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: "Ministry Head", w: head }, { label: "Leader", w: leader }, { label: "Approver", w: approver }, { label: "Meal Assigner", w: assigner }].map(({ label, w }) => (
                    <div key={label} className="rounded-xl border border-border/60 bg-background p-3">
                      <p className="text-[10px] text-muted-foreground mb-1.5">{label}</p>
                      {w ? <div className="flex items-center gap-2"><WorkerInitials name={`${w.firstName} ${w.lastName}`} /><p className="text-xs font-semibold text-foreground truncate">{w.firstName} {w.lastName}</p></div>
                        : <p className="text-xs text-muted-foreground italic">Unassigned</p>}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3">Members ({members.length})</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {members.map(w => (
                      <div key={w.id} className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                        <WorkerInitials name={`${w.firstName} ${w.lastName}`} />
                        <p className="text-xs font-medium text-foreground truncate">{w.firstName} {w.lastName}</p>
                      </div>
                    ))}
                    {members.length === 0 && <p className="col-span-2 text-xs text-muted-foreground italic text-center py-4">No members.</p>}
                  </div>
                </div>
                <div className="flex gap-3 pt-2 border-t border-border/40">
                  <button onClick={() => { setSelectedMinistry(m); setDetailsOpen(false); setFormOpen(true); }}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl border border-border/60 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors">
                    <Edit className="h-4 w-4" /> Edit
                  </button>
                  <button onClick={() => setDetailsOpen(false)}
                    className="flex-1 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ministry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <span className="font-bold">{deleteTarget?.name}</span>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
