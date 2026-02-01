"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ArrowLeft, LoaderCircle, User } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import type { Worker } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function QRScannerPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [scannedData, setScannedData] = useState('');
    const [scannedWorker, setScannedWorker] = useState<Worker | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const firestore = useFirestore();

    const workersRef = useMemoFirebase(() => collection(firestore, "worker_profiles"), [firestore]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
    
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings to use this feature.',
            });
          }
        };
    
        getCameraPermission();
      }, [toast]);

    const resetScanner = () => {
        setScannedData('');
        setScannedWorker(null);
        setIsProcessing(false);
    };

    const handleScan = async (data: string) => {
        if (!data || isProcessing) return;
        
        setIsProcessing(true);

        // Meal Stub
        if (data.startsWith('MEALSTUB:')) {
            const stubId = data.split(':')[1];
            if (!stubId) {
                toast({ variant: 'destructive', title: 'Invalid Meal Stub QR Code' });
                resetScanner();
                return;
            }
            const stubRef = doc(firestore, "mealstubs", stubId);
            try {
                const stubDoc = await getDoc(stubRef);
                if (stubDoc.exists() && stubDoc.data().status === 'Issued') {
                    updateDocumentNonBlocking(stubRef, { status: 'Claimed' });
                    toast({ title: "Meal Stub Claimed!", description: "The meal stub has been successfully validated." });
                } else {
                    toast({ variant: "destructive", title: "Stub Already Claimed or Invalid", description: "This meal stub has already been used or does not exist." });
                }
            } catch (e) {
                toast({ variant: "destructive", title: "Error", description: "Could not process meal stub." });
            } finally {
                resetScanner();
            }
        }
        // Room Check-in (placeholder)
        else if (data.startsWith('ROOM_CHECKIN:')) {
            const bookingId = data.split(':')[1];
            toast({ title: 'Room Check-in Scanned', description: `Booking ID: ${bookingId}. (This feature is not yet fully implemented)` });
            resetScanner();
        }
        // Worker ID for Attendance
        else {
            if (workersLoading) {
                toast({ title: "Please wait", description: "Worker data is still loading." });
                setIsProcessing(false);
                return;
            }
            const worker = workers?.find(w => w.id === data || w.workerId === data);
            if (worker) {
                setScannedWorker(worker);
            } else {
                toast({ variant: 'destructive', title: 'Worker Not Found', description: 'The scanned ID does not correspond to any worker.' });
                setScannedData('');
            }
            setIsProcessing(false);
        }
    };

    const handleRecordAttendance = (type: 'Clock In' | 'Clock Out') => {
        if (!scannedWorker) return;
        
        const newRecord = {
            workerProfileId: scannedWorker.id,
            type,
            time: serverTimestamp(),
        };

        addDocumentNonBlocking(collection(firestore, "attendance_records"), newRecord);
        
        toast({
            title: "Success",
            description: `Worker ${scannedWorker.firstName} has been ${type === 'Clock In' ? 'clocked in' : 'clocked out'}.`,
        });
        resetScanner();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="absolute top-4 left-4">
                <Button asChild variant="ghost">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center items-center mb-4">
                        <ScanLine className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl">QR Scanner</CardTitle>
                    <CardDescription>
                        Position a QR code in the frame, or enter an ID manually.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {scannedWorker ? (
                         <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={scannedWorker.avatarUrl} alt={`${scannedWorker.firstName} ${scannedWorker.lastName}`} />
                                <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <p className="text-lg font-semibold">{`${scannedWorker.firstName} ${scannedWorker.lastName}`}</p>
                                <p className="text-sm text-muted-foreground">{scannedWorker.role}</p>
                            </div>
                            <div className="w-full border-t pt-4 mt-2">
                                <p className="text-center text-sm font-medium mb-4">Select attendance action:</p>
                                <div className="flex justify-center gap-4">
                                    <Button onClick={() => handleRecordAttendance('Clock In')} size="lg">Clock In</Button>
                                    <Button variant="destructive" onClick={() => handleRecordAttendance('Clock Out')} size="lg">Clock Out</Button>
                                </div>
                            </div>
                            <Button variant="link" onClick={resetScanner} className="mt-2">Scan another code</Button>
                        </div>
                    ) : (
                        <>
                            <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden my-4">
                               <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 border-4 border-dashed border-primary rounded-lg" />
                                </div>
                                {isProcessing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-white"/></div>}
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-pulse" />
                            </div>
                            
                            {hasCameraPermission === false && (
                                 <Alert variant="destructive">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>
                                        Please allow camera access to use this feature.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                <p>Or enter data manually:</p>
                            </div>
                            <div className="grid gap-2 mt-2">
                                <Label htmlFor="qr-data">Scanned Data</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="qr-data"
                                        placeholder="Paste data from QR code"
                                        value={scannedData}
                                        onChange={(e) => setScannedData(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                    <Button onClick={() => handleScan(scannedData)} disabled={isProcessing || !scannedData}>
                                        {isProcessing ? <LoaderCircle className="animate-spin" /> : "Process"}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
