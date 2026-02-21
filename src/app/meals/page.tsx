"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { collection, serverTimestamp, doc, query, where, updateDoc } from "firebase/firestore";
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
import { PlusCircle, QrCode, LoaderCircle, Scan, RefreshCw, ShieldAlert, ClipboardList, ShieldCheck, Search, CheckCircle2 } from "lucide-react";
import type { MealStub, Worker, Ministry } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { format, isToday, subDays, startOfWeek, endOfWeek, isSunday, isWithinInterval, addDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---- per-worker stub counts for the current week ----
function getWeeklyWeekdayCount(stubs: MealStub[], workerId: string) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date());
  return stubs.filter(s => {
    if (s.workerId !== workerId) return false;
    const d = new Date((s.date as any).seconds * 1000);
    return !isSunday(d) && isWithinInterval(d, { start, end });
  }).length;
}

function getSundayCount(stubs: MealStub[], workerId: string) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date());
  return stubs.filter(s => {
    if (s.workerId !== workerId) return false;
    const d = new Date((s.date as any).seconds * 1000);
    return isSunday(d) && isWithinInterval(d, { start, end });
  }).length;
}

// ------------------------------------------------------------
export default function MealsPage() {
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

  const issueMultipleStubs = useCallback(async (targetId: string, type: 'weekday' | 'sunday', count: number) => {
    if (!workerProfile) return;
    const targetWorker = ministryWorkers.find(w => w.id === targetId);
    if (!targetWorker) return;

    setIsAssigning(true);
    try {
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(addDocumentNonBlocking(collection(firestore, "mealstubs"), {
          workerId: targetId,
          workerName: `${targetWorker.firstName} ${targetWorker.lastName}`,
          date: serverTimestamp(),
          status: 'Issued' as 'Issued',
          assignedBy: workerProfile.id,
          assignedByName: `${workerProfile.firstName} ${workerProfile.lastName}`,
          stubType: type,
        }));
      }
      await Promise.all(promises);
      toast({ title: "Stubs Issued", description: `Successfully issued ${count} ${type} stub(s) to ${targetWorker.firstName}.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed to assign stub(s)" });
    } finally {
      setIsAssigning(false);
    }
  }, [workerProfile, ministryWorkers, firestore, toast]);

  const handleQuickAssign = (w: Worker, type: 'weekday' | 'sunday', count: number) => {
    const allStubs = allMealStubs || [];
    const current = type === 'weekday' ? getWeeklyWeekdayCount(allStubs, w.id) : getSundayCount(allStubs, w.id);
    const limit = type === 'weekday' ? 5 : 2;

    const remaining = limit - current;
    if (remaining <= 0) {
      toast({ variant: "destructive", title: "Limit Reached", description: `${w.firstName} already has maximum ${type} stubs.` });
      return;
    }

    const toIssue = Math.min(count, remaining);
    issueMultipleStubs(w.id, type, toIssue);
  };

  const today = new Date();
  const todayIsSunday = isSunday(today);

  const handleAssignStub = useCallback(async () => {
    if (!selectedWorkerId || !workerProfile) return;
    const targetWorker = ministryWorkers.find(w => w.id === selectedWorkerId);
    if (!targetWorker) return;

    const allStubs = allMealStubs || [];

    if (stubType === 'weekday') {
      const count = getWeeklyWeekdayCount(allStubs, selectedWorkerId);
      if (count >= 5) {
        toast({ variant: "destructive", title: "Limit Reached", description: `${targetWorker.firstName} has already used all 5 weekday meal stubs this week.` });
        return;
      }
    } else {
      const count = getSundayCount(allStubs, selectedWorkerId);
      if (count >= 2) {
        toast({ variant: "destructive", title: "Limit Reached", description: `${targetWorker.firstName} has already used both Sunday meal stubs this week.` });
        return;
      }
    }

    setIsAssigning(true);
    try {
      await addDocumentNonBlocking(collection(firestore, "mealstubs"), {
        workerId: selectedWorkerId,
        workerName: `${targetWorker.firstName} ${targetWorker.lastName}`,
        date: serverTimestamp(),
        status: 'Issued' as 'Issued',
        assignedBy: workerProfile.id,
        assignedByName: `${workerProfile.firstName} ${workerProfile.lastName}`,
        stubType,
      });
      toast({ title: "Meal Stub Assigned", description: `Stub issued to ${targetWorker.firstName} ${targetWorker.lastName}.` });
      setIsAssignOpen(false);
      setSelectedWorkerId('');
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed to assign stub" });
    } finally {
      setIsAssigning(false);
    }
  }, [selectedWorkerId, stubType, ministryWorkers, allMealStubs, workerProfile, firestore, toast]);



  const claimedStubs = mealStubs?.filter(s => s.status === 'Claimed') || [];
  const todayScans = claimedStubs.filter(s => s.date && isToday(new Date((s.date as any).seconds * 1000))).length;
  const weekScans = claimedStubs.filter(s => {
    if (!s.date) return false;
    return new Date((s.date as any).seconds * 1000) > subDays(new Date(), 7);
  }).length;

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }
  if (!canViewMealStubs) {
    return (
      <AppLayout>
        <Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card>
      </AppLayout>
    );
  }

  // selected worker weekly stubs for display in dialog
  const selectedWorkerWeekdayCount = selectedWorkerId ? getWeeklyWeekdayCount(allMealStubs || [], selectedWorkerId) : 0;
  const selectedWorkerSundayCount = selectedWorkerId ? getSundayCount(allMealStubs || [], selectedWorkerId) : 0;

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

              <div className="rounded-lg border shadow-sm overflow-x-auto w-full">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mealStubsLoading && (
                      <TableRow><TableCell colSpan={3} className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                    )}
                    {mealStubs?.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10">No meal stubs found.</TableCell></TableRow>
                    )}
                    {mealStubs?.map((stub) => (
                      <TableRow key={stub.id}>
                        <TableCell>{stub.date ? format(new Date((stub.date as any).seconds * 1000), 'PP') : ''}</TableCell>
                        <TableCell className="capitalize">{stub.stubType || 'Meal Stub'}</TableCell>
                        <TableCell>
                          <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                            {stub.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
              <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search workers by name or type..."
                  value={assignSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssignSearch(e.target.value)}
                />
              </div>

              {isAssigner ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssignerWorkers.map(w => {
                    const weekdayCount = getWeeklyWeekdayCount(allMealStubs || [], w.id);
                    const sundayCount = getSundayCount(allMealStubs || [], w.id);
                    const isFullTime = w.employmentType === 'Full-Time';

                    return (
                      <Card key={w.id} className="overflow-hidden bg-muted/30 border-muted-foreground/10">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-sm font-bold">{w.firstName} {w.lastName}</CardTitle>
                              <CardDescription className="text-[10px]">{w.employmentType || 'Worker'}</CardDescription>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-[10px] font-medium ${weekdayCount >= 5 ? 'text-red-500' : 'text-blue-600'}`}>
                                Weekday: {weekdayCount}/5
                              </span>
                              <span className={`text-[10px] font-medium ${sundayCount >= 2 ? 'text-red-500' : 'text-green-600'}`}>
                                Sunday: {sundayCount}/2
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="flex flex-col gap-2">
                            {/* Weekday Action for Full-Time */}
                            {isFullTime && (
                              <Button
                                size="sm"
                                variant={weekdayCount >= 5 ? "ghost" : "outline"}
                                className="w-full text-[10px] h-8 justify-between"
                                disabled={weekdayCount >= 5 || isAssigning}
                                onClick={() => handleQuickAssign(w, 'weekday', 5 - weekdayCount)}
                              >
                                <span className="flex items-center">
                                  {weekdayCount >= 5 ? <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" /> : <ClipboardList className="mr-1 h-3 w-3" />}
                                  {weekdayCount >= 5 ? 'Weekdays Assigned' : `Assign Weekdays (${5 - weekdayCount})`}
                                </span>
                              </Button>
                            )}

                            {/* Sunday Actions */}
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-[10px] h-8"
                                disabled={sundayCount >= 2 || isAssigning}
                                onClick={() => handleQuickAssign(w, 'sunday', 1)}
                              >
                                +1 Sunday
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-[10px] h-8"
                                disabled={sundayCount >= 2 || isAssigning}
                                onClick={() => handleQuickAssign(w, 'sunday', 2)}
                              >
                                +2 Sunday
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredAssignerWorkers.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full py-10 text-center">No matching workers found.</p>
                  )}
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
            <CardContent className="p-0">
              <div className="rounded-lg overflow-x-auto w-full">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow><TableCell colSpan={4} className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                    )}
                    {allMealStubs?.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">No issued stubs found.</TableCell></TableRow>
                    )}
                    {allMealStubs?.slice(0, 20).map((stub) => {
                      const worker = allWorkers?.find(w => w.id === stub.workerId);
                      const workerName = worker ? `${worker.firstName} ${worker.lastName}` : stub.workerName;
                      return (
                        <TableRow key={stub.id}>
                          <TableCell className="font-medium">{workerName}</TableCell>
                          <TableCell>{stub.date ? format(new Date((stub.date as any).seconds * 1000), 'PPp') : ''}</TableCell>
                          <TableCell className="capitalize">{stub.stubType || 'Meal Stub'}</TableCell>
                          <TableCell>
                            <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                              {stub.status}
                            </Badge>
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
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">This Worker's Allocation — Current Week</p>
                  <div className="flex gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground">Weekday</span>
                      <span className={`font-bold ${selectedWorkerWeekdayCount >= 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedWorkerWeekdayCount} / 5
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground">Sunday</span>
                      <span className={`font-bold ${selectedWorkerSundayCount >= 2 ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedWorkerSundayCount} / 2
                      </span>
                    </div>
                  </div>
                  {stubType === 'weekday' && selectedWorkerWeekdayCount >= 5 && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Weekly weekday limit reached.</p>
                  )}
                  {stubType === 'sunday' && selectedWorkerSundayCount >= 2 && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Weekly Sunday limit reached.</p>
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
                (stubType === 'weekday' && selectedWorkerWeekdayCount >= 5) ||
                (stubType === 'sunday' && selectedWorkerSundayCount >= 2)
              }
            >
              {isAssigning ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Issue Stub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
