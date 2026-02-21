"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { collection, serverTimestamp, doc, getDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ArrowLeft, LoaderCircle, User as UserIcon, SwitchCamera, History, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useMemoFirebase, useUser } from "@/firebase";
import type { Worker, ScanLog } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, isToday } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function QRScannerPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [scannedWorker, setScannedWorker] = useState<Worker | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanMode, setScanMode] = useState<'Attendance' | 'Meal Stub'>('Attendance');

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
    const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = useState(true);

    const firestore = useFirestore();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    const workersRef = useMemoFirebase(() => collection(firestore, "workers"), [firestore]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    const scanLogsQuery = useMemoFirebase(() => query(collection(firestore, "scan_logs"), orderBy('timestamp', 'desc'), limit(10)), [firestore]);
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

        if (isAuthenticated) {
            getDevices();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast, isAuthenticated]);

    const handleSwitchCamera = () => {
        if (devices.length < 2) return;

        const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        setSelectedDeviceId(devices[nextIndex].deviceId);
    };

    const resetScanner = useCallback(() => {
        setScannedWorker(null);
        setIsProcessing(false);
    }, []);

    const logScanEvent = useCallback(async (logData: Omit<ScanLog, 'id' | 'timestamp' | 'scannerId' | 'scannerName'>) => {
        try {
            await addDocumentNonBlocking(collection(firestore, "scan_logs"), {
                ...logData,
                scannerId: 'public_scanner',
                scannerName: `Public Kiosk Scanner`,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error("Failed to write to scan log", e);
        }
    }, [firestore]);

    const handleScan = useCallback(async (data: string) => {
        if (!data || isProcessing) return;

        setIsProcessing(true);

        // EXPECT DATA FORMAT: TYPE:ID[:TOKEN_OR_TIMESTAMP]
        const [type, payload, tokenOrTs] = data.split(':');

        if (scanMode === 'Attendance') {
            // Updated to accept ALL primary worker QR types for attendance
            if (type !== 'ATTENDANCE' && type !== 'STATIC' && type !== 'COG_USER' && type !== 'MEAL_STUB') {
                toast({ variant: 'destructive', title: 'Invalid QR Type', description: 'This QR code cannot be used for attendance.' });
                setTimeout(resetScanner, 2000);
                return;
            }

            const worker = workers?.find(w => w.id === payload || w.workerId === payload);
            if (worker) {
                // SECURITY CHECK: Verify if the token in the QR matches the one in DB
                // If the worker has a qrToken set, the scanned code MUST match it.
                if (worker.qrToken && tokenOrTs && worker.qrToken !== tokenOrTs) {
                    toast({
                        variant: 'destructive',
                        title: 'Invalid or Expired QR',
                        description: 'This QR code has been regenerated. Please use your latest QR code.',
                    });
                    setTimeout(resetScanner, 3000);
                    return;
                }

                setScannedWorker(worker);
            } else {
                toast({ variant: 'destructive', title: 'Worker Not Found', description: 'The scanned ID does not correspond to any worker.' });
                setTimeout(resetScanner, 2000);
            }
            return;
        }

        if (scanMode === 'Meal Stub') {
            if (type !== 'MEAL_STUB' && type !== 'COG_USER') {
                toast({ variant: 'destructive', title: 'Invalid QR Type', description: 'This QR code is not a Meal Stub.' });
                setTimeout(resetScanner, 2000);
                return;
            }

            try {
                const worker = workers?.find(w => w.id === payload || w.workerId === payload);

                // SECURITY CHECK: Verify if the token in the QR matches the one in DB
                if (worker?.qrToken && tokenOrTs && worker.qrToken !== tokenOrTs) {
                    toast({
                        variant: 'destructive',
                        title: 'Invalid or Expired QR',
                        description: 'This QR code has been regenerated. Please use your latest QR code.',
                    });
                    setTimeout(resetScanner, 3000);
                    return;
                }

                // If it's a dynamic meal stub from a direct generation (which used timestamps previously)
                // we check if it's numeric to maintain backward compatibility for a transition period if needed,
                // but primarily we are moving to qrTokens.
                if (tokenOrTs && !isNaN(parseInt(tokenOrTs)) && tokenOrTs.length > 10) {
                    const diffMins = (Date.now() - parseInt(tokenOrTs)) / 1000 / 60;
                    if (diffMins > 5) {
                        toast({ variant: 'destructive', title: 'QR Code Expired', description: 'Please refresh your meal stub QR code and try again.' });
                        setTimeout(resetScanner, 2000);
                        return;
                    }
                }

                const q = query(collection(firestore, "mealstubs"), where("workerId", "==", payload), where("status", "==", "Issued"));
                const querySnapshot = await getDocs(q);

                const todaysStubDoc = querySnapshot.docs.find(doc => {
                    const stub = doc.data();
                    return stub.date && isToday(new Date(stub.date.seconds * 1000));
                });

                if (todaysStubDoc) {
                    const stubData = todaysStubDoc.data();
                    await updateDocumentNonBlocking(todaysStubDoc.ref, { status: 'Claimed' });
                    const details = `Claimed meal stub for ${stubData.workerName}.`;
                    toast({ title: "Meal Stub Claimed!", description: details });
                    logScanEvent({ scanType: 'Meal Stub', details, mealStubId: todaysStubDoc.id, targetUserId: stubData.workerId, targetUserName: stubData.workerName });
                } else {
                    const worker = workers?.find(w => w.id === payload || w.workerId === payload);
                    const workerName = worker ? `${worker.firstName} ${worker.lastName}` : 'this user';
                    toast({ variant: "destructive", title: "No Meal Stub Found", description: `No valid, issued meal stub found for ${workerName} for today.` });
                }
            } catch (e) {
                console.error("Error processing meal stub:", e);
                toast({ variant: "destructive", title: "Error", description: "Could not process meal stub scan." });
            } finally {
                setTimeout(resetScanner, 3000);
            }
            return;
        }

        // Fallback for other QR code types that are not mode-dependent
        if (type === 'ROOM_CHECKIN') {
            toast({ title: 'Room Check-in Scanned', description: `Booking ID: ${payload}. (This feature is not yet fully implemented)` });
            setTimeout(resetScanner, 2000);
            return;
        }

        // If it's a raw UID but no mode is selected, or a mode is selected that doesn't handle it
        toast({ variant: 'destructive', title: 'Unknown Scan', description: 'Invalid QR code format.' });
        setTimeout(resetScanner, 2000);

    }, [isProcessing, scanMode, workers, firestore, toast, resetScanner, logScanEvent]);

    const handleRecordAttendance = useCallback((type: 'Clock In' | 'Clock Out') => {
        if (!scannedWorker || !scannedWorker.id) return;

        addDocumentNonBlocking(collection(firestore, "attendance_records"), {
            workerProfileId: scannedWorker.id,
            type,
            time: serverTimestamp(),
        });

        const details = `${type === 'Clock In' ? 'Clocked in' : 'Clocked out'} ${scannedWorker.firstName} ${scannedWorker.lastName}.`;
        toast({ title: "Success", description: details });

        logScanEvent({
            scanType: 'Attendance',
            details,
            targetUserId: scannedWorker.id,
            targetUserName: `${scannedWorker.firstName} ${scannedWorker.lastName}`,
        });

        resetScanner();
    }, [firestore, logScanEvent, resetScanner, scannedWorker, toast]);

    useEffect(() => {
        if (!isAuthenticated || !videoRef.current || !hasCameraPermission || !isBarcodeDetectorSupported || !selectedDeviceId) {
            return;
        }

        const videoElement = videoRef.current;
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        let stream: MediaStream;
        let animationFrameId: number;

        const detectQrCode = async () => {
            if (videoElement.readyState >= 2) { // HAVE_METADATA or more
                if (isProcessing || scannedWorker) {
                    animationFrameId = requestAnimationFrame(detectQrCode);
                    return;
                }

                try {
                    const barcodes = await barcodeDetector.detect(videoElement);
                    if (barcodes.length > 0 && barcodes[0].rawValue) {
                        handleScan(barcodes[0].rawValue);
                    }
                } catch (error) {
                    // This can happen if the stream is temporarily unavailable.
                    // The InvalidStateError is often transient. We'll just log it as a warning.
                    if (error instanceof Error && error.name === 'InvalidStateError') {
                        console.warn("Barcode detection failed for one frame:", error);
                    } else {
                        // For other errors, log them more prominently.
                        console.error("Barcode detection failed:", error);
                    }
                }
            }
            animationFrameId = requestAnimationFrame(detectQrCode);
        };

        const startStream = async () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const constraints = { video: { deviceId: { exact: selectedDeviceId } } };
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (videoElement) {
                    videoElement.srcObject = stream;
                    videoElement.play().catch(e => console.error("Video play failed", e));
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = requestAnimationFrame(detectQrCode);
                }
            } catch (err) {
                console.error('Error with camera stream:', err);
            }
        };

        startStream();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [selectedDeviceId, hasCameraPermission, isBarcodeDetectorSupported, isProcessing, scannedWorker, handleScan, isAuthenticated]);


    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="font-headline text-center 2xl">Scanner Login</CardTitle>
                        <CardDescription className="text-center">Enter the kiosk password to activate the scanner.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (passwordInput === 'c0g4@sm4!!!') {
                                setIsAuthenticated(true);
                            } else {
                                toast({ variant: 'destructive', title: 'Invalid Password', description: 'Incorrect kiosk password.' });
                            }
                        }} className="flex flex-col gap-4">
                            <input
                                type="password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                placeholder="Scanner Password"
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                            />
                            <Button type="submit">Unlock Scanner</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            <header className="flex items-center justify-between border-b p-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Attendance Scanner</h1>
                    <p className="text-sm text-muted-foreground">Scan QR codes for attendance.</p>
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
                            Position the QR code in the frame.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-grow items-center justify-center">
                        {scannedWorker ? (
                            <div className="flex flex-col items-center gap-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={scannedWorker.avatarUrl} alt={`${scannedWorker.firstName} ${scannedWorker.lastName}`} />
                                    <AvatarFallback><UserIcon className="h-12 w-12" /></AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <p className="text-lg font-semibold">{`${scannedWorker.firstName} ${scannedWorker.lastName}`}</p>
                                    <p className="text-sm text-muted-foreground">{scannedWorker.roleId}</p>
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
                                    {isProcessing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-white" /></div>}
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
