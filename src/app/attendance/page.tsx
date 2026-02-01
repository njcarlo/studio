"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { QrCode, LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QrScannerDialog = ({ open, onOpenChange, onScanSuccess }: { open: boolean; onOpenChange: (open: boolean) => void, onScanSuccess: (type: 'Clock In' | 'Clock Out') => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Scan QR Code</DialogTitle>
          <DialogDescription>
            Position the QR code within the frame to record attendance.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden my-4">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-dashed border-primary rounded-lg" />
            </div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-pulse" />
        </div>
        <div className="flex justify-center gap-4">
            <Button onClick={() => { onScanSuccess('Clock In'); onOpenChange(false); }}>Simulate Clock-In</Button>
            <Button variant="destructive" onClick={() => { onScanSuccess('Clock Out'); onOpenChange(false); }}>Simulate Clock-Out</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function AttendancePage() {
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [attendanceLog, setAttendanceLog] = useState([
        { type: 'Clock In', time: new Date(new Date().setHours(8, 5, 0))},
        { type: 'Clock Out', time: new Date(new Date().setHours(12, 30, 0))},
        { type: 'Clock In', time: new Date(new Date().setHours(13, 15, 0))},
    ]);
    const { toast } = useToast();

    const handleScanSuccess = (type: 'Clock In' | 'Clock Out') => {
        setAttendanceLog(prev => [{type, time: new Date()}, ...prev]);
        toast({
            title: "Success",
            description: `You have successfully ${type === 'Clock In' ? 'clocked in' : 'clocked out'}.`,
        });
    }

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Attendance Tracking</h1>
      </div>

      <Card className="text-center p-8">
        <CardContent className="flex flex-col items-center justify-center gap-4">
            <QrCode className="w-24 h-24 text-primary"/>
            <p className="text-muted-foreground">Use the button below to scan a QR code for clock-in or clock-out.</p>
            <Button size="lg" onClick={() => setIsScannerOpen(true)}>
                Scan Attendance QR
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Today's Attendance Log</CardTitle>
            <CardDescription>Your clock-in and clock-out records for today.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {attendanceLog.map((log, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-secondary/50">
                        <div className={`p-2 rounded-full ${log.type === 'Clock In' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {log.type === 'Clock In' ? <LogIn className="h-5 w-5"/> : <LogOut className="h-5 w-5"/>}
                        </div>
                        <div>
                            <p className="font-semibold">{log.type}</p>
                            <p className="text-sm text-muted-foreground">{log.time.toLocaleTimeString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
      
      <QrScannerDialog open={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={handleScanSuccess} />

    </AppLayout>
  );
}
