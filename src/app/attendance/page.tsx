"use client";

import React, { useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card";
import { LogIn, LogOut, LoaderCircle, ShieldAlert } from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { format, subDays } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";
import type { Worker } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function generateToken() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AttendancePage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { canViewAttendance, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [localToken, setLocalToken] = useState<string | null>(null);

    // Live worker profile — needed for the persisted qrToken
    const workerDocRef = useMemoFirebase(() => user ? doc(firestore, 'workers', user.uid) : null, [firestore, user]);
    const { data: workerProfile } = useDoc<Worker>(workerDocRef);

    const attendanceQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, "attendance_records"), where('workerProfileId', '==', user.uid));
    }, [firestore, user]);

    const { data: allAttendance, isLoading: attendanceLoading } = useCollection<any>(attendanceQuery);

    const isLoading = attendanceLoading || isRoleLoading;

    // Unified QR — same token used for both Attendance and Meal Stubs
    const activeToken = localToken ?? workerProfile?.qrToken ?? user?.uid ?? '';
    // Use COG_USER prefix so BOTH scanners accept it
    const qrData = user ? `COG_USER:${user.uid}:${activeToken}` : '';
    const userQrCodeUrl = qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}` : '';

    const handleRegenerateQR = useCallback(async () => {
        if (!user) return;
        setIsRegenerating(true);
        try {
            const newToken = generateToken();
            await updateDoc(doc(firestore, 'workers', user.uid), { qrToken: newToken });
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
    }, [firestore, user, toast]);

    const attendanceLog = useMemo(() => {
        if (!allAttendance) return [];
        const oneWeekAgo = subDays(new Date(), 7);
        return allAttendance.filter((log: any) => {
            if (!log.time?.seconds) return false;
            return new Date(log.time.seconds * 1000) >= oneWeekAgo;
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
                            {attendanceLog && [...attendanceLog].sort((a: any, b: any) => (b.time?.seconds || 0) - (a.time?.seconds || 0)).map((log: any) => (
                                <div key={log.id} className="flex items-center space-x-4 p-3 rounded-lg bg-secondary/50">
                                    <div className={`p-2 rounded-full ${log.type === 'Clock In' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                        {log.type === 'Clock In' ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{log.type}</p>
                                        <p className="text-sm text-muted-foreground">{log.time ? format(new Date(log.time.seconds * 1000), 'EEE, p') : 'Just now'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

        </AppLayout>
    );
}
