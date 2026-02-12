"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { collection, serverTimestamp, doc, getDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ArrowLeft, LoaderCircle, User as UserIcon, SwitchCamera, History } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import type { User, ScanLog } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export default function QRScannerPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [scannedUser, setScannedUser] = useState<User | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
    const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = useState(true);
    
    const firestore = useFirestore();
    const { userProfile } = useUserRole();

    const usersRef = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<User>(usersRef);
    
    const scanLogsQuery = useMemoFirebase(() => {
        return query(collection(firestore, "scan_logs"), orderBy('timestamp', 'desc'), limit(10));
    }, [firestore]);
    const { data: scanLogs, isLoading: logsLoading } = useCollection<ScanLog>(scanLogsQuery);

    useEffect(() => {
        const getDevices = async () => {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);

            if (videoDevices.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(videoDevices[0].deviceId);
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

        if (typeof navigator.mediaDevices?.enumerateDevices === 'undefined') {
            toast({
                variant: 'destructive',
                title: 'Camera Not Supported',
                description: 'Your browser does not support camera access.',
            });
            setHasCameraPermission(false);
            return;
        }

        if (typeof (window as any).BarcodeDetector === 'undefined') {
            setIsBarcodeDetectorSupported(false);
            toast({
                variant: 'destructive',
                title: 'QR Scanner Not Supported',
                description: 'Your browser does not support built-in QR code scanning. Please use a recent version of Chrome or Edge.',
                duration: 5000,
            });
        }
    
        getDevices();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [toast]);
    
    useEffect(() => {
        if (selectedDeviceId && videoRef.current) {
            let stream: MediaStream;
            const constraints = {
                video: {
                    deviceId: { exact: selectedDeviceId }
                }
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(s => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error('Error switching camera:', err);
                });
            
            return () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        }
    }, [selectedDeviceId]);

    const handleSwitchCamera = () => {
        if (devices.length < 2) return;

        const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        setSelectedDeviceId(devices[nextIndex].deviceId);
    };

    const resetScanner = useCallback(() => {
        setScannedUser(null);
        setIsProcessing(false);
    }, []);

    const logScanEvent = useCallback(async (logData: Omit<ScanLog, 'id' | 'timestamp' | 'scannerId' | 'scannerName'>) => {
        if (!userProfile) return;
        try {
            await addDocumentNonBlocking(collection(firestore, "scan_logs"), {
                ...logData,
                scannerId: userProfile.id,
                scannerName: `${userProfile.firstName} ${userProfile.lastName}`,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error("Failed to write to scan log", e);
            // Do not show a toast for this, it's a background task.
        }
    }, [firestore, userProfile]);

    const handleScan = useCallback(async (data: string) => {
        if (!data || isProcessing) return;
        
        setIsProcessing(true);

        if (data.startsWith('MSTUB_')) {
            try {
                const q = query(collection(firestore, "mealstubs"), where("qrValue", "==", data));
                const querySnapshot = await getDocs(q);
    
                if (querySnapshot.empty) {
                    toast({ variant: "destructive", title: "Invalid Meal Stub", description: "This meal stub QR code is not valid or does not exist." });
                    setTimeout(() => resetScanner(), 3000);
                    return;
                }
    
                const stubDoc = querySnapshot.docs[0];
                const stubData = stubDoc.data();
    
                if (stubData.status === 'Issued') {
                    await updateDocumentNonBlocking(stubDoc.ref, { status: 'Claimed' });
                    const details = `Claimed meal stub for ${stubData.workerName}`;
                    toast({ title: "Meal Stub Claimed!", description: details });
                    logScanEvent({ scanType: 'Meal Stub', details, mealStubId: stubDoc.id, targetUserName: stubData.workerName, });
                } else {
                    toast({ variant: "destructive", title: "Stub Already Claimed", description: "This meal stub has already been used." });
                }
            } catch (e) {
                console.error("Error processing meal stub:", e);
                toast({ variant: "destructive", title: "Error", description: "Could not process meal stub." });
            } finally {
                setTimeout(() => resetScanner(), 3000);
            }
        }
        else if (data.startsWith('ROOM_CHECKIN:')) {
            const bookingId = data.split(':')[1];
            toast({ title: 'Room Check-in Scanned', description: `Booking ID: ${bookingId}. (This feature is not yet fully implemented)` });
            setTimeout(() => resetScanner(), 2000);
        }
        else {
            if (usersLoading) {
                toast({ title: "Please wait", description: "User data is still loading." });
                setIsProcessing(false);
                return;
            }
            const user = users?.find(w => w.id === data || w.workerId === data);
            if (user) {
                setScannedUser(user);
            } else {
                toast({ variant: 'destructive', title: 'User Not Found', description: 'The scanned ID does not correspond to any user.' });
                setTimeout(() => resetScanner(), 2000);
            }
        }
    }, [isProcessing, users, firestore, toast, usersLoading, resetScanner, logScanEvent]);

    const handleRecordAttendance = useCallback((type: 'Clock In' | 'Clock Out') => {
        if (!scannedUser) return;
        
        addDocumentNonBlocking(collection(firestore, "attendance_records"), {
            workerProfileId: scannedUser.id,
            type,
            time: serverTimestamp(),
        });
        
        const details = `${type === 'Clock In' ? 'Clocked in' : 'Clocked out'} ${scannedUser.firstName} ${scannedUser.lastName}.`;
        toast({ title: "Success", description: details });
        
        logScanEvent({
            scanType: 'Attendance',
            details,
            targetUserId: scannedUser.id,
            targetUserName: `${scannedUser.firstName} ${scannedUser.lastName}`,
        });
        
        resetScanner();
    }, [firestore, logScanEvent, resetScanner, scannedUser, toast]);

    useEffect(() => {
        if (!videoRef.current || !hasCameraPermission || !isBarcodeDetectorSupported || isProcessing || scannedUser) {
            return;
        }

        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        let animationFrameId: number;

        const detectQrCode = async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                    const barcodes = await barcodeDetector.detect(videoRef.current);
                    if (barcodes.length > 0 && barcodes[0].rawValue) {
                        handleScan(barcodes[0].rawValue);
                        return;
                    }
                } catch (error) {
                    console.error("Barcode detection failed:", error);
                }
            }
            animationFrameId = requestAnimationFrame(detectQrCode);
        };

        animationFrameId = requestAnimationFrame(detectQrCode);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [hasCameraPermission, isBarcodeDetectorSupported, isProcessing, scannedUser, handleScan, selectedDeviceId]);


    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
             <header className="flex items-center justify-between border-b p-4 shrink-0">
                 <div>
                    <h1 className="text-2xl font-headline font-bold">QR Scanner</h1>
                    <p className="text-sm text-muted-foreground">Scan QR codes for attendance and meal stubs.</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </header>

            <main className="grid flex-grow grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 lg:p-8 overflow-hidden">
                <Card className="flex flex-col">
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center">
                            <ScanLine className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl">Live Scan</CardTitle>
                        <CardDescription>
                            Position a QR code in the frame to scan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-grow items-center justify-center">
                        {scannedUser ? (
                            <div className="flex flex-col items-center gap-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={scannedUser.avatarUrl} alt={`${scannedUser.firstName} ${scannedUser.lastName}`} />
                                    <AvatarFallback><UserIcon className="h-12 w-12" /></AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <p className="text-lg font-semibold">{`${scannedUser.firstName} ${scannedUser.lastName}`}</p>
                                    <p className="text-sm text-muted-foreground">{scannedUser.roleId}</p>
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
                            <div className="w-full max-w-md">
                                <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden">
                                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-64 h-64 border-4 border-dashed border-primary rounded-lg" />
                                    </div>
                                    {isProcessing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-white"/></div>}
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-pulse" />
                                    
                                    {devices.length > 1 && (
                                        <div className="absolute bottom-4 right-4">
                                            <Button size="icon" onClick={handleSwitchCamera}>
                                                <SwitchCamera className="h-5 w-5" />
                                                <span className="sr-only">Switch Camera</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4">
                                    {hasCameraPermission === false ? (
                                        <Alert variant="destructive">
                                            <AlertTitle>Camera Access Required</AlertTitle>
                                            <AlertDescription>
                                                Please allow camera access to use this feature.
                                            </AlertDescription>
                                        </Alert>
                                    ) : !isBarcodeDetectorSupported ? (
                                        <Alert variant="destructive">
                                        <AlertTitle>Scanner Not Supported</AlertTitle>
                                        <AlertDescription>
                                            Your browser does not support built-in QR scanning. Try using Chrome or Edge.
                                        </AlertDescription>
                                    </Alert>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2 font-headline"><History className="h-5 w-5" /> Recent Scans</CardTitle>
                        <CardDescription>A log of the most recent scan events.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                        <ScrollArea className="h-full pr-4">
                             {logsLoading && <div className="flex justify-center items-center h-full"><LoaderCircle className="h-6 w-6 animate-spin" /></div>}
                            {!logsLoading && scanLogs && scanLogs.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-4">No recent scans.</p>
                            )}
                            <div className="space-y-4">
                                {scanLogs?.map(log => (
                                    <div key={log.id} className="text-sm">
                                        <p className="font-medium">{log.details}</p>
                                        <p className="text-xs text-muted-foreground">
                                            By {log.scannerName} &bull; {log.timestamp ? formatDistanceToNow(new Date(log.timestamp.seconds * 1000), { addSuffix: true }) : 'Just now'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
