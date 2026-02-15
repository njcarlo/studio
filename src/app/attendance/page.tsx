"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { collection, query, where } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { LogIn, LogOut, LoaderCircle } from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { format, subDays } from "date-fns";

export default function AttendancePage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const attendanceQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, "attendance_records"), where('workerProfileId', '==', user.uid));
    }, [firestore, user]);

    const { data: allAttendance, isLoading } = useCollection<any>(attendanceQuery);

    const attendanceLog = useMemo(() => {
        if (!allAttendance) return [];
        const oneWeekAgo = subDays(new Date(), 7);
        return allAttendance.filter(log => {
            if (!log.time?.seconds) return false;
            const logDate = new Date(log.time.seconds * 1000);
            return logDate >= oneWeekAgo;
        });
    }, [allAttendance]);

    const userQrCodeUrl = user ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(user.uid)}` : '';

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Attendance</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col items-center justify-center p-8">
            <CardHeader className="text-center">
                <CardTitle className="font-headline">Your Attendance QR Code</CardTitle>
                <CardDescription>Present this code to an admin to clock in or out.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                {userQrCodeUrl ? (
                    <Image src={userQrCodeUrl} alt="Your personal QR code for attendance" width={250} height={250} />
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
                    {attendanceLog && [...attendanceLog].sort((a,b) => (b.time?.seconds || 0) - (a.time?.seconds || 0)).map((log) => (
                        <div key={log.id} className="flex items-center space-x-4 p-3 rounded-lg bg-secondary/50">
                            <div className={`p-2 rounded-full ${log.type === 'Clock In' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {log.type === 'Clock In' ? <LogIn className="h-5 w-5"/> : <LogOut className="h-5 w-5"/>}
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
