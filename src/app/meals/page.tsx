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
import type { MealStub, Worker, Ministry } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { format, isToday, subDays, startOfWeek, endOfWeek, isSunday, isWithinInterval, addDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { getWeeklyWeekdayCount, getSundayCount } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Ticket } from "lucide-react";

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Helpers are now imported from @/lib/utils

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
    }
  }, [searchParams, isMealStubAssigner, canManageAllMealStubs]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/meals?tab=${value}`);
  };

  // Live worker profile with qrToken
  const workerDocRef = useMemoFirebase(() => user ? doc(firestore, 'workers', user.uid) : null, [firestore, user]);
  const { data: liveWorkerProfile } = useDoc<Worker>(workerDocRef);

  // QR Token — use the one persisted in Firestore; fallback to seed while loading
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
        description: "Your old QR code is now invalid. Please use the new one.",
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

  // ---- All ministries (for assigner check) ----
  const ministriesRef = useMemoFirebase(() => user ? collection(firestore, "ministries") : null, [firestore, user]);
  const { data: ministries } = useCollection<Ministry>(ministriesRef);

  // ---- All meal stubs for assigner (all stubs in their ministry workers) ----
  const allMealStubsRef = useMemoFirebase(() => {
    if (!user) return null;
    const thirtyDaysAgo = subDays(new Date(), 30);
    return query(collection(firestore, "mealstubs"), where('date', '>=', thirtyDaysAgo));
  }, [firestore, user]);
  const { data: allMealStubs } = useCollection<MealStub>(allMealStubsRef);

  // ---- Is this user a Meal Stub Assigner for any ministry? ----
  const assignerMinistries = useMemo(() => {
    if (!workerProfile || !ministries) return [];
    return ministries.filter(m => m.mealStubAssignerId === workerProfile.id);
  }, [workerProfile, ministries]);
  // isAssigner is now isMealStubAssigner from context, but we use it locally for ministry calculation
  const isAssigner = assignerMinistries.length > 0;

  // Workers belonging to the assigner's ministry (primary or secondary)
  const ministryWorkers = useMemo(() => {
    // If Super Admin, they can assign to any active worker
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
    const query = assignSearch.toLowerCase();
    return ministryWorkers.filter(w =>
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(query) ||
      w.employmentType?.toLowerCase().includes(query)
    );
  }, [ministryWorkers, assignSearch]);

  const isLoading = mealStubsLoading || workersLoading || isRoleLoading;

  // ---- Assign modal state ----
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [stubType, setStubType] = useState<'weekday' | 'sunday'>('weekday');
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchType, setBatchType] = useState<'weekday' | 'sunday'>('weekday');
  const [batchCount, setBatchCount] = useState(1);

  const issueMultipleStubs = useCallback(async (targetId: string, type: 'weekday' | 'sunday', count: number) => {
    // Robustness: if workerProfile is missing (e.g. system admin), use fallback info
    const assignerId = workerProfile?.id || user?.uid || 'system';
    const assignerName = workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.displayName || user?.email || 'System Admin');

    const targetWorker = ministryWorkers.find(w => w.id === targetId);
    if (!targetWorker) {
      toast({ variant: "destructive", title: "Worker not found", description: "Target worker could not be found in active lists." });
      return;
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
      toast({ title: "Stubs Issued", description: `Successfully issued ${count} ${type} stub(s) to ${targetWorker.firstName}.` });
    } catch (e) {
      console.error("Assignment Error:", e);
      toast({ variant: "destructive", title: "Failed to assign stub(s)", description: "check console for details" });
    } finally {
      setIsAssigning(false);
    }
  }, [workerProfile, user, ministryWorkers, firestore, toast]);

  const handleQuickAssign = (w: Worker, type: 'weekday' | 'sunday', count: number) => {
    const allStubs = allMealStubs || [];
    const current = type === 'weekday' ? getWeeklyWeekdayCount(allStubs, w.id) : getSundayCount(allStubs, w.id);

    const isAutomated = w.employmentType === 'Full-Time' || w.employmentType === 'On-Call';
    const ministry = ministries?.find(m => m.id === w.primaryMinistryId || m.id === w.secondaryMinistryId);
    const limit = type === 'weekday' ? (isAutomated ? 5 : (ministry?.mealStubWeekdayLimit || 5)) : (ministry?.mealStubSundayLimit || 2);

    const remaining = limit - current;
    if (remaining <= 0) {
      toast({ variant: "destructive", title: "Limit Reached", description: `${w.firstName} already has maximum ${type} stubs.` });
      return;
    }

    const toIssue = Math.min(count, remaining);
    if (toIssue <= 0) return; // Should not happen due to previous check but good to have
    issueMultipleStubs(w.id, type, toIssue);
  };

  const handleBatchAssign = async () => {
    if (!workerProfile || selectedWorkerIds.length === 0) return;
    setIsAssigning(true);
    let totalIssued = 0;
    let skipped = 0;

    try {
      const promises = selectedWorkerIds.map(async (id) => {
        const w = ministryWorkers.find(worker => worker.id === id);
        if (!w) return;

        const allStubs = allMealStubs || [];
        const current = batchType === 'weekday' ? getWeeklyWeekdayCount(allStubs, id) : getSundayCount(allStubs, id);

        const ministry = ministries?.find(m => m.id === w.primaryMinistryId || m.id === w.secondaryMinistryId);
        const limit = batchType === 'weekday' ? (ministry?.mealStubWeekdayLimit || 5) : (ministry?.mealStubSundayLimit || 2);

        const remaining = limit - current;
        if (remaining <= 0) {
          skipped++;
          return;
        }

        const toIssue = Math.min(batchCount, remaining);

        for (let i = 0; i < toIssue; i++) {
          await addDocumentNonBlocking(collection(firestore, "mealstubs"), {
            workerId: id,
            workerName: `${w.firstName} ${w.lastName}`,
            date: serverTimestamp(),
            status: 'Issued',
            assignedBy: workerProfile.id,
            assignedByName: `${workerProfile.firstName} ${workerProfile.lastName}`,
            stubType: batchType,
          });
          totalIssued++;
        }
      });

      await Promise.all(promises);
      toast({
        title: "Batch Stubs Issued",
        description: `Successfully issued ${totalIssued} total stubs. ${skipped > 0 ? `${skipped} workers were skipped (limit reached).` : ''}`
      });
      setSelectedWorkerIds([]);
      setIsBatchOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Batch Assignment Failed", description: "Could not issue stubs." });
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
        const isAutomated = w.employmentType === 'Full-Time' || w.employmentType === 'On-Call';
        const ministry = ministries?.find(m => m.id === w.primaryMinistryId || m.id === w.secondaryMinistryId);
        const wLimit = isAutomated ? 5 : (ministry?.mealStubWeekdayLimit || 5);
        const sLimit = ministry?.mealStubSundayLimit || 2;

        const workerStubs = allMealStubs.filter(s => s.workerId === w.id && s.date);
        const weeklyStubs = workerStubs.filter(s => {
          const d = (s.date as any).seconds ? new Date((s.date as any).seconds * 1000) : new Date(s.date as any);
          return isWithinInterval(d, { start, end });
        });

        // Split and sort by date (newest first)
        const weekdays = weeklyStubs.filter(s => {
          const d = (s.date as any).seconds ? new Date((s.date as any).seconds * 1000) : new Date(s.date as any);
          return !isSunday(d);
        }).sort((a, b) => (b.date as any).seconds - (a.date as any).seconds);

        const sundays = weeklyStubs.filter(s => {
          const d = (s.date as any).seconds ? new Date((s.date as any).seconds * 1000) : new Date(s.date as any);
          return isSunday(d);
        }).sort((a, b) => (b.date as any).seconds - (a.date as any).seconds);

        // Mark newest "Issued" stubs for deletion if over limit
        if (weekdays.length > wLimit) {
          let over = weekdays.length - wLimit;
          weekdays.forEach(s => {
            if (over > 0 && s.status === 'Issued') {
              batch.delete(doc(firestore, 'mealstubs', s.id));
              over--;
              deletedCount++;
            }
          });
        }

        if (sundays.length > sLimit) {
          let over = sundays.length - sLimit;
          sundays.forEach(s => {
            if (over > 0 && s.status === 'Issued') {
              batch.delete(doc(firestore, 'mealstubs', s.id));
              over--;
              deletedCount++;
            }
          });
        }
      });

      if (deletedCount > 0) {
        await batch.commit();
        toast({ title: "Cleanup Success", description: `Deleted ${deletedCount} excess unused meal stubs.` });
      } else {
        toast({ title: "No Excess Found", description: "No unused stubs exceed current limits." });
      }
    } catch (e) {
      console.error("Cleanup Error:", e);
      toast({ variant: "destructive", title: "Cleanup Failed", description: "Check console for details." });
    } finally {
      setIsAssigning(false);
    }
  }, [allMealStubs, allWorkers, ministries, firestore, toast]);

  const toggleSelectAll = (currentWorkers: Worker[]) => {
    if (selectedWorkerIds.length === currentWorkers.length && currentWorkers.length > 0) {
      setSelectedWorkerIds([]);
    } else {
      setSelectedWorkerIds(currentWorkers.map(w => w.id));
    }
  };

  const toggleSelectWorker = (id: string) => {
    setSelectedWorkerIds(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  const today = new Date();
  const todayIsSunday = isSunday(today);

  const handleAssignStub = useCallback(async () => {
    if (!selectedWorkerId) return;

    // Robustness fallback
    const assignerId = workerProfile?.id || user?.uid || 'system';
    const assignerName = workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.displayName || user?.email || 'System Admin');

    const targetWorker = ministryWorkers.find(w => w.id === selectedWorkerId);
    if (!targetWorker) {
      toast({ variant: "destructive", title: "Target Error", description: "Selected worker is no longer in the list." });
      return;
    }

    const allStubs = allMealStubs || [];

    if (stubType === 'weekday') {
      const count = getWeeklyWeekdayCount(allStubs, selectedWorkerId);
      const isAutomated = targetWorker.employmentType === 'Full-Time' || targetWorker.employmentType === 'On-Call';
      const ministry = ministries?.find(m => m.id === targetWorker.primaryMinistryId || m.id === targetWorker.secondaryMinistryId);
      const limit = isAutomated ? 5 : (ministry?.mealStubWeekdayLimit || 5);
      if (count >= limit) {
        toast({ variant: "destructive", title: "Limit Reached", description: `${targetWorker.firstName} has already used all ${limit} weekday meal stubs this week.` });
        return;
      }
    } else {
      const count = getSundayCount(allStubs, selectedWorkerId);
      const ministry = ministries?.find(m => m.id === targetWorker.primaryMinistryId || m.id === targetWorker.secondaryMinistryId);
      const limit = ministry?.mealStubSundayLimit || 2;
      if (count >= limit) {
        toast({ variant: "destructive", title: "Limit Reached", description: `${targetWorker.firstName} has already used all ${limit} Sunday meal stubs this week.` });
        return;
      }
    }

    setIsAssigning(true);
    try {
      await addDoc(collection(firestore, "mealstubs"), {
        workerId: selectedWorkerId,
        workerName: `${targetWorker.firstName} ${targetWorker.lastName}`,
        date: serverTimestamp(),
        status: 'Issued',
        assignedBy: assignerId,
        assignedByName: assignerName,
        stubType,
      });
      toast({ title: "Meal Stub Assigned", description: `Stub issued to ${targetWorker.firstName} ${targetWorker.lastName}.` });
      setIsAssignOpen(false);
      setSelectedWorkerId('');
    } catch (e) {
      console.error("Single Assignment Error:", e);
      toast({ variant: "destructive", title: "Failed to assign stub" });
    } finally {
      setIsAssigning(false);
    }
  }, [selectedWorkerId, stubType, ministryWorkers, allMealStubs, workerProfile, user, ministries, firestore, toast]);



  const claimedStubs = mealStubs?.filter(s => s.status === 'Claimed') || [];
  const todayScans = claimedStubs.filter(s => s.date && isToday(new Date((s.date as any).seconds * 1000))).length;
  const weekScans = claimedStubs.filter(s => {
    if (!s.date) return false;
    return new Date((s.date as any).seconds * 1000) > subDays(new Date(), 7);
  }).length;

  // selected worker weekly stubs for display in dialog
  const selectedWorkerWeekdayCount = selectedWorkerId ? getWeeklyWeekdayCount(allMealStubs || [], selectedWorkerId) : 0;
  const selectedWorkerSundayCount = selectedWorkerId ? getSundayCount(allMealStubs || [], selectedWorkerId) : 0;

  const selectedWorkerWeekdayLimit = useMemo(() => {
    if (!selectedWorkerId || !ministryWorkers || !ministries) return 5;
    const w = ministryWorkers.find(worker => worker.id === selectedWorkerId);
    if (!w) return 5;
    if (w.employmentType === 'Full-Time' || w.employmentType === 'On-Call') return 5;
    const ministry = ministries.find(m => m.id === w.primaryMinistryId || m.id === w.secondaryMinistryId);
    return ministry?.mealStubWeekdayLimit || 5;
  }, [selectedWorkerId, ministryWorkers, ministries]);

  const selectedWorkerSundayLimit = useMemo(() => {
    if (!selectedWorkerId || !ministryWorkers || !ministries) return 2;
    const w = ministryWorkers.find(worker => worker.id === selectedWorkerId);
    if (!w) return 2;
    const ministry = ministries.find(m => m.id === w.primaryMinistryId || m.id === w.secondaryMinistryId);
    return ministry?.mealStubSundayLimit || 2;
  }, [selectedWorkerId, ministryWorkers, ministries]);

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="mx-auto h-8 w-8 animate-spin" /></div></AppLayout>;
  }
  if (!canViewMealStubs) {
    return (
      <AppLayout>
        <Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-headline font-bold">Mealstub Management</h1>
          <p className="text-sm text-muted-foreground">Manage and view meal allocations.</p>
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
            <TabsTrigger value="assign">Assign Meal Stub</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="view" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* QR Code Card */}
            <Card className="flex flex-col items-center justify-center p-6 lg:col-span-1">
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-headline text-lg">Personal Meal Stub QR</CardTitle>
                <CardDescription className="text-xs">
                  Scan this QR code at the scanner to claim your meal.
                  Once a meal stub is issued to you, this code will be active.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-4">
                {qrUrl ? (
                  <>
                    <div className="bg-white p-2 rounded-lg border">
                      <Image src={qrUrl} alt="Meal Stub QR Code" width={160} height={160} />
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRegenerateQR}
                        disabled={isRegenerating}
                        className="w-full"
                      >
                        {isRegenerating
                          ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                          : <ShieldAlert className="h-4 w-4 mr-2" />
                        }
                        Regenerate QR Code
                      </Button>
                      <p className="text-[10px] text-center text-muted-foreground">
                        ⚠️ This will invalidate your current QR code
                      </p>
                    </div>
                  </>
                ) : (
                  <LoaderCircle className="h-8 w-8 animate-spin" />
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Week Summary</CardTitle>
                  <CardDescription>Your meal stub usage for this week.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Weekday Stubs</span>
                    <span className="text-3xl font-bold">{getWeeklyWeekdayCount(mealStubs || [], user?.uid || '')} / 5</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Sunday Stubs</span>
                    <span className="text-3xl font-bold">{getSundayCount(mealStubs || [], user?.uid || '')} / 2</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Ticket className="h-4 w-4" /> Today's Stubs
                  </h3>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Weekday Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-blue-600">Weekday (Mon-Sat)</h4>
                      <Badge variant="outline" className="text-[9px] h-4">Pool: 5/week</Badge>
                    </div>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="h-8">
                            <TableHead className="text-[10px] h-8">Time</TableHead>
                            <TableHead className="text-[10px] h-8 text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mealStubs?.filter(s => s.stubType === 'weekday' && s.date && isToday(new Date((s.date as any).seconds * 1000))).length === 0 ? (
                            <TableRow><TableCell colSpan={2} className="text-center text-[10px] text-muted-foreground py-4 italic">No weekday stubs today.</TableCell></TableRow>
                          ) : (
                            mealStubs?.filter(s => s.stubType === 'weekday' && s.date && isToday(new Date((s.date as any).seconds * 1000))).map((stub) => (
                              <TableRow key={stub.id} className="h-9">
                                <TableCell className="text-[11px] font-medium">{stub.date ? format(new Date((stub.date as any).seconds * 1000), 'p') : ''}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-100 text-blue-800 text-[9px] h-4 px-1.5' : 'bg-green-100 text-green-800 text-[9px] h-4 px-1.5'}>
                                    {stub.status === 'Issued' ? 'Not Used' : 'Claimed'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Sunday Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-green-600">Sunday</h4>
                      <Badge variant="outline" className="text-[9px] h-4">Pool: 2/week</Badge>
                    </div>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="h-8">
                            <TableHead className="text-[10px] h-8">Time</TableHead>
                            <TableHead className="text-[10px] h-8 text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mealStubs?.filter(s => s.stubType === 'sunday' && s.date && isToday(new Date((s.date as any).seconds * 1000))).length === 0 ? (
                            <TableRow><TableCell colSpan={2} className="text-center text-[10px] text-muted-foreground py-4 italic">No Sunday stubs today.</TableCell></TableRow>
                          ) : (
                            mealStubs?.filter(s => s.stubType === 'sunday' && s.date && isToday(new Date((s.date as any).seconds * 1000))).map((stub) => (
                              <TableRow key={stub.id} className="h-9">
                                <TableCell className="text-[11px] font-medium">{stub.date ? format(new Date((stub.date as any).seconds * 1000), 'p') : ''}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-200 text-blue-900 text-[9px] h-4 px-1.5' : 'bg-green-100 text-green-800 text-[9px] h-4 px-1.5'}>
                                    {stub.status === 'Issued' ? 'Not Used' : 'Claimed'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assign" className="space-y-6">
          {/* Admin stats */}
          {canManageAllMealStubs && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Scans</CardTitle>
                  <Scan className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayScans}</div>
                  <p className="text-xs text-muted-foreground">Meal stubs claimed today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week's Scans</CardTitle>
                  <Scan className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{weekScans}</div>
                  <p className="text-xs text-muted-foreground">Meal stubs claimed in the last 7 days</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assigner ministry summary card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle className="font-headline text-lg">Meal Stub Assigner</CardTitle>
              </div>
              <CardDescription>
                {isAssigner
                  ? `You are the Meal Stub Assigner for: ${assignerMinistries.map(m => m.name).join(', ')}`
                  : 'You have administrative access to assign meal stubs to any worker.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search workers by name or type..."
                    value={assignSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignSearch(e.target.value)}
                  />
                </div>
                {(isAssigner || canManageAllMealStubs) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      const autoWorkers = ministryWorkers.filter(w => w.employmentType === 'Full-Time' || w.employmentType === 'On-Call');
                      if (autoWorkers.length === 0) {
                        toast({ title: "No Eligibility", description: "No active Full-Time or On-Call workers found." });
                        return;
                      }

                      const selectedIds = autoWorkers.map(w => w.id);
                      setSelectedWorkerIds(selectedIds);
                      setBatchType('weekday');
                      setBatchCount(5);
                      setIsBatchOpen(true);
                      toast({ title: "Eligibility Selected", description: `Selected ${autoWorkers.length} FT/On-Call workers for weekday allocation.` });
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Auto-fill FT & On-Call
                  </Button>
                )}
                {(canManageAllMealStubs) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCleanupExcess}
                    disabled={isAssigning}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Cleanup Excess
                  </Button>
                )}
              </div>

              {isAssigner || canManageAllMealStubs ? (
                <div className="space-y-4">
                  {selectedWorkerIds.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                      <p className="text-sm font-medium">Selected {selectedWorkerIds.length} worker(s)</p>
                      <Button size="sm" onClick={() => setIsBatchOpen(true)}>
                        <Ticket className="mr-2 h-4 w-4" /> Batch Issue
                      </Button>
                    </div>
                  )}

                  <div className="rounded-lg border shadow-sm overflow-x-auto w-full bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={filteredAssignerWorkers.length > 0 && selectedWorkerIds.length === filteredAssignerWorkers.length}
                              onCheckedChange={() => toggleSelectAll(filteredAssignerWorkers)}
                            />
                          </TableHead>
                          <TableHead>Worker</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Weekly Usage</TableHead>
                          <TableHead className="text-right">Quick Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssignerWorkers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                              No matching workers found.
                            </TableCell>
                          </TableRow>
                        )}
                        {filteredAssignerWorkers.map(w => {
                          const weekdayCount = getWeeklyWeekdayCount(allMealStubs || [], w.id);
                          const weekdayNotUsed = getWeeklyWeekdayCount(allMealStubs || [], w.id, 'Issued');
                          const sundayCount = getSundayCount(allMealStubs || [], w.id);
                          const sundayNotUsed = getSundayCount(allMealStubs || [], w.id, 'Issued');

                          const ministry = ministries?.find(m => m.id === w.primaryMinistryId || m.id === w.secondaryMinistryId);
                          const isAutomated = w.employmentType === 'Full-Time' || w.employmentType === 'On-Call';
                          const wLimit = isAutomated ? 5 : (ministry?.mealStubWeekdayLimit || 5);
                          const sLimit = ministry?.mealStubSundayLimit || 2;

                          return (
                            <TableRow key={w.id} className={selectedWorkerIds.includes(w.id) ? "bg-muted/50" : ""}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedWorkerIds.includes(w.id)}
                                  onCheckedChange={() => toggleSelectWorker(w.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {w.firstName} {w.lastName}
                              </TableCell>
                              <TableCell className="text-xs">{w.employmentType || 'Worker'}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 min-w-[140px]">
                                  {todayIsSunday ? (
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">Today (Sun):</span>
                                        {sundayNotUsed > 0
                                          ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 py-0 h-4 text-[9px] px-1 font-bold italic">Assigned</Badge>
                                          : <span className="text-[9px] text-muted-foreground">-</span>
                                        }
                                      </div>
                                      <div className="flex flex-col text-[9px]">
                                        <span className="text-muted-foreground font-medium">Meal stub assigned: {sundayCount}/{sLimit}</span>
                                        <span className="text-blue-600 font-bold">Meal stub not used: {sundayNotUsed}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">Today:</span>
                                        {weekdayNotUsed > 0
                                          ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 py-0 h-4 text-[9px] px-1 font-bold italic">Assigned</Badge>
                                          : <span className="text-[9px] text-muted-foreground">-</span>
                                        }
                                      </div>
                                      <div className="flex flex-col text-[9px]">
                                        <span className="text-muted-foreground font-medium">Meal stub assigned: {weekdayCount}/{wLimit}</span>
                                        <span className="text-blue-600 font-bold">Meal stub not used: {weekdayNotUsed}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {isAutomated && (
                                    <Button
                                      size="sm"
                                      variant={weekdayCount >= wLimit ? "ghost" : "outline"}
                                      className="h-8 py-0 px-2 text-[10px]"
                                      disabled={weekdayCount >= wLimit || isAssigning}
                                      onClick={() => handleQuickAssign(w, 'weekday', wLimit - weekdayCount)}
                                    >
                                      {weekdayCount >= wLimit ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : `Assign Full Week`}
                                    </Button>
                                  )}
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-8 w-8 p-0 text-[10px]"
                                      disabled={sundayCount >= sLimit || isAssigning}
                                      onClick={() => handleQuickAssign(w, 'sunday', 1)}
                                    >
                                      S1
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-8 w-8 p-0 text-[10px]"
                                      disabled={sundayCount >= sLimit || isAssigning}
                                      onClick={() => handleQuickAssign(w, 'sunday', 2)}
                                    >
                                      S2
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    As a Super Admin, you can assign stubs to any active worker across all {ministries?.length || 0} ministries.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Issued Stubs (for management) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recently Issued Stubs</CardTitle>
              <CardDescription>Meal stubs recently assigned by ministries.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Recently Issued Weekday Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-blue-600 flex items-center justify-between">
                    Weekday (Mon-Sat)
                    <span className="text-[10px] font-normal text-muted-foreground lowercase">Last 20 today</span>
                  </h4>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="h-8">
                          <TableHead className="text-[10px] h-8">Worker</TableHead>
                          <TableHead className="text-[10px] h-8">Time</TableHead>
                          <TableHead className="text-[10px] h-8 text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allMealStubs?.filter(s => s.stubType === 'weekday' && s.date && isToday(new Date((s.date as any).seconds * 1000))).length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center py-6 text-[10px] text-muted-foreground italic">No weekday stubs issued today.</TableCell></TableRow>
                        ) : (
                          allMealStubs?.filter(s => s.stubType === 'weekday' && s.date && isToday(new Date((s.date as any).seconds * 1000))).slice(0, 20).map((stub) => {
                            const worker = allWorkers?.find(w => w.id === stub.workerId);
                            const workerName = worker ? `${worker.firstName} ${worker.lastName}` : stub.workerName;
                            return (
                              <TableRow key={stub.id} className="h-9">
                                <TableCell className="text-[11px] font-medium truncate max-w-[120px]">{workerName}</TableCell>
                                <TableCell className="text-[11px] font-mono">{stub.date ? format(new Date((stub.date as any).seconds * 1000), 'p') : ''}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-100 text-blue-800 text-[9px] h-4 px-1' : 'bg-green-100 text-green-800 text-[9px] h-4 px-1'}>
                                    {stub.status === 'Issued' ? 'Not Used' : 'Claimed'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Recently Issued Sunday Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-green-600 flex items-center justify-between">
                    Sunday
                    <span className="text-[10px] font-normal text-muted-foreground lowercase">Last 20 today</span>
                  </h4>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="h-8">
                          <TableHead className="text-[10px] h-8">Worker</TableHead>
                          <TableHead className="text-[10px] h-8">Time</TableHead>
                          <TableHead className="text-[10px] h-8 text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allMealStubs?.filter(s => s.stubType === 'sunday' && s.date && isToday(new Date((s.date as any).seconds * 1000))).length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center py-6 text-[10px] text-muted-foreground italic">No Sunday stubs issued today.</TableCell></TableRow>
                        ) : (
                          allMealStubs?.filter(s => s.stubType === 'sunday' && s.date && isToday(new Date((s.date as any).seconds * 1000))).slice(0, 20).map((stub) => {
                            const worker = allWorkers?.find(w => w.id === stub.workerId);
                            const workerName = worker ? `${worker.firstName} ${worker.lastName}` : stub.workerName;
                            return (
                              <TableRow key={stub.id} className="h-9">
                                <TableCell className="text-[11px] font-medium truncate max-w-[120px]">{workerName}</TableCell>
                                <TableCell className="text-[11px] font-mono">{stub.date ? format(new Date((stub.date as any).seconds * 1000), 'p') : ''}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-200 text-blue-900 text-[9px] h-4 px-1' : 'bg-green-100 text-green-800 text-[9px] h-4 px-1'}>
                                    {stub.status === 'Issued' ? 'Not Used' : 'Claimed'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Stub Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Assign Meal Stub</DialogTitle>
            <DialogDescription>
              Select a worker from your ministry and the stub type to issue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Worker</Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a worker..." />
                </SelectTrigger>
                <SelectContent>
                  {ministryWorkers.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.firstName} {w.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stub Type</Label>
              <Select value={stubType} onValueChange={(v) => setStubType(v as 'weekday' | 'sunday')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday">Weekday (Mon–Sat)</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedWorkerId && (
              <>
                <Separator />
                <div className="rounded-lg bg-muted/50 p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground border-b pb-1">This Worker's Allocation — Current Week</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-tight">Meal stub assigned</p>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-bold ${selectedWorkerWeekdayCount >= selectedWorkerWeekdayLimit ? 'text-red-600' : 'text-blue-600'}`}>
                          W: {selectedWorkerWeekdayCount} / {selectedWorkerWeekdayLimit}
                        </span>
                        <span className={`text-xs font-bold ${selectedWorkerSundayCount >= selectedWorkerSundayLimit ? 'text-red-600' : 'text-green-600'}`}>
                          S: {selectedWorkerSundayCount} / {selectedWorkerSundayLimit}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-tight">Meal stub not used</p>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-blue-600">
                          W: {getWeeklyWeekdayCount(allMealStubs || [], selectedWorkerId, 'Issued')} stub(s)
                        </span>
                        <span className="text-xs font-bold text-blue-600">
                          S: {getSundayCount(allMealStubs || [], selectedWorkerId, 'Issued')} stub(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  {stubType === 'weekday' && selectedWorkerWeekdayCount >= selectedWorkerWeekdayLimit && (
                    <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Weekly weekday limit reached.</p>
                  )}
                  {stubType === 'sunday' && selectedWorkerSundayCount >= selectedWorkerSundayLimit && (
                    <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Weekly Sunday limit reached.</p>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAssignStub}
              disabled={!selectedWorkerId || isAssigning ||
                (stubType === 'weekday' && selectedWorkerWeekdayCount >= selectedWorkerWeekdayLimit) ||
                (stubType === 'sunday' && selectedWorkerSundayCount >= selectedWorkerSundayLimit)
              }
            >
              {isAssigning ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Issue Stub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Assign Dialog */}
      <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Issue Meal Stubs</DialogTitle>
            <DialogDescription>
              Assign meal stubs to {selectedWorkerIds.length} selected worker(s).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Stub Type</Label>
              <Select value={batchType} onValueChange={(v: any) => setBatchType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday">Weekday Stub</SelectItem>
                  <SelectItem value="sunday">Sunday Stub</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Count per Worker</Label>
              <Select value={batchCount.toString()} onValueChange={(v: string) => setBatchCount(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} stub(s)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground italic">
                Note: This will respect individual weekly limits. Workers already at their limit will be skipped.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchOpen(false)}>Cancel</Button>
            <Button onClick={handleBatchAssign} disabled={isAssigning}>
              {isAssigning ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
              Issue Stubs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export default function MealsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    }>
      <MealsPageContent />
    </Suspense>
  );
}
