"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ArrowLeft, LoaderCircle, User as UserIcon, SwitchCamera, History } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { ScrollArea } from "@studio/ui";
import { formatDistanceToNow, isToday } from "date-fns";
import { useWorkers } from "@/hooks/use-workers";
import { useAttendance } from "@/hooks/use-attendance";
import { useScanLogs } from "@/hooks/use-scan-logs";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { Tabs, TabsList, TabsTrigger } from "@studio/ui";
import jsQR from "jsqr";

export default function QRScannerPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [scannedWorker, setScannedWorker] = useState<any | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanMode, setScanMode] = useState<'Attendance' | 'Meal Stub'>('Attendance');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    const { workers: allWorkers, isLoading: workersLoading } = useWorkers();
    const { scanLogs, isLoading: logsLoading, createScanLog: createScanLogSql } = useScanLogs();
    const { createAttendanceRecord: createAttendanceSql } = useAttendance();
    const { mealStubs: allMealStubs, updateMealStub: updateMealStubSql } = useMealStubs();

    // Get camera devices on auth
    useEffect(() => {
        if (!isAuthenticated) return;

        if (typeof navigator.mediaDevices?.enumerateDevices === 'undefined') {
            toast({ variant: 'destructive', title: 'Camera Not Supported', description: 'Your browser does not support camera access.' });
            setHasCameraPermission(false);
            return;
        }

        const getDevices = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                setHasCameraPermission(true);
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0) setSelectedDeviceId(videoDevices[0].deviceId);
            } catch {
                setHasCameraPermission(false);
                toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions in your browser settings.' });
            }
        };
        getDevices();
    }, [isAuthenticated, toast]);

    const handleSwitchCamera = () => {
        if (devices.length < 2) return;
        const idx = devices.findIndex(d => d.deviceId === selectedDeviceId);
        setSelectedDeviceId(devices[(idx + 1) % devices.length].deviceId);
    };

    const resetScanner = useCallback(() => {
        setScannedWorker(null);
        setIsProcessing(false);
    }, []);

    const logScanEvent = useCallback(async (logData: any) => {
        try {
            await createScanLogSql({ ...logData, scannerId: 'public_scanner', scannerName: 'Public Kiosk Scanner' });
        } catch (e) {
            console.error("Failed to write to scan log", e);
        }
    }, [createScanLogSql]);

    const handleScan = useCallback(async (data: string) => {
        if (!data || isProcessing) return;
        setIsProcessing(true);

        const [type, payload, tokenOrTs] = data.split(':');
        const worker = allWorkers?.find(w => w.id === payload || w.workerId === payload);

        if (scanMode === 'Attendance') {
            if (type !== 'ATTENDANCE' && type !== 'STATIC' && type !== 'COG_USER' && type !== 'MEAL_STUB') {
                toast({ variant: 'destructive', title: 'Invalid QR Type', description: 'This QR code cannot be used for attendance.' });
                setTimeout(resetScanner, 2000);
                return;
            }
            if (!worker) {
                toast({ variant: 'destructive', title: 'Worker Not Found', description: 'The scanned ID does not correspond to any worker.' });
                setTimeout(resetScanner, 2000);
                return;
            }
            if (worker.employmentType !== 'Full-Time' && worker.employmentType !== 'On-Call') {
                toast({ variant: 'destructive', title: 'Attendance Restricted', description: 'Attendance clock-in is only available for Full-Time and On-Call personnel.' });
                setTimeout(resetScanner, 3000);
                return;
            }
            if (worker.qrToken && tokenOrTs && worker.qrToken !== tokenOrTs) {
                toast({ variant: 'destructive', title: 'Invalid or Expired QR', description: 'This QR code has been regenerated. Please use your latest QR code.' });
                setTimeout(resetScanner, 3000);
                return;
            }
            setScannedWorker(worker);
            return;
        }

        if (scanMode === 'Meal Stub') {
            if (type !== 'MEAL_STUB' && type !== 'COG_USER') {
                toast({ variant: 'destructive', title: 'Invalid QR Type', description: 'This QR code is not a Meal Stub.' });
                setTimeout(resetScanner, 2000);
                return;
            }
            try {
                if (worker?.qrToken && tokenOrTs && worker.qrToken !== tokenOrTs) {
                    toast({ variant: 'destructive', title: 'Invalid or Expired QR', description: 'This QR code has been regenerated. Please use your latest QR code.' });
                    setTimeout(resetScanner, 3000);
                    return;
                }
                if (tokenOrTs && !isNaN(parseInt(tokenOrTs)) && tokenOrTs.length > 10) {
                    const diffMins = (Date.now() - parseInt(tokenOrTs)) / 1000 / 60;
                    if (diffMins > 5) {
                        toast({ variant: 'destructive', title: 'QR Code Expired', description: 'Please refresh your meal stub QR code and try again.' });
                        setTimeout(resetScanner, 2000);
                        return;
                    }
                }
                const todaysStub = allMealStubs?.find(s => {
                    if (s.workerId !== payload && s.workerId !== worker?.id) return false;
                    if (s.status !== 'Issued') return false;
                    const d = s.date instanceof Date ? s.date : new Date(s.date);
                    return isToday(d);
                });
                if (todaysStub) {
                    await updateMealStubSql({ id: todaysStub.id, data: { status: 'Claimed', claimedAt: new Date() } });
                    const details = `Claimed meal stub for ${todaysStub.workerName}.`;
                    toast({ title: "Meal Stub Claimed!", description: details });
                    logScanEvent({ scanType: 'Meal Stub', details, mealStubId: todaysStub.id, targetUserId: todaysStub.workerId, targetUserName: todaysStub.workerName });
                } else {
                    const workerName = worker ? `${worker.firstName} ${worker.lastName}` : 'this user';
                    toast({ variant: "destructive", title: "No Meal Stub Found", description: `No valid meal stub found for ${workerName} for today.` });
                }
            } catch (e) {
                console.error("Error processing meal stub:", e);
                toast({ variant: "destructive", title: "Error", description: "Could not process meal stub scan." });
            } finally {
                setTimeout(resetScanner, 3000);
            }
            return;
        }

        toast({ variant: 'destructive', title: 'Unknown Scan', description: 'Invalid QR code format.' });
        setTimeout(resetScanner, 2000);
    }, [isProcessing, scanMode, allWorkers, allMealStubs, updateMealStubSql, toast, resetScanner, logScanEvent]);

    const handleRecordAttendance = useCallback(async (type: 'Clock In' | 'Clock Out') => {
        if (!scannedWorker?.id) return;
        try {
            await createAttendanceSql({ workerProfileId: scannedWorker.id, type });
            const details = `${type === 'Clock In' ? 'Timed in' : 'Timed out'} ${scannedWorker.firstName} ${scannedWorker.lastName}.`;
            toast({ title: "Success", description: details });
            logScanEvent({ scanType: 'Attendance', details, targetUserId: scannedWorker.id, targetUserName: `${scannedWorker.firstName} ${scannedWorker.lastName}` });
        } catch (e) {
            console.error("Failed to record attendance", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not record attendance.' });
        } finally {
            resetScanner();
        }
    }, [createAttendanceSql, logScanEvent, resetScanner, scannedWorker, toast]);

    // jsQR scan loop — start camera stream
    useEffect(() => {
        if (!isAuthenticated || !hasCameraPermission || !selectedDeviceId) return;

        const videoElement = videoRef.current;
        const canvas = canvasRef.current;
        if (!videoElement || !canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const scan = () => {
            if (videoElement.readyState >= 2 && !isProcessing && !scannedWorker) {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });
                if (code?.data) {
                    handleScan(code.data);
                    return;
                }
            }
            animFrameRef.current = requestAnimationFrame(scan);
        };

        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedDeviceId } },
                });
                streamRef.current = stream;
                videoElement.srcObject = stream;
                videoElement.play().catch(console.error);
                animFrameRef.current = requestAnimationFrame(scan);
            } catch (err) {
                console.error('Camera stream error:', err);
            }
        };

        start();

        return () => {
            cancelAnimationFrame(animFrameRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [selectedDeviceId, hasCameraPermission, isAuthenticated]);

    // Resume scanning after processing/worker dismissed
    useEffect(() => {
        if (isProcessing || scannedWorker) return;
        const videoElement = videoRef.current;
        const canvas = canvasRef.current;
        if (!videoElement || !canvas || !isAuthenticated || !hasCameraPermission) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const scan = () => {
            if (videoElement.readyState >= 2) {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });
                if (code?.data) {
                    handleScan(code.data);
                    return;
                }
            }
            animFrameRef.current = requestAnimationFrame(scan);
        };

        animFrameRef.current = requestAnimationFrame(scan);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [isProcessing, scannedWorker, isAuthenticated, hasCameraPermission, handleScan]);

    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="font-headline text-center text-2xl">Scanner Login</CardTitle>
                        <CardDescription className="text-center">Enter the kiosk password to activate the scanner.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (passwordInput === 'CogMain123') setIsAuthenticated(true);
                            else toast({ variant: 'destructive', title: 'Invalid Password', description: 'Incorrect kiosk password.' });
                        }} className="flex flex-col gap-4">
                            <input type="password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                placeholder="Scanner Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
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
                <div className="flex items-center gap-4">
                    <Tabs value={scanMode} onValueChange={(v: any) => setScanMode(v)} className="w-[300px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="Attendance">Attendance</TabsTrigger>
                            <TabsTrigger value="Meal Stub">Meal Stub</TabsTrigger>
                        </TabsList>
                    </Tabs>

                </div>
            </header>

            <main className="grid flex-grow grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 lg:p-8 overflow-hidden">
                <Card className="flex flex-col">
                    <CardHeader className="text-center">
                        <div className="flex justify-center"><ScanLine className="h-10 w-10 text-primary" /></div>
                        <CardTitle className="font-headline text-2xl">Live Scan</CardTitle>
                        <CardDescription>Position the QR code in the frame ({scanMode} Mode).</CardDescription>
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
                                        <Button onClick={() => handleRecordAttendance('Clock In')} size="lg">Time In</Button>
                                        <Button variant="destructive" onClick={() => handleRecordAttendance('Clock Out')} size="lg">Time Out</Button>
                                    </div>
                                </div>
                                <Button variant="link" onClick={resetScanner} className="mt-2">Scan another code</Button>
                            </div>
                        ) : (
                            <div className="w-full max-w-md">
                                <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden">
                                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                    {/* Hidden canvas for jsQR frame capture */}
                                    <canvas ref={canvasRef} className="hidden" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-64 h-64 border-4 border-dashed border-primary rounded-lg" />
                                    </div>
                                    {(isProcessing || workersLoading) && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <LoaderCircle className="h-8 w-8 animate-spin text-white" />
                                        </div>
                                    )}
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
                                    {hasCameraPermission === false && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Camera Access Required</AlertTitle>
                                            <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2 font-headline">
                            <History className="h-5 w-5" /> Recent Scans
                        </CardTitle>
                        <CardDescription>A log of the most recent scan events.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                        <ScrollArea className="h-full pr-4">
                            {logsLoading && <div className="flex justify-center items-center h-full"><LoaderCircle className="h-6 w-6 animate-spin" /></div>}
                            {!logsLoading && (!scanLogs || scanLogs.length === 0) && (
                                <p className="text-sm text-center text-muted-foreground py-4">No recent scans.</p>
                            )}
                            <div className="space-y-4">
                                {scanLogs?.map(log => {
                                    const logTime = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
                                    return (
                                        <div key={log.id} className="text-sm border-b pb-2 last:border-0">
                                            <p className="font-medium">{log.details}</p>
                                            <p className="text-xs text-muted-foreground">
                                                By {log.scannerName} &bull; {logTime ? formatDistanceToNow(logTime, { addSuffix: true }) : 'Just now'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
