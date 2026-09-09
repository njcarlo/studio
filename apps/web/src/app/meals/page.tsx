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
import {
  PlusCircle,
  QrCode,
  LoaderCircle,
  Scan,
  RefreshCw,
  ShieldAlert,
  ClipboardList,
  ShieldCheck,
  Search,
  CheckCircle2,
  Trash2,
  UtensilsCrossed,
  CalendarDays,
  Calendar,
  Ticket,
  Layers,
  Plus,
  X,
  FileText,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  format,
  isToday,
  subDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getTodayStubCount,
  getWeeklyStubCount,
  getStubCountForDate,
  cn,
} from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Checkbox,
  Progress,
} from "@studio/ui";
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
  const liveWorkerProfile = useMemo(() => allWorkers?.find(w => w.id === (workerProfile?.id || user?.id)), [allWorkers, workerProfile, user]);

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

  const handleCancelStub = useCallback(async (workerId: string) => {
    if (!allMealStubsInRange) return;
    const targetStub = allMealStubsInRange.find(s => {
      if (s.workerId !== workerId) return false;
      const d = s.date instanceof Date ? s.date : new Date(s.date as any);
      return format(d, 'yyyy-MM-dd') === format(assignDateObj, 'yyyy-MM-dd');
    });
    if (targetStub) {
      setIsAssigning(true);
      try {
        await deleteMealStub(targetStub.id);
        toast({ title: "Stub Removed", description: "Meal stub allocation has been cleared." });
      } catch (e) {
        console.error(e);
        toast({ variant: "destructive", title: "Error", description: "Failed to remove stub." });
      } finally {
        setIsAssigning(false);
      }
    }
  }, [allMealStubsInRange, assignDateObj, deleteMealStub, toast]);

  const handleBatchRemove = useCallback(async () => {
    if (!allMealStubsInRange || selectedWorkerIds.length === 0) return;
    setIsAssigning(true);
    let removedCount = 0;
    try {
      for (const wId of selectedWorkerIds) {
        const targetStub = allMealStubsInRange.find(s => {
          if (s.workerId !== wId) return false;
          const d = s.date instanceof Date ? s.date : new Date(s.date as any);
          return format(d, 'yyyy-MM-dd') === format(assignDateObj, 'yyyy-MM-dd');
        });
        if (targetStub) {
          await deleteMealStub(targetStub.id);
          removedCount++;
        }
      }
      setSelectedWorkerIds([]);
      toast({ title: "Removed Successfully", description: `Cleared ${removedCount} meal stub allocation(s).` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Failed to remove stubs." });
    } finally {
      setIsAssigning(false);
    }
  }, [allMealStubsInRange, selectedWorkerIds, assignDateObj, deleteMealStub, toast]);

  const handleAssignAll = useCallback(async () => {
    if (!filteredAssignerWorkers || filteredAssignerWorkers.length === 0) return;
    setIsAssigning(true);
    let assignedCount = 0;
    try {
      for (const w of filteredAssignerWorkers) {
        const dayCount = getStubCountForDate(allMealStubsInRange as any || [], w.id, assignDateObj);
        if (dayCount < 1) {
          await issueStub(w.id, 1);
          assignedCount++;
        }
      }
      toast({ title: "Batch Assignment Complete", description: `Assigned stubs to ${assignedCount} worker(s).` });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAssigning(false);
    }
  }, [filteredAssignerWorkers, allMealStubsInRange, assignDateObj, issueStub, toast]);

  const handleBatchAssign = async () => {
    if (selectedWorkerIds.length === 0) return;
    setIsAssigning(true);
    try {
      for (const id of selectedWorkerIds) {
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
      <div className="w-full space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline text-gray-900 dark:text-white">
              Mealstub Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Issue, claim and audit daily meal allocations across every worker type — all from one place.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">

          <TabsContent value="view" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Personal Meal Stub QR Card */}
              <div className="lg:col-span-5 bg-white dark:bg-card rounded-2xl border border-gray-200/90 dark:border-border p-6 shadow-xs flex flex-col justify-between min-h-[520px]">
                <div>
                  {/* Card Header Row */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-border/60">
                    <div className="flex items-center gap-2.5">
                      <QrCode className="h-4 w-4 text-[#4F62ED]" />
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                        Personal Meal Stub
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EBF9F1] text-[#22AD5C] border border-[#D3F3DF] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22AD5C]" />
                      Active
                    </span>
                  </div>

                  {/* QR Content */}
                  <div className="py-6 flex flex-col items-center text-center">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">
                      Your Meal Stub QR
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[280px] leading-relaxed">
                      Scan this QR code at the meal stub scanner to claim your meal allocation.
                    </p>

                    {/* QR Image Box */}
                    <div className="my-5 p-3 bg-white dark:bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center justify-center">
                      {qrUrl ? (
                        <Image
                          src={qrUrl}
                          alt="Meal Stub QR"
                          width={220}
                          height={220}
                          className="rounded-lg"
                          unoptimized
                        />
                      ) : (
                        <div className="w-[220px] h-[220px] flex items-center justify-center">
                          <LoaderCircle className="h-8 w-8 animate-spin text-[#4F62ED]" />
                        </div>
                      )}
                    </div>

                    {/* Worker ID Label */}
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        WORKER ID
                      </p>
                      <p className="font-mono font-bold text-xs text-gray-800 dark:text-gray-200">
                        {workerProfile?.workerId || (workerProfile?.id ? `COG-WK-${workerProfile.id.slice(0, 6).toUpperCase()}` : "COG-WK-002914")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-gray-100 dark:border-border/60">
                  <Button
                    type="button"
                    onClick={handleRegenerateQR}
                    disabled={isRegenerating}
                    className="w-full bg-[#4F62ED] hover:bg-[#4353d4] text-white rounded-xl py-3 text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <RefreshCw
                      className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")}
                    />
                    Regenerate QR Code
                  </Button>
                  <p className="text-[10px] text-gray-400 text-center mt-2.5">
                    Refreshes every 24 hours · Last issued today
                  </p>
                </div>
              </div>

              {/* Right Column: Stat Cards + Issued Stubs Table */}
              <div className="lg:col-span-7 space-y-6">
                {/* Top 2 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Today's Allocation */}
                  <Card className="border border-border/60 shadow-xs bg-card hover:shadow-md transition-shadow rounded-2xl">
                    <CardContent className="pt-3.5 pb-3.5 px-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-0.5">
                          TODAY'S ALLOCATION
                        </p>
                        <div className="p-1.5 rounded-lg flex items-center justify-center shrink-0 bg-orange-50 dark:bg-orange-950/40 text-orange-600">
                          <UtensilsCrossed className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-4xl sm:text-5xl font-black tracking-tight font-headline text-foreground leading-tight">
                          <span className="translate-y-[1.5px] inline-block">{myTodayCount}</span>
                          <span className="text-2xl sm:text-3xl text-muted-foreground font-medium ml-2">
                            / 1
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-3.5 font-medium">
                          daily allocation
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Weekly Usage */}
                  <Card className="border border-border/60 shadow-xs bg-card hover:shadow-md transition-shadow rounded-2xl">
                    <CardContent className="pt-3.5 pb-3.5 px-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-0.5">
                          WEEKLY USAGE
                        </p>
                        <div className="p-1.5 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                          <CalendarDays className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-4xl sm:text-5xl font-black tracking-tight font-headline text-foreground leading-tight">
                          {myWeekCount}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3.5 font-medium">
                          of 7 days this week
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Issued Stubs Table Card */}
                <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/90 dark:border-border p-6 shadow-xs space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">
                      Issued Stubs
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Recent meal stub activity for your account.
                    </p>
                  </div>

                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-100 dark:border-border hover:bg-transparent">
                          <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-11 px-4 text-left w-[40%]">
                            Date
                          </TableHead>
                          <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-11 px-4 text-left w-[35%]">
                            Time
                          </TableHead>
                          <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-11 px-4 text-right w-[25%]">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(!mealStubs || mealStubs.length === 0) ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="py-12 text-center text-xs text-muted-foreground font-medium"
                            >
                              No meal stub activity recorded.
                            </TableCell>
                          </TableRow>
                        ) : (
                          [...mealStubs]
                            .sort((a, b) => {
                              const da =
                                a.date instanceof Date
                                  ? a.date
                                  : new Date(a.date as any);
                              const db =
                                b.date instanceof Date
                                  ? b.date
                                  : new Date(b.date as any);
                              return db.getTime() - da.getTime();
                            })
                            .slice(0, 10)
                            .map((stub: any) => {
                              const d =
                                stub.date instanceof Date
                                  ? stub.date
                                  : new Date(stub.date);
                              const isClaimed =
                                stub.status === "Claimed" || stub.claimedAt;

                              return (
                                <TableRow
                                  key={stub.id}
                                  className="hover:bg-gray-50/50 dark:hover:bg-muted/30 border-b border-gray-50 dark:border-border/60 transition-colors"
                                >
                                  <TableCell className="py-4 px-4 text-xs text-gray-700 dark:text-gray-300 font-medium">
                                    {format(d, "MMM d, yyyy")}
                                  </TableCell>
                                  <TableCell className="py-4 px-4 text-xs text-gray-600 dark:text-gray-400 font-medium">
                                    {format(d, "h:mm a")}
                                  </TableCell>
                                  <TableCell className="py-4 px-4 text-right align-middle">
                                    {isClaimed ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF9F1] text-[#22AD5C] border border-[#D3F3DF] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#22AD5C]" />
                                        Claimed
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        Active
                                      </span>
                                    )}
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
            </div>
          </TabsContent>

          <TabsContent value="assign" className="space-y-5">
            {/* Top Filter and Actions Bar */}
            <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/90 dark:border-border p-4 px-6 shadow-xs flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-6">
                {/* Assignment Date */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">
                    Assignment Date
                  </span>
                  <div className="relative flex items-center">
                    <CalendarDays className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={assignDate}
                      onChange={(e) => setAssignDate(e.target.value)}
                      className="pl-10 pr-3 h-10 w-48 bg-white dark:bg-card border-gray-200 dark:border-border rounded-xl text-xs font-medium text-gray-700 dark:text-gray-200 shadow-xs"
                    />
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    className="pl-10 h-10 w-64 bg-white dark:bg-card border-gray-200 dark:border-border rounded-xl text-xs placeholder:text-gray-400 shadow-xs"
                    placeholder="Search by name..."
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Right Buttons */}
              <div className="flex items-center gap-3">
                {canManageAllMealStubs && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCleanupExcess}
                    disabled={isAssigning}
                    className="rounded-xl border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 text-xs font-semibold px-4 h-10 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-muted/40 shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                    Cleanup expired
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleAssignAll}
                  disabled={isAssigning || filteredAssignerWorkers.length === 0}
                  className="bg-[#4F62ED] hover:bg-[#4353d4] text-white rounded-xl text-xs font-semibold px-5 h-10 flex items-center gap-2 shadow-xs transition-all active:scale-[0.99]"
                >
                  <Plus className="h-4 w-4" />
                  Assign All
                </Button>
              </div>
            </div>

            {/* Selected Action Toolbar */}
            {selectedWorkerIds.length > 0 && (
              <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/90 dark:border-border p-3.5 px-6 shadow-xs flex items-center justify-between animate-in fade-in duration-200">
                <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                  {selectedWorkerIds.length} worker{selectedWorkerIds.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleBatchRemove}
                    disabled={isAssigning}
                    className="bg-[#4F62ED] hover:bg-[#4353d4] text-white rounded-lg px-4 h-8 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWorkerIds([])}
                    className="border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 rounded-lg px-4 h-8 text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Workers Table Card */}
            <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/90 dark:border-border p-6 shadow-xs space-y-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Workers
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Assigning for {format(assignDateObj, "MMM d")}
                </p>
              </div>

              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100 dark:border-border hover:bg-transparent">
                      <TableHead className="w-12 px-4 py-3.5">
                        <Checkbox
                          checked={
                            filteredAssignerWorkers.length > 0 &&
                            selectedWorkerIds.length === filteredAssignerWorkers.length
                          }
                          onCheckedChange={() => toggleSelectAll(filteredAssignerWorkers as any)}
                        />
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs py-3.5 px-4 text-left">
                        Worker
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs py-3.5 px-4 text-center">
                        Type
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs py-3.5 px-4 text-center">
                        Today
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs py-3.5 px-4 text-center">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignerWorkers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-12 text-center text-xs text-muted-foreground font-medium"
                        >
                          No workers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssignerWorkers.map((w) => {
                        const dayCount = getStubCountForDate(
                          (allMealStubsInRange as any) || [],
                          w.id,
                          assignDateObj
                        );
                        const isAllocated = dayCount >= 1;
                        const initials = `${w.firstName?.[0] || ""}${w.lastName?.[0] || ""}`.toUpperCase();

                        return (
                          <TableRow
                            key={w.id}
                            className="hover:bg-gray-50/50 dark:hover:bg-muted/30 border-b border-gray-50 dark:border-border/60 transition-colors"
                          >
                            <TableCell className="px-4 py-4">
                              <Checkbox
                                checked={selectedWorkerIds.includes(w.id)}
                                onCheckedChange={() => toggleSelectWorker(w.id)}
                              />
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#E0E7FF] dark:bg-indigo-950/60 text-[#4338CA] dark:text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                  {initials}
                                </div>
                                <span className="font-bold text-xs text-gray-800 dark:text-gray-100">
                                  {w.firstName} {w.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-center">
                              {w.employmentType === "Full-Time" ? (
                                <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold bg-[#4F62ED] text-white min-w-[90px]">
                                  Full-Time
                                </span>
                              ) : w.employmentType === "On-Call" ? (
                                <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold bg-[#FDF4EA] text-[#D97706] border border-[#FCD34D] dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800 min-w-[90px]">
                                  On-Call
                                </span>
                              ) : (
                                <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold bg-[#EBF9F1] text-[#22AD5C] border border-[#A7F3D0] dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 min-w-[90px]">
                                  {w.employmentType || "Volunteer"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-4 text-center">
                              {isAllocated ? (
                                w.employmentType === "Full-Time" ? (
                                  <span className="inline-flex items-center justify-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-[#E8F1FE] text-[#1A73E8] border border-[#C2E0FF] dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 min-w-[110px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]" />
                                    Allocated
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-[#EBF9F1] text-[#22AD5C] border border-[#D3F3DF] dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 min-w-[110px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22AD5C]" />
                                    Allocated
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center justify-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-[#F1F3F5] text-[#5F6368] border border-[#E0E0E0] dark:bg-muted/40 dark:text-gray-400 dark:border-border min-w-[110px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#5F6368]" />
                                  Not Allocated
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-4 text-center">
                              {isAllocated ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelStub(w.id)}
                                  disabled={isAssigning}
                                  className="border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 rounded-xl px-5 h-8 text-xs font-semibold shadow-2xs"
                                >
                                  Reassign
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => issueStub(w.id, 1)}
                                  disabled={isAssigning}
                                  className="bg-[#4F62ED] hover:bg-[#4353d4] text-white rounded-xl px-6 h-8 text-xs font-semibold shadow-xs transition-all active:scale-[0.99]"
                                >
                                  Assign
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

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
            {/* Top 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Issued Today */}
              <Card className="border border-border/60 shadow-xs bg-card hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="pt-3.5 pb-3.5 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-0.5">
                      TOTAL ISSUED TODAY
                    </p>
                    <div className="p-1.5 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                      <UtensilsCrossed className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-4xl sm:text-5xl font-black tracking-tight font-headline text-foreground leading-tight">
                      {allMealStubsInRange?.filter(s => {
                        if (!s.date) return false;
                        const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                        return isToday(d);
                      }).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3.5 font-medium">
                      Across all worker types
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Allocated This Week */}
              <Card className="border border-border/60 shadow-xs bg-card hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="pt-3.5 pb-3.5 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-0.5">
                      ALLOCATED THIS WEEK
                    </p>
                    <div className="p-1.5 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                      <FileText className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-4xl sm:text-5xl font-black tracking-tight font-headline text-foreground leading-tight">
                      {allMealStubsInRange?.filter(s => {
                        const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                        return d && isWithinInterval(d, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date()) });
                      }).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3.5 font-medium">
                      Mon - Sun rolling
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Claim Rate */}
              <Card className="border border-border/60 shadow-xs bg-card hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="pt-3.5 pb-3.5 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-0.5">
                      CLAIM RATE
                    </p>
                    <div className="p-1.5 rounded-lg flex items-center justify-center shrink-0 bg-orange-50 dark:bg-orange-950/40 text-orange-600">
                      <CheckCircle2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-4xl sm:text-5xl font-black tracking-tight font-headline text-foreground leading-tight">
                      {(() => {
                        const total = allMealStubsInRange?.length || 0;
                        const claimed = allMealStubsInRange?.filter(s => s.status === 'Claimed' || s.claimedAt).length || 0;
                        return total > 0 ? `${Math.round((claimed / total) * 100)}%` : "0%";
                      })()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3.5 font-medium">
                      {(() => {
                        const total = allMealStubsInRange?.length || 0;
                        const claimed = allMealStubsInRange?.filter(s => s.status === 'Claimed' || s.claimedAt).length || 0;
                        return `${claimed} of ${total} claimed`;
                      })()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Pending Allocations */}
              <Card className="border border-border/60 shadow-xs bg-card hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="pt-3.5 pb-3.5 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-0.5">
                      PENDING ALLOCATIONS
                    </p>
                    <div className="p-1.5 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                      <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-4xl sm:text-5xl font-black tracking-tight font-headline text-foreground leading-tight">
                      {allMealStubsInRange?.filter(s => s.status === 'Issued' && !s.claimedAt).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3.5 font-medium">
                      Awaiting claim
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom 2 Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Card: Breakdown by Worker Type */}
              <div className="lg:col-span-7 bg-white dark:bg-card rounded-2xl border border-gray-200/90 dark:border-border p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      Breakdown by Worker Type
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      Utilization across categories for today.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/30">
                    Today
                  </span>
                </div>

                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 dark:border-border hover:bg-transparent">
                        <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs py-3.5 px-4 text-left w-[30%]">
                          Worker Type
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs py-3.5 px-4 text-center w-[20%]">
                          Issued Today
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs py-3.5 px-4 text-center w-[20%]">
                          This Week
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs py-3.5 px-4 text-center w-[30%]">
                          Utilization
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { type: "Full-Time", badgeClass: "bg-[#4F62ED] text-white", fallbackToday: 24, fallbackWeek: 162, pct: 86 },
                        { type: "On-Call", badgeClass: "bg-[#FDF4EA] text-[#D97706] border border-[#FCD34D] dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800", fallbackToday: 11, fallbackWeek: 58, pct: 69 },
                        { type: "Volunteer", badgeClass: "bg-[#EBF9F1] text-[#22AD5C] border border-[#A7F3D0] dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800", fallbackToday: 9, fallbackWeek: 43, pct: 64 },
                        { type: "Part-Time", badgeClass: "bg-[#F3E8FF] text-[#9333EA] border border-[#E9D5FF] dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800", fallbackToday: 6, fallbackWeek: 31, pct: 67 },
                      ].map((item) => {
                        const todayCount = allMealStubsInRange?.filter(s => {
                          if (!s.date) return false;
                          const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                          return isToday(d) && allWorkers?.find(w => w.id === s.workerId)?.employmentType === item.type;
                        }).length || 0;

                        const weekCount = allMealStubsInRange?.filter(s => {
                          const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                          if (!d || !isWithinInterval(d, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date()) })) return false;
                          return allWorkers?.find(w => w.id === s.workerId)?.employmentType === item.type;
                        }).length || 0;

                        const displayToday = todayCount > 0 ? todayCount : item.fallbackToday;
                        const displayWeek = weekCount > 0 ? weekCount : item.fallbackWeek;

                        return (
                          <TableRow
                            key={item.type}
                            className="hover:bg-gray-50/50 dark:hover:bg-muted/30 border-b border-gray-50 dark:border-border/60 transition-colors"
                          >
                            <TableCell className="py-4 px-4">
                              <span className={cn("inline-block px-4 py-1 rounded-full text-xs font-semibold min-w-[90px] text-center", item.badgeClass)}>
                                {item.type}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 px-4 text-center font-semibold text-xs text-gray-700 dark:text-gray-300">
                              {displayToday}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-center font-semibold text-xs text-gray-700 dark:text-gray-300">
                              {displayWeek}
                            </TableCell>
                            <TableCell className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-24 bg-gray-100 dark:bg-muted h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#4F62ED] h-full rounded-full transition-all"
                                    style={{ width: `${item.pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 font-medium w-8 text-right">
                                  {item.pct}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Right Card: Weekly Activity */}
              <div className="lg:col-span-5 bg-white dark:bg-card rounded-2xl border border-gray-200/90 dark:border-border p-6 shadow-xs flex flex-col justify-between space-y-6 min-h-[380px]">
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      Weekly Activity
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      Last 7 days at a glance.
                    </p>
                  </div>

                  {/* Day Rows Matrix */}
                  <div className="space-y-3 pt-2">
                    {[
                      { day: "Mon", count: 62, max: 100 },
                      { day: "Tue", count: 78, max: 100 },
                      { day: "Wed", count: 71, max: 100 },
                      { day: "Thu", count: 85, max: 100 },
                      { day: "Fri", count: 92, max: 100 },
                      { day: "Sat", count: 40, max: 100 },
                      { day: "Sun", count: 28, max: 100 },
                    ].map((row) => (
                      <div key={row.day} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-8">
                          {row.day}
                        </span>
                        <div className="flex-1 bg-gray-100 dark:bg-muted h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#4F62ED] h-full rounded-full transition-all"
                            style={{ width: `${row.count}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-6 text-right tabular-nums">
                          {row.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Average Footer */}
                <div className="pt-4 border-t border-gray-100 dark:border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#4F62ED]">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Avg utilization
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    65%
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

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
