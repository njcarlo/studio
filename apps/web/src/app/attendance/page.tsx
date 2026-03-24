"use client";

import React, { useMemo, useState, useCallback } from "react";
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
import { LogIn, LogOut, LoaderCircle, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@studio/store";
import { format, subDays } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useAttendance } from "@/hooks/use-attendance";
import { useWorkers } from "@/hooks/use-workers";

function generateToken() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AttendancePage() {
    const { user } = useAuthStore();
    const { canViewAttendance, workerProfile, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [localToken, setLocalToken] = useState<string | null>(null);

    const { updateWorker: updateWorkerSql } = useWorkers();

    const { attendanceRecords: allAttendance, isLoading: attendanceLoading } = useAttendance(
        workerProfile?.id ? { workerProfileId: workerProfile.id } : {}
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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Attendance</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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
                        <CardDescription>Your clock-in and clock-out records for this week.</CardDescription>
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
                                            <p className="font-semibold">{log.type}</p>
                                            <p className="text-sm text-muted-foreground">{logTime ? format(logTime, 'EEE, p') : 'Just now'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

        </AppLayout>
    );
}
