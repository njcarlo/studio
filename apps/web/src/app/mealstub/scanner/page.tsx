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
import { formatDistanceToNow } from "date-fns";
import { getMealStubs, updateMealStub, createScanLog } from "@/actions/db";
import { useWorkers } from "@/hooks/use-workers";

type ScanLogEntry = { id: string; details: string; scannerName: string; timestamp: Date };

export default function QRScannerPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
    const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);

    const { workers } = useWorkers();

    useEffect(() => {
        if (!isAuthenticated) return;
        if (typeof (window as any).BarcodeDetector === 'undefined') {
            setIsBarcodeDetectorSupported(false);
            toast({ variant: 'destructive', title: 'QR Scanner Not Supported', description: 'Use Chrome or Edge for QR scanning.', duration: 5000 });
            return;
        }
        const getDevices = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                setHasCameraPermission(true);
                const all = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = all.filter(d => d.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0) setSelectedDeviceId(videoDevices[0].deviceId);
            } catch {
                setHasCameraPermission(false);
                toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Enable camera permissions to use this feature.' });
            }
        };
        getDevices();
    }, [isAuthenticated, toast]);

    const resetScanner = useCallback(() => setIsProcessing(false), []);

    const addLog = (details: string) => {
        setScanLogs(prev => [{ id: Date.now().toString(), details, scannerName: 'Public Kiosk', timestamp: new Date() }, ...prev].slice(0, 20));
    };

    const handleScan = useCallback(async (data: string) => {
        if (!data || isProcessing) return;
        setIsProcessing(true);

        const parts = data.split(':');
        const type = parts[0];
        const workerId = parts[1];
        const token = parts[2];

        if (type !== 'MEAL_STUB' && type !== 'COG_USER' && type !== 'ATTENDANCE') {
            toast({ variant: 'destructive', title: 'Invalid QR', description: 'This QR code is not valid for meal stubs.' });
            setTimeout(resetScanner, 2000);
            return;
        }

        try {
            const worker = workers?.find(w => w.id === workerId || w.workerId === workerId);

            // Token validation
            if (worker?.qrToken && token && worker.qrToken !== token) {
                toast({ variant: 'destructive', title: 'Invalid or Expired QR', description: 'Please use your latest QR code.' });
                setTimeout(resetScanner, 3000);
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch today's issued stubs for this worker
            const stubs = await getMealStubs({ workerId, dateFrom: today });
            const validStub = stubs.find(s => s.status === 'Issued');

            if (validStub) {
                await updateMealStub(validStub.id, { status: 'Claimed', claimedAt: new Date() });
                const workerName = worker ? `${worker.firstName} ${worker.lastName}` : workerId;
                const details = `Claimed meal stub for ${workerName}.`;
                toast({ title: 'Meal Stub Claimed!', description: details });
                addLog(details);
                await createScanLog({
                    scanType: 'Meal Stub',
                    details,
                    mealStubId: validStub.id,
                    targetUserId: workerId,
                    targetUserName: workerName,
                    scannerId: 'public_scanner',
                    scannerName: 'Public Kiosk Scanner',
                });
            } else {
                const workerName = worker ? `${worker.firstName} ${worker.lastName}` : 'this user';
                toast({ variant: 'destructive', title: 'No Meal Stub Found', description: `No valid meal stub for ${workerName} today.` });
                addLog(`No stub found for ${workerName}.`);
            }
        } catch (e: any) {
            console.error('Meal stub scan error:', e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not process meal stub scan.' });
        } finally {
            setTimeout(resetScanner, 3000);
        }
    }, [isProcessing, workers, toast, resetScanner]);

    // Camera + BarcodeDetector loop
    useEffect(() => {
        if (!isAuthenticated || !videoRef.current || !hasCameraPermission || !isBarcodeDetectorSupported || !selectedDeviceId) return;

        const videoElement = videoRef.current;
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        let stream: MediaStream;
        let animationFrameId: number;

        const detect = async () => {
            if (videoElement.readyState >= 2 && !isProcessing) {
                try {
                    const barcodes = await barcodeDetector.detect(videoElement);
                    if (barcodes.length > 0 && barcodes[0].rawValue) handleScan(barcodes[0].rawValue);
                } catch { /* ignore single frame errors */ }
            }
            animationFrameId = requestAnimationFrame(detect);
        };

        const start = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: selectedDeviceId } } });
                videoElement.srcObject = stream;
                videoElement.play().catch(console.error);
                animationFrameId = requestAnimationFrame(detect);
            } catch (err) { console.error('Camera stream error:', err); }
        };

        start();
        return () => {
            cancelAnimationFrame(animationFrameId);
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [selectedDeviceId, hasCameraPermission, isBarcodeDetectorSupported, isProcessing, handleScan, isAuthenticated]);

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
                            if (passwordInput === 'c0g4@sm4!!!') setIsAuthenticated(true);
                            else toast({ variant: 'destructive', title: 'Invalid Password' });
                        }} className="flex flex-col gap-4">
                            <input type="password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    <h1 className="text-2xl font-headline font-bold">Meal Stub Scanner</h1>
                    <p className="text-sm text-muted-foreground">Scan QR codes to claim meal stubs.</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
                </Button>
            </header>

            <main className="grid flex-grow grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 lg:p-8 overflow-hidden">
                <Card className="flex flex-col">
                    <CardHeader className="text-center">
                        <div className="flex justify-center"><ScanLine className="h-10 w-10 text-primary" /></div>
                        <CardTitle className="font-headline text-2xl">Live Scan</CardTitle>
                        <CardDescription>Position the QR code in the frame.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-grow items-center justify-center">
                        <div className="w-full max-w-md">
                            <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 border-4 border-dashed border-primary rounded-lg" />
                                </div>
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <LoaderCircle className="h-8 w-8 animate-spin text-white" />
                                    </div>
                                )}
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-pulse" />
                                {devices.length > 1 && (
                                    <div className="absolute bottom-4 right-4">
                                        <Button size="icon" onClick={() => {
                                            const idx = devices.findIndex(d => d.deviceId === selectedDeviceId);
                                            setSelectedDeviceId(devices[(idx + 1) % devices.length].deviceId);
                                        }}>
                                            <SwitchCamera className="h-5 w-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {hasCameraPermission === false && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                                </Alert>
                            )}
                            {!isBarcodeDetectorSupported && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertTitle>Scanner Not Supported</AlertTitle>
                                    <AlertDescription>Try using Chrome or Edge.</AlertDescription>
                                </Alert>
                            )}
                        </div>
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
                            {scanLogs.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No recent scans.</p>}
                            <div className="space-y-4">
                                {scanLogs.map(log => (
                                    <div key={log.id} className="text-sm">
                                        <p className="font-medium">{log.details}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {log.scannerName} &bull; {formatDistanceToNow(log.timestamp, { addSuffix: true })}
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
