"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@studio/ui";
import { LogIn, LogOut, LoaderCircle, ShieldAlert, Search } from "lucide-react";
import { useAuthStore } from "@studio/store";
import { format, subDays } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useAttendance } from "@/hooks/use-attendance";
import { useWorkers } from "@/hooks/use-workers";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { Tabs, TabsContent, TabsList, TabsTrigger, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Input, Badge } from "@studio/ui";
import { useSearchParams, useRouter } from "next/navigation";

function generateToken() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AttendancePage() {
    const { user } = useAuthStore();
    const { canViewAttendance, workerProfile, isLoading: isRoleLoading, isMinistryHead, canManageWorkers, canOperateScanner, isSuperAdmin, myMinistryIds } = useUserRole();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [localToken, setLocalToken] = useState<string | null>(null);
    const [assignSearch, setAssignSearch] = useState("");
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "view");
    
    const isAssigner = isMinistryHead || canManageWorkers || canOperateScanner;

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'assign' && isAssigner) {
            setActiveTab('assign');
        } else if (tab === 'view') {
            setActiveTab('view');
        }
    }, [searchParams, isAssigner]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        router.push(`/attendance?tab=${value}`);
    };

    const { workers: allWorkers } = useWorkers({ 
        enabled: isAssigner, 
        limit: 999999, 
    });
    const { createAttendanceRecord } = useAttendance({ enabled: false });

    const todayStart = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);
    const { createMealStub, mealStubs: assignedStubs } = useMealStubs({
        dateFrom: todayStart,
        enabled: isAssigner
    });
    const { updateWorker: updateWorkerSql } = useWorkers();

    const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);
    const { attendanceRecords: allAttendance, isLoading: attendanceLoading } = useAttendance(
        user?.id 
            ? { workerProfileId: user.id, dateFrom: sevenDaysAgo } 
            : { enabled: false }
    );

    const isLoading = attendanceLoading || isRoleLoading;

    // Unified QR — same token used for both Attendance and Meal Stubs
    const activeToken = localToken ?? workerProfile?.qrToken ?? workerProfile?.id ?? '';
    // Use COG_USER prefix so BOTH scanners accept it
    const qrData = workerProfile?.id ? `COG_USER:${workerProfile.id}:${activeToken}` : '';
    const userQrCodeUrl = qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}` : '';

    const handleRegenerateQR = useCallback(async () => {
        if (!workerProfile?.id) return;
        setIsRegenerating(true);
        try {
            const newToken = generateToken();
            await updateWorkerSql({ id: workerProfile.id, data: { qrToken: newToken } });
            setLocalToken(newToken);
            toast({
                title: "QR Code Regenerated",
                description: "Your old QR is now invalid. Use the new code for attendance and meal stubs.",
            });
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Failed to regenerate QR" });
        } finally {
            setIsRegenerating(false);
        }
    }, [workerProfile?.id, updateWorkerSql, toast]);

    const attendanceLog = useMemo(() => {
        if (!allAttendance) return [];
        const oneWeekAgo = subDays(new Date(), 7);
        return allAttendance.filter((log: any) => {
            const d = log.time instanceof Date ? log.time : new Date(log.time);
            return d >= oneWeekAgo;
        });
    }, [allAttendance]);

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
            </AppLayout>
        );
    }

    if (!canViewAttendance) {
        return (
            <AppLayout>
                <Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-headline font-bold">Attendance</h1>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="view">Personal Log</TabsTrigger>
                    {isAssigner && <TabsTrigger value="assign">Assign Attendance</TabsTrigger>}
                </TabsList>

                <TabsContent value="view" className="grid gap-6 md:grid-cols-2">
                    <Card className="flex flex-col items-center justify-center p-8">
                    <CardHeader className="text-center">
                        <CardTitle className="font-headline">Your QR Code</CardTitle>
                        <CardDescription>
                            This QR works for both <strong>Attendance</strong> and <strong>Meal Stubs</strong>.
                            Regenerate it if you think it's been compromised.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4">
                        {userQrCodeUrl ? (
                            <>
                                <div className="bg-white p-2 rounded-lg border">
                                    <Image src={userQrCodeUrl} alt="Your personal QR code" width={200} height={200} />
                                </div>
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
                                    ⚠️ Regenerating invalidates your current QR for all scanners
                                </p>
                            </>
                        ) : (
                            <LoaderCircle className="h-12 w-12 animate-spin" />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">This Week's Personal Log</CardTitle>
                        <CardDescription>Your time-in and time-out records for this week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && <LoaderCircle className="mx-auto h-6 w-6 animate-spin" />}
                        {!isLoading && attendanceLog && attendanceLog.length === 0 && (
                            <p className="text-center text-muted-foreground">No records for this week.</p>
                        )}
                        <div className="space-y-4">
                            {attendanceLog && [...attendanceLog].sort((a: any, b: any) => {
                                const da = a.time instanceof Date ? a.time : new Date(a.time);
                                const db = b.time instanceof Date ? b.time : new Date(b.time);
                                return db.getTime() - da.getTime();
                            }).map((log: any) => {
                                const logTime = log.time instanceof Date ? log.time : new Date(log.time);
                                return (
                                    <div key={log.id} className="flex items-center space-x-4 p-3 rounded-lg bg-secondary/50">
                                        <div className={`p-2 rounded-full ${log.type === 'Clock In' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {log.type === 'Clock In' ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{log.type === 'Clock In' ? 'Time In' : 'Time Out'}</p>
                                            <p className="text-sm text-muted-foreground">{logTime ? format(logTime, 'EEE, p') : 'Just now'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
                </TabsContent>

                {isAssigner && (
                    <TabsContent value="assign" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Manual Attendance</CardTitle>
                                <CardDescription>Manually time in or time out workers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative mb-6 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-9 h-10 w-full" placeholder="Search workers..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)} />
                                </div>
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Worker</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allWorkers?.filter(w => {
                                                const q = assignSearch.trim().toLowerCase();
                                                return !q || `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) || w.employmentType?.toLowerCase().includes(q);
                                            }).map(w => (
                                                <TableRow key={w.id}>
                                                    <TableCell className="font-medium">{w.firstName} {w.lastName}</TableCell>
                                                    <TableCell><Badge variant="outline" className="text-[10px]">{w.employmentType}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="outline" onClick={async () => {
                                                                await createAttendanceRecord({ workerProfileId: w.id, type: 'Clock In' }); // stored as 'Clock In'
                                                                
                                                                const hasStub = assignedStubs?.some((s: any) => {
                                                                    const sd = s.date instanceof Date ? s.date : new Date(s.date);
                                                                    return s.workerId === w.id && sd >= todayStart;
                                                                });

                                                                if (!hasStub) {
                                                                    try {
                                                                        await createMealStub({
                                                                            workerId: w.id,
                                                                            workerName: `${w.firstName} ${w.lastName}`,
                                                                            status: 'Issued',
                                                                            assignedBy: workerProfile?.id || user?.id,
                                                                            assignedByName: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.email || 'System'),
                                                                            stubType: 'daily'
                                                                        });
                                                                        toast({ title: 'Timed In', description: `Timed in ${w.firstName} ${w.lastName} and auto-issued 1 meal stub.` });
                                                                    } catch (e) {
                                                                        toast({ title: 'Timed In', description: `Timed in ${w.firstName} ${w.lastName}, but failed to auto-issue meal stub.` });
                                                                    }
                                                                } else {
                                                                    toast({ title: 'Timed In', description: `Timed in ${w.firstName} ${w.lastName} (meal stub already issued today).` });
                                                                }
                                                            }}>Time In</Button>
                                                            <Button size="sm" variant="destructive" onClick={async () => {
                                                                await createAttendanceRecord({ workerProfileId: w.id, type: 'Clock Out' });
                                                                toast({ title: 'Timed Out', description: `Timed out ${w.firstName} ${w.lastName}.` });
                                                            }}>Time Out</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

        </AppLayout>
    );
}
