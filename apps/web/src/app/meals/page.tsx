"use client";

import React, { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import Image from "next/image";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@studio/ui";
import { Input } from "@studio/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from "@studio/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@studio/ui";
import { Badge } from "@studio/ui";
import { Label } from "@studio/ui";
import { PlusCircle, QrCode, LoaderCircle, Scan, RefreshCw, ShieldAlert, ClipboardList, ShieldCheck, Search, CheckCircle2, Trash2 } from "lucide-react";
import { format, isToday, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { getTodayStubCount, getWeeklyStubCount, getStubCountForDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { Ticket, Layers } from "lucide-react";
import { Progress } from "@studio/ui";
import { useMealAudio } from "@/hooks/use-meal-audio";
import { useWorkers } from "@/hooks/use-workers";
import { useMinistries } from "@/hooks/use-ministries";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useSettings } from "@/hooks/use-settings";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import type { Worker } from "@studio/types";

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ------------------------------------------------------------
function MealsPageContent() {
  const { user } = useAuthStore();
  const { canViewMealStubs, canManageAllMealStubs, isMealStubAssigner, workerProfile, isLoading: isRoleLoading, isMinistryHead, myMinistryIds } = useUserRole();
  const { toast } = useToast();
  const { playSuccess, playError } = useMealAudio();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [assignSearch, setAssignSearch] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "view");
  const [assignDate, setAssignDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const assignDateObj = useMemo(() => new Date(assignDate + 'T12:00:00'), [assignDate]);
  const isSelectedSunday = assignDateObj.getDay() === 0;

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'assign' && (isMealStubAssigner || canManageAllMealStubs || isMinistryHead)) {
      setActiveTab('assign');
    } else if (tab === 'view') {
      setActiveTab('view');
    } else if (tab === 'reports' && (isMealStubAssigner || canManageAllMealStubs || isMinistryHead)) {
      setActiveTab('reports');
    }
  }, [searchParams, isMealStubAssigner, canManageAllMealStubs]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/meals?tab=${value}`);
  };

  const { workers: allWorkers, isLoading: workersLoading, updateWorker } = useWorkers({
    enabled: isMealStubAssigner || canManageAllMealStubs || isMinistryHead,
    limit: 999999,
  });
  const { ministries, isLoading: ministriesLoading } = useMinistries();
  const { settings: globalSettings } = useSettings('mealstubs');

  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);
  const {
    mealStubs,
    isLoading: mealStubsLoading,
    createMealStub,
    deleteMealStub
  } = useMealStubs(canManageAllMealStubs 
    ? { dateFrom: thirtyDaysAgo } 
    : { workerId: user?.id, dateFrom: thirtyDaysAgo, enabled: !!user?.id }
  );

  const { mealStubs: allMealStubsInRange } = useMealStubs({ 
    dateFrom: thirtyDaysAgo, 
    enabled: isMealStubAssigner || canManageAllMealStubs 
  });

  // Live worker profile (for QR token)
  const liveWorkerProfile = useMemo(() => allWorkers.find(w => w.id === (workerProfile?.id || user?.id)), [allWorkers, workerProfile, user]);

  // QR Token
  const [localSeed, setLocalSeed] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const activeToken = localSeed ?? liveWorkerProfile?.qrToken ?? workerProfile?.id ?? '';
  const qrData = activeToken ? `MEAL_STUB:${workerProfile?.id}:${activeToken}` : '';
  const qrUrl = qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}` : '';

  const handleRegenerateQR = useCallback(async () => {
    if (!workerProfile?.id) return;
    setIsRegenerating(true);
    try {
      const newToken = generateToken();
      await updateWorker({ id: workerProfile.id, data: { qrToken: newToken } });
      setLocalSeed(newToken);
      toast({
        title: "QR Code Regenerated",
        description: "Your old QR code is now invalid.",
      });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed to regenerate QR" });
    } finally {
      setIsRegenerating(false);
    }
  }, [user, updateWorker, toast]);

  const assignerMinistries = useMemo(() => {
    if (!workerProfile || !ministries) return [];
    return ministries.filter(m => m.mealStubAssignerId === workerProfile.id || m.headId === workerProfile.id);
  }, [workerProfile, ministries]);
  const isAssigner = assignerMinistries.length > 0;

  const ministryWorkers = useMemo(() => {
    if (!allWorkers) return [];
    return allWorkers.filter(w => w.status === 'Active');
  }, [allWorkers]);

  const filteredAssignerWorkers = useMemo(() => {
    if (!ministryWorkers) return [];
    const q = assignSearch.toLowerCase();
    return ministryWorkers.filter(w =>
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
      w.employmentType?.toLowerCase().includes(q)
    );
  }, [ministryWorkers, assignSearch]);

  // ---- Logic Handlers ----

  // Issues a single stub document. Used internally.
  const issueSingleStub = useCallback(async (
    targetId: string,
    assignerId: string,
    assignerName: string,
    targetWorker: any,
    stubLabel: string = 'daily',
  ) => {
    await createMealStub({
      workerId: targetId,
      workerName: `${targetWorker.firstName} ${targetWorker.lastName}`,
      date: assignDateObj,
      status: 'Issued',
      assignedBy: assignerId,
      assignedByName: assignerName,
      stubType: stubLabel,
    });
  }, [createMealStub, assignDateObj]);

  // Main stub assignment function that validates and issues 1 or 2 stubs.
  const issueStub = useCallback(async (targetId: string, count: number = 1) => {
    const assignerId = workerProfile?.id || user?.uid || 'system';
    const assignerName = workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.displayName || user?.email || 'System Admin');

    const targetWorker = allWorkers?.find(w => w.id === targetId);
    if (!targetWorker) return;

    if (count === 0) {
      // Explicitly 0 stubs – nothing to issue.
      playSuccess(targetWorker.employmentType as 'Full-Time' | 'On-Call' | 'Volunteer' | undefined, 0); // quiet blip
      toast({ title: "No Stub Issued", description: `No stub assigned to ${targetWorker.firstName} ${targetWorker.lastName} today.` });
      return;
    }

    // 1. Daily Check – skip if already has a stub (unless Sunday 2-stub)
    const dayCount = getStubCountForDate(allMealStubsInRange as any || [], targetId, assignDateObj);
    const maxAllowedToday = isSelectedSunday ? count : 1;
    if (dayCount >= maxAllowedToday) {
      playError();
      toast({ variant: "destructive", title: "Already Assigned", description: `This worker already has ${dayCount} meal stub(s) for the selected date.` });
      return;
    }

    // 2. Volunteer Day Check
    if (targetWorker.employmentType === 'Volunteer') {
      const d = assignDateObj.getDay();
      if ((globalSettings as any)?.disabledVolunteerDays?.includes(d)) {
        playError();
        toast({ variant: "destructive", title: "Disabled", description: "Volunteer stubs are disabled for today." });
        return;
      }
    }

    // 3. Ministry Pool Check
    const targetMinistryId = targetWorker.majorMinistryId;
    const ministry = ministries?.find(m => m.id === targetMinistryId);
    if (ministry && ministry.mealStubWeeklyLimit !== null) {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = endOfWeek(new Date());
      const ministryWorkersIds = allWorkers?.filter(w => w.majorMinistryId === targetMinistryId || w.minorMinistryId === targetMinistryId).map(w => w.id) || [];
      const usedThisWeek = allMealStubsInRange?.filter(s => {
        if (!ministryWorkersIds.includes(s.workerId)) return false;
        const d = s.date instanceof Date ? s.date : new Date(s.date as any);
        return isWithinInterval(d, { start, end });
      }).length || 0;

      const limit = ministry.mealStubWeeklyLimit ?? 0;
      const remaining = limit - usedThisWeek;
      if (remaining <= 0) {
        playError();
        toast({ variant: "destructive", title: "Limit Reached", description: `Ministry ${ministry.name} has reached its weekly limit (${ministry.mealStubWeeklyLimit}).` });
        return;
      }
      if (count > remaining) {
        playError();
        toast({ variant: "destructive", title: "Pool Insufficient", description: `Only ${remaining} stub(s) left in the pool for ${ministry.name}. Requested ${count}.` });
        return;
      }
    }

    setIsAssigning(true);
    try {
      const stubsToCreate = count - dayCount; // only create what is still missing
      for (let i = 0; i < stubsToCreate; i++) {
        const label = count === 2 ? (i === 0 ? 'sunday-1' : 'sunday-2') : 'daily';
        await issueSingleStub(targetId, assignerId, assignerName, targetWorker, label);
      }
      // 🔊 Play success sound tuned to this worker's employment type
      playSuccess(targetWorker.employmentType as 'Full-Time' | 'On-Call' | 'Volunteer' | undefined, count);
      toast({ title: `Stub${count > 1 ? 's' : ''} Issued`, description: `${count} meal stub(s) issued to ${targetWorker.firstName} ${targetWorker.lastName}.` });
    } catch (e) {
      console.error(e);
      playError();
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsAssigning(false);
    }
  }, [workerProfile, user, allWorkers, ministries, allMealStubsInRange, globalSettings, isSelectedSunday, assignDateObj, issueSingleStub, toast, playSuccess, playError]);

  const handleQuickAssign = (w: any, count: number = 1) => issueStub(w.id, count);

  const handleCancelStub = async (workerId: string) => {
    setIsAssigning(true);
    try {
      const stubsToCancel = allMealStubsInRange?.filter((s: any) => {
        if (!s.date) return false;
        const d = s.date instanceof Date ? s.date : new Date(s.date as string);
        return s.workerId === workerId && format(d, 'yyyy-MM-dd') === format(assignDateObj, 'yyyy-MM-dd');
      });
      if (stubsToCancel && stubsToCancel.length > 0) {
        for (const s of stubsToCancel) {
          await deleteMealStub(s.id);
        }
        toast({ title: "Stubs Cancelled", description: `Revoked ${stubsToCancel.length} meal stub(s) for the selected date.` });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Failed to cancel stubs." });
    } finally {
      setIsAssigning(false);
    }
  };

  // ---- Ministry Pool Data ----
  const ministryPoolData = useMemo(() => {
    if (!ministries || !allWorkers || !allMealStubsInRange) return [];
    const relevantMinistries = canManageAllMealStubs
      ? ministries.filter(m => m.mealStubWeeklyLimit !== null)
      : assignerMinistries.filter(m => m.mealStubWeeklyLimit !== null);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date());

    return relevantMinistries.map(m => {
      const mWorkerIds = allWorkers
        .filter(w => w.majorMinistryId === m.id || w.minorMinistryId === m.id)
        .map(w => w.id);
      const usedThisWeek = allMealStubsInRange.filter(s => {
        if (!mWorkerIds.includes(s.workerId)) return false;
        const d = s.date instanceof Date ? s.date : new Date(s.date as any);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      }).length;
      const limit = m.mealStubWeeklyLimit!;
      return { id: m.id, name: m.name, used: usedThisWeek, limit, remaining: Math.max(0, limit - usedThisWeek) };
    });
  }, [ministries, allWorkers, allMealStubsInRange, canManageAllMealStubs, assignerMinistries]);

  // Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const handleAssignStub = useCallback(async () => {
    if (!selectedWorkerId) return;
    await issueStub(selectedWorkerId);
    setIsAssignOpen(false);
    setSelectedWorkerId('');
  }, [selectedWorkerId, issueStub]);

  const handleBatchAssign = async () => {
    if (selectedWorkerIds.length === 0) return;
    setIsAssigning(true);
    try {
      for (const id of selectedWorkerIds) {
        // Here we just call issueStub one by one which handles all checks (daily, volunteer, pool)
        await issueStub(id);
      }
      setSelectedWorkerIds([]);
      setIsBatchOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCleanupExcess = useCallback(async () => {
    if (!allMealStubsInRange) return;
    setIsAssigning(true);
    let deletedCount = 0;
    try {
      const seen = new Set<string>();
      for (const s of allMealStubsInRange) {
        if (!s.date) continue;
        const d = s.date instanceof Date ? s.date : new Date(s.date as any);
        const dayKey = `${s.workerId}-${format(d, 'yyyy-MM-dd')}`;
        if (seen.has(dayKey)) {
          if (s.status === 'Issued') {
            await deleteMealStub(s.id);
            deletedCount++;
          }
        } else {
          seen.add(dayKey);
        }
      }
      if (deletedCount > 0) {
        toast({ title: "Cleanup Success", description: `Deleted ${deletedCount} duplicate stubs.` });
      }
    } catch (e) { console.error(e); } finally { setIsAssigning(false); }
  }, [allMealStubsInRange, deleteMealStub, toast]);

  const toggleSelectAll = (workers: Worker[]) => {
    if (selectedWorkerIds.length === workers.length && workers.length > 0) setSelectedWorkerIds([]);
    else setSelectedWorkerIds(workers.map(w => w.id));
  };
  const toggleSelectWorker = (id: string) => setSelectedWorkerIds(prev => prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]);

  const isLoading = mealStubsLoading || isRoleLoading || ((isMealStubAssigner || canManageAllMealStubs || isMinistryHead) && workersLoading);

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!canViewMealStubs) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle></CardHeader></Card></AppLayout>;

  const myTodayCount = getTodayStubCount(mealStubs as any || [], workerProfile?.id || '');
  const myWeekCount = getWeeklyStubCount(mealStubs as any || [], workerProfile?.id || '');

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-headline font-bold">Mealstub Management</h1>
          <p className="text-sm text-muted-foreground">One meal stub per worker per day.</p>
        </div>
        <div className="flex items-center gap-2">
          {(isMealStubAssigner || canManageAllMealStubs || isMinistryHead) && (
            <Button variant="outline" onClick={() => setIsAssignOpen(true)}>
              <ClipboardList className="mr-2 h-4 w-4" /> Assign Stub
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">View Meal Stub</TabsTrigger>
          {(isMealStubAssigner || canManageAllMealStubs || isMinistryHead) && (
            <>
              <TabsTrigger value="assign">Assign Meal Stub</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="view" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="flex flex-col items-center justify-center p-6">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">Personal Meal Stub QR</CardTitle>
                <CardDescription className="text-xs">Scan this code at the scanner to claim your meal.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {qrUrl ? (
                  <div className="bg-white p-2 rounded-lg border">
                    <Image src={qrUrl} alt="QR" width={160} height={160} />
                  </div>
                ) : <LoaderCircle className="animate-spin" />}
                <Button variant="destructive" size="sm" onClick={handleRegenerateQR} disabled={isRegenerating}>Regenerate QR</Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Daily Summary</CardTitle></CardHeader>
                <CardContent className="flex gap-8">
                  <div>
                    <span className="text-sm text-muted-foreground">Today</span>
                    <div className="text-3xl font-bold">{myTodayCount} / 1</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <div className="text-3xl font-bold">{myWeekCount}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><h3 className="text-sm font-semibold uppercase flex items-center gap-2"><Ticket className="h-4 w-4" /> Issued Stubs</h3></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {mealStubs?.filter(s => {
                        if (!s.date) return false;
                        const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                        return isWithinInterval(d, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date()) });
                      }).sort((a, b) => {
                        const da = a.date instanceof Date ? a.date : new Date(a.date as any);
                        const db = b.date instanceof Date ? b.date : new Date(b.date as any);
                        return db.getTime() - da.getTime();
                      }).map(s => (
                        <TableRow key={s.id}>
                          <TableCell>{format(s.date instanceof Date ? s.date : new Date(s.date as any), 'EEE, MMM d')}</TableCell>
                          <TableCell>{format(s.date instanceof Date ? s.date : new Date(s.date as any), 'p')}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={s.status === 'Issued' ? 'default' : 'secondary'}>{s.status === 'Issued' ? 'Not Used' : 'Claimed'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Assign Meal Stubs</CardTitle>
                  <CardDescription>{isAssigner ? `Ministry: ${assignerMinistries.map(m => m.name).join(', ')}` : 'Full Administrative Access'}</CardDescription>
                </div>
                {canManageAllMealStubs && <Button variant="destructive" size="sm" onClick={handleCleanupExcess}><Trash2 className="mr-2 h-4 w-4" /> Cleanup</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {isSelectedSunday && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <span className="text-lg">🌅</span>
                  <div>
                    <span className="font-semibold">Sunday Mode</span> — You can assign <strong>0, 1, or 2 stubs</strong> per worker for this date. Use the buttons in the Action column.
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border">
                  <Label className="whitespace-nowrap font-medium text-sm pl-2">Assignment Date:</Label>
                  <Input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)} className="w-[140px] h-8 text-sm bg-background" />
                </div>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 h-10 w-full" placeholder="Search workers..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)} />
                </div>
              </div>

              {selectedWorkerIds.length > 0 && (
                <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                  <span>{selectedWorkerIds.length} worker(s) selected</span>
                  <Button size="sm" onClick={() => setIsBatchOpen(true)}>Batch Issue</Button>
                </div>
              )}

              <div className="rounded-lg border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead><Checkbox checked={ministryWorkers.length > 0 && selectedWorkerIds.length === ministryWorkers.length} onCheckedChange={() => toggleSelectAll(ministryWorkers as any)} /></TableHead>
                    <TableHead>Worker</TableHead><TableHead>Type</TableHead><TableHead>Today</TableHead><TableHead className="text-right">Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {ministryWorkers.filter(w => {
                      const q = assignSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
                        w.employmentType?.toLowerCase().includes(q);
                    }).map(w => {
                      const dayCount = getStubCountForDate(allMealStubsInRange as any || [], w.id, assignDateObj);
                      const hasToday = dayCount >= 1;
                      const hasTwoToday = dayCount >= 2;
                      return (
                        <TableRow key={w.id}>
                          <TableCell><Checkbox checked={selectedWorkerIds.includes(w.id)} onCheckedChange={() => toggleSelectWorker(w.id)} /></TableCell>
                          <TableCell className="font-medium">{w.firstName} {w.lastName}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{w.employmentType}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={dayCount >= 2 ? 'default' : dayCount === 1 ? 'secondary' : 'outline'} className="text-[10px]">
                              {dayCount >= 2 ? '2 Issued' : dayCount === 1 ? '1 Issued' : 'None'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isSelectedSunday ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[10px] text-muted-foreground"
                                  onClick={() => handleQuickAssign(w, 0)}
                                  title="Issue 0 stubs"
                                >
                                  0
                                </Button>
                                <Button
                                  size="sm"
                                  variant={dayCount === 1 ? 'secondary' : 'outline'}
                                  className="h-7 px-2 text-[10px]"
                                  onClick={() => handleQuickAssign(w, 1)}
                                  disabled={hasToday}
                                  title="Issue 1 stub"
                                >
                                  1
                                </Button>
                                <Button
                                  size="sm"
                                  variant={hasTwoToday ? 'secondary' : 'outline'}
                                  className="h-7 px-2 text-[10px]"
                                  onClick={() => handleQuickAssign(w, 2)}
                                  disabled={hasTwoToday}
                                  title="Issue 2 stubs"
                                >
                                  2
                                </Button>
                                {dayCount > 0 && (
                                  <Button size="sm" variant="destructive" className="h-7 px-2 text-[10px]" onClick={() => handleCancelStub(w.id)}>Cancel</Button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => handleQuickAssign(w)} disabled={hasToday}>Issue</Button>
                                {hasToday && (
                                  <Button size="sm" variant="destructive" className="h-7 px-2 text-[10px]" onClick={() => handleCancelStub(w.id)}>Cancel</Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Ministry Pool Panel */}
          {ministryPoolData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Ministry Stub Pool
                </CardTitle>
                <CardDescription>
                  Weekly mealstub allocation remaining for {isSelectedSunday ? <span className="font-semibold text-amber-600">the selected Sunday</span> : 'this week'}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ministryPoolData.map(pool => {
                  const pct = Math.min(100, Math.round((pool.used / pool.limit) * 100));
                  const isNearFull = pct >= 80;
                  const isFull = pool.remaining === 0;
                  return (
                    <div key={pool.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{pool.name}</span>
                        <span className={`text-xs font-semibold tabular-nums ${isFull ? 'text-destructive' : isNearFull ? 'text-amber-600' : 'text-muted-foreground'
                          }`}>
                          {pool.used} / {pool.limit} used &bull; {pool.remaining} left
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className={`h-2 ${isFull ? '[&>div]:bg-destructive' : isNearFull ? '[&>div]:bg-amber-500' : ''
                          }`}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Issued Today</CardTitle><CardDescription>All stubs issued for today.</CardDescription></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {allMealStubsInRange?.filter(s => {
                    if (!s.date) return false;
                    const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                    return isToday(d);
                  }).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Allocated (Weekly)</CardTitle><CardDescription>All issued stubs this week.</CardDescription></CardHeader>
              <CardContent><div className="text-3xl font-bold">{allMealStubsInRange?.filter(s => {
                const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                return d && isWithinInterval(d, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date()) });
              }).length || 0}</div></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Breakdown by Type</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead className="text-right">Issued Today</TableHead><TableHead className="text-right">Issued This Week</TableHead></TableRow></TableHeader>
                <TableBody>
                  {['Full-Time', 'On-Call', 'Volunteer'].map(t => (
                    <TableRow key={t}>
                      <TableCell className="font-medium">{t}</TableCell>
                      <TableCell className="text-right">
                        {allMealStubsInRange?.filter(s => {
                          if (!s.date) return false;
                          const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                          return isToday(d) &&
                            allWorkers?.find(wrk => wrk.id === s.workerId)?.employmentType === t;
                        }).length || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {allMealStubsInRange?.filter(s => {
                          const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                          if (!d || !isWithinInterval(d, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date()) })) return false;
                          return allWorkers?.find(wrk => wrk.id === s.workerId)?.employmentType === t;
                        }).length || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Single Assign Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Meal Stub</DialogTitle><DialogDescription>Issue one meal stub to a worker for today.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Worker</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                value={selectedWorkerId}
                onChange={e => setSelectedWorkerId(e.target.value)}
              >
                <option value="">Select worker...</option>
                {ministryWorkers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.firstName} {w.lastName} {getTodayStubCount(allMealStubsInRange as any || [], w.id) >= 1 ? '(already issued today)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button><Button onClick={handleAssignStub} disabled={!selectedWorkerId || isAssigning}>Issue</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Dialog */}
      <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Batch Issue</DialogTitle><DialogDescription>Issue 1 stub per worker for today. Workers who already have a stub today or those restricted will be skipped or blocked.</DialogDescription></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{selectedWorkerIds.length} worker(s) selected.</p>
          <DialogFooter><Button onClick={handleBatchAssign} disabled={isAssigning}>Issue to {selectedWorkerIds.length}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export default function MealsPage() {
  return <Suspense fallback={<div className="p-10 text-center">Loading...</div>}><MealsPageContent /></Suspense>;
}
