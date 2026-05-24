"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { AppLayout } from "@/components/layout/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { HeartHandshake, Users, LoaderCircle, Upload, PlusCircle, MoreHorizontal, Edit, Trash2, UserCog, Utensils, Search, ChevronRight, Shield, User as UserIcon, Building2, Check } from "lucide-react";
import type { Ministry, Worker, Department } from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Input } from "@studio/ui";
import { Label } from "@studio/ui";
import { Textarea } from "@studio/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, ScrollArea } from "@studio/ui";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@studio/ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@studio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@studio/ui";
import { useMinistries } from "@/hooks/use-ministries";
import { useWorkers } from "@/hooks/use-workers";
import { createMinistries } from "@/actions/db";
import { WorkloadCategoriesSection } from "./workload-categories-section";

const DEPT_COLORS: Record<string, string> = {
  Worship: "bg-violet-500/10 text-violet-600 border-violet-200",
  Outreach: "bg-orange-500/10 text-orange-600 border-orange-200",
  Relationship: "bg-pink-500/10 text-pink-600 border-pink-200",
  Discipleship: "bg-blue-500/10 text-blue-600 border-blue-200",
  Administration: "bg-slate-500/10 text-slate-600 border-slate-200",
};

const DEPT_DOT: Record<string, string> = {
  Worship: "bg-violet-500",
  Outreach: "bg-orange-500",
  Relationship: "bg-pink-500",
  Discipleship: "bg-blue-500",
  Administration: "bg-slate-500",
};

const generateMinistryId = (name: string, department: string) => {
  const firstLetter = department.charAt(0).toUpperCase();
  return `${firstLetter}-${name.trim()}`;
};

const MinistryForm = ({ ministry, workers, departments, onSave, onClose }: { ministry: Partial<Ministry> | null; workers: Worker[]; departments: Department[]; onSave: (data: Partial<Ministry>) => void; onClose: () => void; }) => {
  const [formData, setFormData] = useState<Partial<Ministry>>({ name: '', description: '', department: 'Worship', leaderId: '', headId: '', weight: 0 });
  useEffect(() => { if (ministry) setFormData(ministry); else setFormData({ name: '', description: '', department: 'Worship', leaderId: '', headId: '', weight: 0 }); }, [ministry]);
  const set = (field: keyof Ministry, value: string | number) => setFormData(p => ({ ...p, [field]: value }));
  return (
    <>
      <SheetHeader><SheetTitle>{ministry ? 'Edit Ministry' : 'Add New Ministry'}</SheetTitle><SheetDescription>Fill in the details for the ministry.</SheetDescription></SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2"><Label>Ministry Name</Label><Input value={formData.name} onChange={e => set('name', e.target.value)} /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="space-y-2"><Label>Department</Label>
          <Select value={formData.department} onValueChange={v => set('department', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Leader</Label>
          <Select value={formData.leaderId || 'none'} onValueChange={v => set('leaderId', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select a leader" /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem>{workers.map(w => <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Ministry Head</Label>
          <Select value={formData.headId || 'none'} onValueChange={v => set('headId', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select a head" /></SelectTrigger>
            <SelectContent><SelectItem value="none">None</SelectItem>{workers.map(w => <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Weight (sort order)</Label><Input type="number" value={formData.weight ?? 0} onChange={e => set('weight', parseInt(e.target.value) || 0)} /></div>
      </div>
      <SheetFooter><SheetClose asChild><Button variant="secondary">Cancel</Button></SheetClose><Button onClick={() => onSave(formData)}>Save Changes</Button></SheetFooter>
    </>
  );
};

const AppointForm = ({ ministry, workers, type, onSave, onClose }: { ministry: Ministry; workers: Worker[]; type: 'approver' | 'assigner' | 'head' | 'manager'; onSave: (id: string, userId: string | null, type: any) => void; onClose: () => void; }) => {
  const current = type === 'approver' ? ministry.approverId : type === 'assigner' ? ministry.mealStubAssignerId : type === 'manager' ? ministry.managerId : ministry.headId;
  const [sel, setSel] = useState(current || 'none');
  const [search, setSearch] = useState('');

  const labels: Record<string, string> = { approver: 'Approver', assigner: 'Meal Stub Assigner', head: 'Ministry Head', manager: 'Ministry Manager' };
  const filtered = workers.filter(w => 
    w.workerId?.toLowerCase().includes(search.toLowerCase()) || 
    w.firstName.toLowerCase().includes(search.toLowerCase()) || 
    w.lastName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.firstName.localeCompare(b.firstName)).slice(0, 50);

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <SheetHeader className="pb-4">
        <SheetTitle>Appoint {labels[type]}</SheetTitle>
        <SheetDescription>For {ministry.name}</SheetDescription>
      </SheetHeader>

      <div className="pb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" autoFocus />
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-2 py-2">
          <div 
             className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors ${sel === 'none' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
             onClick={() => setSel('none')}
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
               <UserCog className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-muted-foreground">None (Remove current)</p></div>
            {sel === 'none' && <Check className="h-4 w-4 text-primary shrink-0" />}
          </div>

          {filtered.map(w => (
            <div 
              key={w.id} 
              className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors ${sel === w.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              onClick={() => setSel(w.id)}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={w.avatarUrl} />
                <AvatarFallback className="text-[10px]">{w.firstName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{w.firstName} {w.lastName}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{w.workerId || 'No ID'}</p>
              </div>
              {sel === w.id && <Check className="h-4 w-4 text-primary shrink-0" />}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-center text-muted-foreground italic py-4">No workers found.</p>}
        </div>
      </ScrollArea>

      <SheetFooter className="pt-4 mt-auto">
        <SheetClose asChild><Button variant="secondary" onClick={onClose}>Cancel</Button></SheetClose>
        <Button onClick={() => onSave(ministry.id, sel === 'none' ? null : sel, type)}>Save</Button>
      </SheetFooter>
    </div>
  );
};

export default function MinistryManagementPage() {
  const { canManageMinistries, canAppointApprovers, workerProfile, isLoading: roleLoading } = useUserRole();
  const { ministries, isLoading: ministriesLoading, createMinistry, updateMinistry, deleteMinistry, assignMinistryManager } = useMinistries();
  const { workers, isLoading: workersLoading } = useWorkers({ limit: 2000 });
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [activeDept, setActiveDept] = useState<string>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMinistry, setFormMinistry] = useState<Ministry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ministry | null>(null);
  const [appointOpen, setAppointOpen] = useState(false);
  const [appointType, setAppointType] = useState<'approver' | 'assigner' | 'head' | 'manager'>('approver');
  const [appointTarget, setAppointTarget] = useState<Ministry | null>(null);

  const departments: Department[] = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'];
  const isLoading = ministriesLoading || workersLoading || roleLoading;
  const getWorker = (id?: string) => id ? workers?.find(w => w.id === id) : undefined;
  const canAppoint = (m: Ministry) => canAppointApprovers || m.leaderId === workerProfile?.id;

  const filtered = useMemo(() => {
    if (!ministries) return [];
    return ministries.filter(m => {
      const matchDept = activeDept === 'All' || m.department === activeDept;
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
      return matchDept && matchSearch;
    }).sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0) || a.name.localeCompare(b.name));
  }, [ministries, activeDept, search]);

  const selected = selectedId ? ministries?.find(m => m.id === selectedId) : null;
  const deptCounts = useMemo(() => {
    const c: Record<string, number> = { All: ministries?.length || 0 };
    departments.forEach(d => { c[d] = ministries?.filter(m => m.department === d).length || 0; });
    return c;
  }, [ministries]);

  const memberCount = (m: Ministry) => workers?.filter(w => w.majorMinistryId === m.id || w.minorMinistryId === m.id).length || 0;

  const handleSave = async (data: Partial<Ministry>) => {
    try {
      if (formMinistry) {
        await updateMinistry({ id: formMinistry.id, data });
        await logAction('Updated Ministry', 'Ministries', `Updated "${data.name || formMinistry.name}"`);
        toast({ title: 'Ministry Updated' });
      } else {
        const id = generateMinistryId(data.name || 'New', data.department as string || 'Worship');
        await createMinistry({ ...data, id, description: data.description || '', leaderId: data.leaderId || '', headId: data.headId || '' });
        await logAction('Created Ministry', 'Ministries', `Created "${data.name}"`);
        toast({ title: 'Ministry Added', description: `ID: ${id}` });
      }
      setFormOpen(false);
    } catch { toast({ variant: 'destructive', title: 'Save Failed' }); }
  };

  const handleAppoint = async (ministryId: string, userId: string | null, type: 'approver' | 'assigner' | 'head' | 'manager') => {
    try {
      if (type === 'manager') { await assignMinistryManager({ ministryId, managerId: userId }); }
      else {
        const field = type === 'approver' ? 'approverId' : type === 'assigner' ? 'mealStubAssignerId' : 'headId';
        await updateMinistry({ id: ministryId, data: { [field]: userId ?? '' } });
      }
      toast({ title: 'Assignment Updated' });
      setAppointOpen(false);
    } catch { toast({ variant: 'destructive', title: 'Update Failed' }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMinistry(deleteTarget.id);
      await logAction('Deleted Ministry', 'Ministries', `Deleted "${deleteTarget.name}"`);
      toast({ title: 'Ministry Deleted' });
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    } catch { toast({ variant: 'destructive', title: 'Delete Failed' }); }
  };

  const openAppoint = (m: Ministry, type: 'approver' | 'assigner' | 'head' | 'manager') => {
    setAppointTarget(m); setAppointType(type); setTimeout(() => setAppointOpen(true), 50);
  };

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-64"><LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" /></div></AppLayout>;
  if (!canManageMinistries) return <AppLayout><div className="p-8 text-center text-muted-foreground">Access Denied</div></AppLayout>;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-6">
        {/* LEFT PANEL */}
        <div className="w-72 shrink-0 border-r flex flex-col bg-card">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-base font-headline">Ministries</h1>
              <Button size="sm" onClick={() => { setFormMinistry(null); setFormOpen(true); }}>
                <PlusCircle className="h-3.5 w-3.5 mr-1" /> New
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ministries..." className="pl-8 h-8 text-sm" />
            </div>
          </div>

          {/* Dept filter */}
          <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto scrollbar-none">
            {['All', ...departments].map(d => (
              <button key={d} onClick={() => setActiveDept(d)}
                className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full transition-colors ${activeDept === d ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {d === 'All' ? 'All' : d.slice(0, 4)} {deptCounts[d] || 0}
              </button>
            ))}
          </div>

          {/* Ministry list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No ministries found.</p>}
            {departments.filter(d => activeDept === 'All' || d === activeDept).map(dept => {
              const items = filtered.filter(m => m.department === dept);
              if (!items.length) return null;
              return (
                <div key={dept}>
                  <div className="px-3 py-2 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${DEPT_DOT[dept]}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{dept}</span>
                  </div>
                  {items.map(m => (
                    <button key={m.id} onClick={() => setSelectedId(m.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b last:border-0 transition-colors hover:bg-muted/50 ${selectedId === m.id ? 'bg-muted' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold border ${DEPT_COLORS[dept]}`}>
                        {m.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">{memberCount(m)} members</p>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-opacity ${selectedId === m.id ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 overflow-y-auto bg-background">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="p-4 bg-muted rounded-full"><Building2 className="h-8 w-8 text-muted-foreground" /></div>
              <p className="text-sm text-muted-foreground">Select a ministry to view details</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border-2 ${DEPT_COLORS[selected.department]}`}>
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold font-headline">{selected.name}</h2>
                      <Badge variant="outline" className={`text-[10px] ${DEPT_COLORS[selected.department]}`}>{selected.department}</Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{selected.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => router.push('/ministries/' + encodeURIComponent(selected.id))}>
                    View Full Details
                  </Button>
                  {(canManageMinistries || canAppoint(selected)) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canAppoint(selected) && <>
                          <DropdownMenuItem onSelect={() => openAppoint(selected, 'head')}><Users className="mr-2 h-4 w-4" />Appoint Head</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openAppoint(selected, 'approver')}><UserCog className="mr-2 h-4 w-4" />Appoint Approver</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openAppoint(selected, 'assigner')}><Utensils className="mr-2 h-4 w-4" />Appoint Meal Assigner</DropdownMenuItem>
                        </>}
                        {canManageMinistries && <>
                          <DropdownMenuItem onSelect={() => openAppoint(selected, 'manager')}><UserCog className="mr-2 h-4 w-4" />Appoint Manager</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => { setFormMinistry(selected); setTimeout(() => setFormOpen(true), 50); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDeleteTarget(selected)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Description */}
              {selected.description && <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-4 border">{selected.description}</p>}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Members', value: memberCount(selected), icon: Users },
                  { label: 'Primary Members', value: workers?.filter(w => w.majorMinistryId === selected.id).length || 0, icon: UserIcon },
                  { label: 'Secondary Members', value: workers?.filter(w => w.minorMinistryId === selected.id && w.majorMinistryId !== selected.id).length || 0, icon: Shield },
                ].map(s => (
                  <div key={s.label} className="bg-card border rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><s.icon className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                  </div>
                ))}
              </div>

              {/* Leadership grid */}
              <div>
                <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">Leadership</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { role: 'Leader', workerId: selected.leaderId },
                    { role: 'Ministry Head', workerId: selected.headId },
                    { role: 'Manager', workerId: selected.managerId },
                    { role: 'Approver', workerId: selected.approverId },
                    { role: 'Meal Assigner', workerId: selected.mealStubAssignerId },
                  ].map(({ role, workerId }) => {
                    const w = getWorker(workerId);
                    return (
                      <div key={role} className="flex items-center gap-3 bg-card border rounded-lg p-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          {w && <AvatarImage src={w.avatarUrl} />}
                          <AvatarFallback className="text-xs">{w ? w.firstName[0] : '—'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{role}</p>
                          {w ? <p className="text-sm font-medium truncate">{w.firstName} {w.lastName}</p>
                            : <p className="text-xs text-muted-foreground italic">Unassigned</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Roles / Workload Categories */}
              <div>
                <WorkloadCategoriesSection 
                  ministry={selected} 
                  members={workers?.filter(w => w.majorMinistryId === selected.id || w.minorMinistryId === selected.id) || []} 
                />
              </div>

              {/* Members preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Members</h3>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => router.push('/ministries/' + encodeURIComponent(selected.id))}>
                    View All
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {(workers?.filter(w => w.majorMinistryId === selected.id || w.minorMinistryId === selected.id) || []).slice(0, 5).map(w => (
                    <div key={w.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card">
                      <Avatar className="h-7 w-7"><AvatarImage src={w.avatarUrl} /><AvatarFallback className="text-[10px]">{w.firstName[0]}</AvatarFallback></Avatar>
                      <span className="text-sm flex-1">{w.firstName} {w.lastName}</span>
                      {w.minorMinistryId === selected.id && w.majorMinistryId !== selected.id && (
                        <Badge variant="secondary" className="text-[9px] px-1.5">Minor</Badge>
                      )}
                    </div>
                  ))}
                  {memberCount(selected) === 0 && <p className="text-xs text-muted-foreground italic text-center py-4">No members yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sheets & Dialogs */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="sm:max-w-lg">
          {workers && <MinistryForm ministry={formMinistry} workers={workers} departments={departments} onSave={handleSave} onClose={() => setFormOpen(false)} />}
        </SheetContent>
      </Sheet>

      <Sheet open={appointOpen} onOpenChange={setAppointOpen}>
        <SheetContent className="sm:max-w-lg">
          {workers && appointTarget && <AppointForm ministry={appointTarget} workers={workers} type={appointType} onSave={handleAppoint} onClose={() => setAppointOpen(false)} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ministry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <strong>{deleteTarget?.name}</strong>. This cannot be undone.</AlertDialogDescription>
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
