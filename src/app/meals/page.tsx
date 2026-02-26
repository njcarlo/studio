"use client";

import React, { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import Image from "next/image";
import { collection, serverTimestamp, doc, query, where, updateDoc, addDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, QrCode, LoaderCircle, Scan, RefreshCw, ShieldAlert, ClipboardList, ShieldCheck, Search, CheckCircle2, Trash2 } from "lucide-react";
import type { MealStub, Worker, Ministry, MealStubSettings } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { format, isToday, subDays, startOfWeek, endOfWeek, isSunday, isWithinInterval, addDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { getWeeklyWeekdayCount, getSundayCount, getTodayWeekdayCount } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Ticket } from "lucide-react";

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ------------------------------------------------------------
function MealsPageContent() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { canViewMealStubs, canManageAllMealStubs, isMealStubAssigner, workerProfile, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("view");
  const [assignSearch, setAssignSearch] = useState("");

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'assign' && (isMealStubAssigner || canManageAllMealStubs)) {
      setActiveTab('assign');
    } else if (tab === 'view') {
      setActiveTab('view');
    } else if (tab === 'reports' && (isMealStubAssigner || canManageAllMealStubs)) {
      setActiveTab('reports');
    }
  }, [searchParams, isMealStubAssigner, canManageAllMealStubs]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/meals?tab=${value}`);
  };

  // Live worker profile with qrToken
  const workerDocRef = useMemoFirebase(() => user ? doc(firestore, 'workers', user.uid) : null, [firestore, user]);
  const { data: liveWorkerProfile } = useDoc<Worker>(workerDocRef);

  // QR Token
  const [localSeed, setLocalSeed] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const activeToken = localSeed ?? liveWorkerProfile?.qrToken ?? user?.uid ?? '';
  const qrData = activeToken ? `MEAL_STUB:${user?.uid}:${activeToken}` : '';
  const qrUrl = qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}` : '';

  const handleRegenerateQR = useCallback(async () => {
    if (!user) return;
    setIsRegenerating(true);
    try {
      const newToken = generateToken();
      await updateDoc(doc(firestore, 'workers', user.uid), { qrToken: newToken });
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
  }, [firestore, user, toast]);

  // ---- Meal stubs data ----
  const mealStubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    if (canManageAllMealStubs) {
      const thirtyDaysAgo = subDays(new Date(), 30);
      return query(collection(firestore, "mealstubs"), where('date', '>=', thirtyDaysAgo));
    }
    return query(collection(firestore, "mealstubs"), where('workerId', '==', user.uid));
  }, [firestore, user, canManageAllMealStubs]);
  const { data: mealStubs, isLoading: mealStubsLoading } = useCollection<MealStub>(mealStubsQuery);

  // ---- All workers (for admin + assigner) ----
  const workersRef = useMemoFirebase(() => {
    if (!user || (!canManageAllMealStubs && !workerProfile)) return null;
    return collection(firestore, "workers");
  }, [firestore, user, canManageAllMealStubs, workerProfile]);
  const { data: allWorkers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

  // ---- All ministries ----
  const ministriesRef = useMemoFirebase(() => user ? collection(firestore, "ministries") : null, [firestore, user]);
  const { data: ministries } = useCollection<Ministry>(ministriesRef);

  // ---- Global Settings ----
  const settingsRef = useMemoFirebase(() => doc(firestore, "settings", "mealstubs"), [firestore]);
  const { data: globalSettings } = useDoc<MealStubSettings>(settingsRef);

  // ---- All meal stubs for range ----
  const allMealStubsRef = useMemoFirebase(() => {
    if (!user) return null;
    const thirtyDaysAgo = subDays(new Date(), 30);
    return query(collection(firestore, "mealstubs"), where('date', '>=', thirtyDaysAgo));
  }, [firestore, user]);
  const { data: allMealStubs } = useCollection<MealStub>(allMealStubsRef);

  const assignerMinistries = useMemo(() => {
    if (!workerProfile || !ministries) return [];
    return ministries.filter(m => m.mealStubAssignerId === workerProfile.id);
  }, [workerProfile, ministries]);
  const isAssigner = assignerMinistries.length > 0;

  const ministryWorkers = useMemo(() => {
    if (canManageAllMealStubs && allWorkers) {
      return allWorkers.filter(w => w.status === 'Active');
    }
    if (!isAssigner || !allWorkers) return [];
    const ministryIds = assignerMinistries.map(m => m.id);
    return allWorkers.filter(w =>
      (ministryIds.includes(w.primaryMinistryId) || ministryIds.includes(w.secondaryMinistryId)) &&
      w.status === 'Active'
    );
  }, [isAssigner, canManageAllMealStubs, allWorkers, assignerMinistries]);

  const filteredAssignerWorkers = useMemo(() => {
    if (!ministryWorkers) return [];
    const q = assignSearch.toLowerCase();
    return ministryWorkers.filter(w =>
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
      w.employmentType?.toLowerCase().includes(q)
    );
  }, [ministryWorkers, assignSearch]);

  // ---- Logic Handlers ----

  const issueMultipleStubs = useCallback(async (targetId: string, type: 'weekday' | 'sunday', count: number) => {
    const assignerId = workerProfile?.id || user?.uid || 'system';
    const assignerName = workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.displayName || user?.email || 'System Admin');

    const targetWorker = ministryWorkers.find(w => w.id === targetId);
    if (!targetWorker) return;

    // Rules: FT/On-call Weekday (Mon-Sat) is FREE. Volunteer Weekday & Sunday are DEDUCTIBLE.
    const isVolunteer = targetWorker.employmentType === 'Volunteer';
    const isDeductible = type === 'sunday' || isVolunteer;

    if (isDeductible) {
      const ministry = ministries?.find(m => m.id === targetWorker.primaryMinistryId);
      if (!ministry) {
        toast({ variant: "destructive", title: "Config Error" });
        return;
      }
      const mPool = ministry.mealStubTotalLimit || 0;
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = endOfWeek(new Date());

      const currentSpentCount = (allMealStubs || []).filter(s => {
        if (!s.date) return false;
        const d = new Date((s.date as any).seconds * 1000);
        if (!isWithinInterval(d, { start, end })) return false;
        const stubWorker = allWorkers?.find(wrk => wrk.id === s.workerId);
        if (stubWorker?.primaryMinistryId !== targetWorker.primaryMinistryId) return false;
        return s.stubType === 'sunday' || stubWorker?.employmentType === 'Volunteer';
      }).length;

      if (currentSpentCount + count > mPool) {
        toast({ variant: "destructive", title: "Pool Exceeded", description: `Limit: ${mPool}. Spent: ${currentSpentCount}.` });
        return;
      }
    }

    setIsAssigning(true);
    try {
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(addDoc(collection(firestore, "mealstubs"), {
          workerId: targetId,
          workerName: `${targetWorker.firstName} ${targetWorker.lastName}`,
          date: serverTimestamp(),
          status: 'Issued',
          assignedBy: assignerId,
          assignedByName: assignerName,
          stubType: type,
        }));
      }
      await Promise.all(promises);
      toast({ title: "Stubs Issued", description: `Assigned ${count} ${type} stub(s).` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsAssigning(false);
    }
  }, [workerProfile, user, ministryWorkers, firestore, ministries, allMealStubs, allWorkers, toast]);

  const handleQuickAssign = (w: Worker, type: 'weekday' | 'sunday', count: number) => {
    const isVolunteer = w.employmentType === 'Volunteer';
    const allStubs = allMealStubs || [];

    if (type === 'weekday') {
      if (isVolunteer) {
        const d = new Date().getDay();
        if (globalSettings?.disabledVolunteerDays?.includes(d)) {
          toast({ variant: "destructive", title: "Disabled", description: "Volunteer stubs disabled for today." });
          return;
        }
        if (getTodayWeekdayCount(allStubs, w.id) >= 1) {
          toast({ variant: "destructive", title: "Already Assigned" });
          return;
        }
        issueMultipleStubs(w.id, 'weekday', 1);
        return;
      } else {
        const remaining = 5 - getWeeklyWeekdayCount(allStubs, w.id);
        if (remaining <= 0) {
          toast({ variant: "destructive", title: "Limit Reached" });
          return;
        }
        issueMultipleStubs(w.id, 'weekday', Math.min(count, remaining));
        return;
      }
    }
    const remSun = 2 - getSundayCount(allStubs, w.id);
    if (remSun <= 0) {
      toast({ variant: "destructive", title: "Limit Reached" });
      return;
    }
    issueMultipleStubs(w.id, 'sunday', Math.min(count, remSun));
  };

  // EFFECT: Automate 5 weekday stubs for FT & On-Call (Mon-Sat, non-deductible)
  useEffect(() => {
    if (!allMealStubs || !ministryWorkers || !user || (!isMealStubAssigner && !canManageAllMealStubs)) return;

    const autoAssign = async () => {
      const eligibleWorkers = ministryWorkers.filter(w => w.employmentType === 'Full-Time' || w.employmentType === 'On-Call');
      const assignerId = workerProfile?.id || user?.uid || 'system';
      const assignerName = workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.displayName || user?.email || 'System Admin');

      for (const w of eligibleWorkers) {
        const currentCount = getWeeklyWeekdayCount(allMealStubs, w.id);
        const toAssign = Math.max(0, 5 - currentCount);

        if (toAssign > 0) {
          for (let i = 0; i < toAssign; i++) {
            await addDoc(collection(firestore, "mealstubs"), {
              workerId: w.id,
              workerName: `${w.firstName} ${w.lastName}`,
              date: serverTimestamp(),
              status: 'Issued',
              assignedBy: assignerId,
              assignedByName: assignerName,
              stubType: 'weekday',
            });
          }
        }
      }
    };
    autoAssign();
  }, [allMealStubs, ministryWorkers, user, isMealStubAssigner, canManageAllMealStubs, firestore, workerProfile]);

  // Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [stubType, setStubType] = useState<'weekday' | 'sunday'>('sunday');
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchType, setBatchType] = useState<'weekday' | 'sunday'>('sunday');
  const [batchCount, setBatchCount] = useState(1);

  const handleAssignStub = useCallback(async () => {
    if (!selectedWorkerId) return;
    await issueMultipleStubs(selectedWorkerId, stubType, 1);
    setIsAssignOpen(false);
    setSelectedWorkerId('');
  }, [selectedWorkerId, stubType, issueMultipleStubs]);

  const handleBatchAssign = async () => {
    if (selectedWorkerIds.length === 0) return;
    setIsAssigning(true);
    try {
      for (const id of selectedWorkerIds) {
        await issueMultipleStubs(id, batchType, batchCount);
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
    if (!allMealStubs || !allWorkers) return;
    setIsAssigning(true);
    let deletedCount = 0;
    const batch = writeBatch(firestore);
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date());

    try {
      allWorkers.forEach(w => {
        const weeklyStubs = allMealStubs.filter(s => {
          if (s.workerId !== w.id || !s.date) return false;
          const d = new Date((s.date as any).seconds * 1000);
          return isWithinInterval(d, { start, end });
        });
        const weekdays = weeklyStubs.filter(s => s.stubType === 'weekday').sort((a, b) => (b.date as any).seconds - (a.date as any).seconds);
        const sundays = weeklyStubs.filter(s => s.stubType === 'sunday').sort((a, b) => (b.date as any).seconds - (a.date as any).seconds);

        if (weekdays.length > 5) {
          weekdays.slice(5).forEach(s => { if (s.status === 'Issued') { batch.delete(doc(firestore, 'mealstubs', s.id)); deletedCount++; } });
        }
        if (sundays.length > 2) {
          sundays.slice(2).forEach(s => { if (s.status === 'Issued') { batch.delete(doc(firestore, 'mealstubs', s.id)); deletedCount++; } });
        }
      });
      if (deletedCount > 0) { await batch.commit(); toast({ title: "Cleanup Success", description: `Deleted ${deletedCount} stubs.` }); }
    } catch (e) { console.error(e); } finally { setIsAssigning(false); }
  }, [allMealStubs, allWorkers, firestore, toast]);

  const toggleSelectAll = (workers: Worker[]) => {
    if (selectedWorkerIds.length === workers.length && workers.length > 0) setSelectedWorkerIds([]);
    else setSelectedWorkerIds(workers.map(w => w.id));
  };
  const toggleSelectWorker = (id: string) => setSelectedWorkerIds(prev => prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]);

  const claimedStubs = mealStubs?.filter(s => s.status === 'Claimed') || [];
  const todayScans = claimedStubs.filter(s => s.date && isToday(new Date((s.date as any).seconds * 1000))).length;
  const weekScans = claimedStubs.filter(s => {
    if (!s.date) return false;
    return new Date((s.date as any).seconds * 1000) > subDays(new Date(), 7);
  }).length;

  const todayIsSunday = isSunday(new Date());
  const isLoading = mealStubsLoading || workersLoading || isRoleLoading;

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!canViewMealStubs) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle></CardHeader></Card></AppLayout>;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-headline font-bold">Mealstub Management</h1>
          <p className="text-sm text-muted-foreground">Manage allocations (Mon-Sat defined as weekdays).</p>
        </div>
        <div className="flex items-center gap-2">
          {(isMealStubAssigner || canManageAllMealStubs) && (
            <Button variant="outline" onClick={() => setIsAssignOpen(true)}>
              <ClipboardList className="mr-2 h-4 w-4" /> Assign Stub
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="view">View Meal Stub</TabsTrigger>
          {(isMealStubAssigner || canManageAllMealStubs) && (
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
                <CardHeader><CardTitle className="text-base">Current Week Summary</CardTitle></CardHeader>
                <CardContent className="flex gap-8">
                  <div>
                    <span className="text-sm text-muted-foreground">Weekday (Mon-Sat)</span>
                    <div className="text-3xl font-bold">{getWeeklyWeekdayCount(mealStubs || [], user?.uid || '')} / 5</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Sunday</span>
                    <div className="text-3xl font-bold">{getSundayCount(mealStubs || [], user?.uid || '')} / 2</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><h3 className="text-sm font-semibold uppercase flex items-center gap-2"><Ticket className="h-4 w-4" /> Issued Stubs</h3></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Time</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {mealStubs?.filter(s => {
                        if (!s.date) return false;
                        const d = new Date((s.date as any).seconds * 1000);
                        return isWithinInterval(d, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date()) });
                      }).sort((a, b) => (b.date as any).seconds - (a.date as any).seconds).map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="capitalize">{s.stubType}</TableCell>
                          <TableCell>{format(new Date((s.date as any).seconds * 1000), 'MMM d, p')}</TableCell>
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
              <div className="relative mb-6"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search workers..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)} /></div>

              {selectedWorkerIds.length > 0 && (
                <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                  <span>{selectedWorkerIds.length} worker(s) selected</span>
                  <Button size="sm" onClick={() => setIsBatchOpen(true)}>Batch Issue</Button>
                </div>
              )}

              <div className="rounded-lg border">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead><Checkbox checked={filteredAssignerWorkers.length > 0 && selectedWorkerIds.length === filteredAssignerWorkers.length} onCheckedChange={() => toggleSelectAll(filteredAssignerWorkers)} /></TableHead>
                    <TableHead>Worker</TableHead><TableHead>Type</TableHead><TableHead>Weekly Usage</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredAssignerWorkers.map(w => {
                      const wd = getWeeklyWeekdayCount(allMealStubs || [], w.id);
                      const sun = getSundayCount(allMealStubs || [], w.id);
                      const isVol = w.employmentType === 'Volunteer';
                      return (
                        <TableRow key={w.id}>
                          <TableCell><Checkbox checked={selectedWorkerIds.includes(w.id)} onCheckedChange={() => toggleSelectWorker(w.id)} /></TableCell>
                          <TableCell className="font-medium">{w.firstName} {w.lastName}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{w.employmentType}</Badge></TableCell>
                          <TableCell>
                            <div className="text-[10px] space-x-2">
                              <span>WD: {wd}/5</span>
                              <span>Sun: {sun}/2</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => handleQuickAssign(w, 'weekday', 1)} disabled={wd >= 5}>W1</Button>
                            <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px]" onClick={() => handleQuickAssign(w, 'sunday', 1)} disabled={sun >= 2}>S1</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">FT / On-Call Weekday (Mon-Sat)</CardTitle><CardDescription>Non-deductible usage this week.</CardDescription></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {allMealStubs?.filter(s => {
                    if (s.stubType !== 'weekday' || !s.date) return false;
                    const d = new Date((s.date as any).seconds * 1000);
                    const sw = startOfWeek(new Date(), { weekStartsOn: 1 });
                    const ew = endOfWeek(new Date());
                    if (!isWithinInterval(d, { start: sw, end: ew })) return false;
                    const w = allWorkers?.find(worker => worker.id === s.workerId);
                    return w?.employmentType === 'Full-Time' || w?.employmentType === 'On-Call';
                  }).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Allocated (Weekly)</CardTitle><CardDescription>All issued stubs this week.</CardDescription></CardHeader>
              <CardContent><div className="text-3xl font-bold">{allMealStubs?.filter(s => {
                const d = s.date && new Date((s.date as any).seconds * 1000);
                return d && isWithinInterval(d, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date()) });
              }).length || 0}</div></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Breakdown</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Deductible?</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {['Full-Time', 'On-Call', 'Volunteer'].map(t => (
                    <TableRow key={t}>
                      <TableCell className="font-medium">{t}</TableCell>
                      <TableCell>{t === 'Volunteer' ? 'Yes (All)' : 'Yes (Sun) / No (WD)'}</TableCell>
                      <TableCell className="text-right">
                        {allMealStubs?.filter(s => {
                          const d = s.date && new Date((s.date as any).seconds * 1000);
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

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Meal Stub</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Worker</Label><Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}><SelectTrigger><SelectValue placeholder="Select worker..." /></SelectTrigger><SelectContent>{ministryWorkers.map(w => <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Type</Label><Select value={stubType} onValueChange={(v: any) => setStubType(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekday">Weekday (Mon-Sat)</SelectItem><SelectItem value="sunday">Sunday</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button><Button onClick={handleAssignStub} disabled={!selectedWorkerId || isAssigning}>Issue</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Batch Issue</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Type</Label><Select value={batchType} onValueChange={(v: any) => setBatchType(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekday">Weekday</SelectItem><SelectItem value="sunday">Sunday</SelectItem></SelectContent></Select></div>
            <div><Label>Count</Label><Select value={batchCount.toString()} onValueChange={v => setBatchCount(parseInt(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button onClick={handleBatchAssign}>Issue to {selectedWorkerIds.length}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export default function MealsPage() {
  return <Suspense fallback={<div className="p-10 text-center">Loading...</div>}><MealsPageContent /></Suspense>;
}
