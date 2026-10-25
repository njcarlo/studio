"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import {
    ScanLine, ArrowLeft, LoaderCircle, User as UserIcon, SwitchCamera, History,
    CheckCircle2, AlertTriangle, LogIn, LogOut, RefreshCw, Zap, Eye, EyeOff, Lock
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { ScrollArea } from "@studio/ui";
import { formatDistanceToNow, isToday } from "date-fns";
import { useWorkers } from "@/hooks/use-workers";
import { useAttendance } from "@/hooks/use-attendance";
import { useScanLogs } from "@/hooks/use-scan-logs";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useAttendanceSettings } from "@/hooks/use-attendance-settings";
import { getWorkerByIdOrWorkerId } from "@/actions/db";
import jsQR from "jsqr";

interface AutoAttendanceScanResult {
    worker: any;
    action: 'Clock In' | 'Clock Out' | 'Cooldown';
    status?: string;
    statusBadgeColor?: 'emerald' | 'amber' | 'blue' | 'rose' | 'muted';
    message: string;
    time: Date;
    success: boolean;
}

export default function QRScannerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [scannedWorker, setScannedWorker] = useState<any | null>(null);
    const [scanResult, setScanResult] = useState<AutoAttendanceScanResult | null>(null);
    const [countdown, setCountdown] = useState<number>(5);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanMode, setScanMode] = useState<'Attendance' | 'Meal Stub'>('Attendance');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleBack = useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/attendance');
        }
    }, [router]);

    const { workers: allWorkers, isLoading: workersLoading } = useWorkers({ limit: 10000, unrestricted: true });
    const { scanLogs, isLoading: logsLoading, createScanLog: createScanLogSql } = useScanLogs(50, 'Attendance');
    const { createAttendanceRecord: createAttendanceSql, recordAutoAttendance: recordAutoAttendanceSql } = useAttendance();
    const { mealStubs: allMealStubs, updateMealStub: updateMealStubSql } = useMealStubs();
    const { settings: shiftSettings } = useAttendanceSettings();

    const requestCameraPermission = useCallback(async () => {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            toast({ variant: 'destructive', title: 'Camera Not Supported', description: 'Your browser or device does not support camera access.' });
            setHasCameraPermission(false);
            return;
        }

        try {
            const initialStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } }
            });
            initialStream.getTracks().forEach(t => t.stop());

            setHasCameraPermission(true);

            if (navigator.mediaDevices.enumerateDevices) {
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
                setDevices(videoDevices);

                const backCamera = videoDevices.find(d => {
                    const label = (d.label || '').toLowerCase();
                    return label.includes('back') || label.includes('rear') || label.includes('environment');
                });

                if (backCamera) {
                    setSelectedDeviceId(backCamera.deviceId);
                } else if (videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[0].deviceId);
                }
            }
        } catch (err) {
            console.error('Camera permission/access error:', err);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your device settings.',
            });
        }
    }, [toast]);

    // Get camera devices on auth
    useEffect(() => {
        if (!isAuthenticated) return;
        requestCameraPermission();
    }, [isAuthenticated, requestCameraPermission]);

    const handleSwitchCamera = () => {
        if (devices.length < 2) return;
        const idx = devices.findIndex(d => d.deviceId === selectedDeviceId);
        setSelectedDeviceId(devices[(idx + 1) % devices.length].deviceId);
    };

    // Audio chime generator using Web Audio API
    const playBeep = useCallback((type: 'success' | 'warning' | 'error') => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);

                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);
                gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.12);
                osc2.start(ctx.currentTime + 0.12);
                osc2.stop(ctx.currentTime + 0.26);
            } else if (type === 'warning') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }
        } catch {
            // Audio context failed or blocked by browser policy, ignore safely
        }
    }, []);

    const resetScanner = useCallback(() => {
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setScannedWorker(null);
        setScanResult(null);
        setCountdown(5);
        setIsProcessing(false);
    }, []);

    const logScanEvent = useCallback(async (logData: any) => {
        try {
            await createScanLogSql({ ...logData, scannerId: 'public_scanner', scannerName: 'Public Scanner' });
        } catch (e) {
            console.error("Failed to write to scan log", e);
        }
    }, [createScanLogSql]);

    const handleScan = useCallback(async (data: string) => {
        if (!data || isProcessing) return;
        setIsProcessing(true);

        let type = 'COG_USER';
        let payload = data.trim();
        let tokenOrTs: string | undefined = undefined;

        if (data.includes(':')) {
            const parts = data.split(':');
            type = parts[0];
            payload = parts[1] || parts[0];
            tokenOrTs = parts[2];
        }

        let worker = allWorkers?.find(w => w.id === payload || w.workerId === payload || w.email?.toLowerCase() === payload.toLowerCase());

        // Fallback: If not in memory cache (e.g. newly created account, or created while scanner was already open), lookup directly from DB
        if (!worker && payload) {
            try {
                worker = (await getWorkerByIdOrWorkerId(payload)) as any;
            } catch (err) {
                console.error("Direct worker lookup error:", err);
            }
        }

        if (scanMode === 'Attendance') {
            if (type !== 'ATTENDANCE' && type !== 'STATIC' && type !== 'COG_USER' && type !== 'MEAL_STUB') {
                playBeep('error');
                toast({ variant: 'destructive', title: 'Invalid QR Type', description: 'This QR code cannot be used for attendance.' });
                setTimeout(resetScanner, 2000);
                return;
            }
            if (!worker) {
                playBeep('error');
                toast({ variant: 'destructive', title: 'Worker Not Found', description: 'The scanned ID does not correspond to any worker.' });
                setTimeout(resetScanner, 2000);
                return;
            }
            if (worker.qrToken && tokenOrTs && worker.qrToken !== tokenOrTs) {
                playBeep('error');
                toast({ variant: 'destructive', title: 'Invalid or Expired QR', description: 'This QR code has been regenerated. Please use your latest QR code.' });
                setTimeout(resetScanner, 3000);
                return;
            }

            // --- AUTOMATIC HYBRID ATTENDANCE (Zero-click) ---
            try {
                const result = await recordAutoAttendanceSql(worker.id);

                if (result.action === 'Cooldown') {
                    playBeep('warning');
                    toast({
                        variant: 'destructive',
                        title: 'Cooldown Active',
                        description: result.message
                    });
                    setScanResult({
                        worker,
                        action: 'Cooldown',
                        status: 'Cooldown',
                        statusBadgeColor: 'amber',
                        message: result.message,
                        time: new Date(result.time),
                        success: false
                    });
                } else {
                    playBeep('success');
                    const details = `${result.action === 'Clock In' ? 'Timed in' : 'Timed out'} ${worker.firstName} ${worker.lastName} (${result.status}).`;
                    toast({
                        title: `${result.action} Successful!`,
                        description: details
                    });
                    logScanEvent({
                        scanType: 'Attendance',
                        details,
                        targetUserId: worker.id,
                        targetUserName: `${worker.firstName} ${worker.lastName}`
                    });
                    setScanResult({
                        worker,
                        action: result.action,
                        status: result.status,
                        statusBadgeColor: result.statusBadgeColor as any,
                        message: result.message,
                        time: new Date(result.time),
                        success: true
                    });
                }
            } catch (e: any) {
                console.error("Auto attendance error:", e);
                playBeep('error');
                toast({ variant: 'destructive', title: 'Attendance Error', description: e?.message || 'Could not record attendance.' });
                setTimeout(resetScanner, 2500);
                return;
            }

            // Auto-reset back to live scan after 5 seconds with live countdown
            setCountdown(5);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            resetTimeoutRef.current = setTimeout(() => {
                resetScanner();
            }, 5000);
            return;
        }

        if (scanMode === 'Meal Stub') {
            if (type !== 'MEAL_STUB' && type !== 'COG_USER') {
                playBeep('error');
                toast({ variant: 'destructive', title: 'Invalid QR Type', description: 'This QR code is not a Meal Stub.' });
                setTimeout(resetScanner, 2000);
                return;
            }
            try {
                if (worker?.qrToken && tokenOrTs && worker.qrToken !== tokenOrTs) {
                    playBeep('error');
                    toast({ variant: 'destructive', title: 'Invalid or Expired QR', description: 'This QR code has been regenerated. Please use your latest QR code.' });
                    setTimeout(resetScanner, 3000);
                    return;
                }
                if (tokenOrTs && typeof tokenOrTs === 'string' && /^\d{13}$/.test(tokenOrTs)) {
                    const diffMins = (Date.now() - parseInt(tokenOrTs, 10)) / 1000 / 60;
                    if (diffMins > 5) {
                        playBeep('warning');
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
                    playBeep('success');
                    const details = `Claimed meal stub for ${todaysStub.workerName}.`;
                    toast({ title: "Meal Stub Claimed!", description: details });
                    logScanEvent({ scanType: 'Meal Stub', details, mealStubId: todaysStub.id, targetUserId: todaysStub.workerId, targetUserName: todaysStub.workerName });
                } else {
                    playBeep('error');
                    const workerName = worker ? `${worker.firstName} ${worker.lastName}` : 'this user';
                    toast({ variant: "destructive", title: "No Meal Stub Found", description: `No valid meal stub found for ${workerName} for today.` });
                }
            } catch (e) {
                console.error("Error processing meal stub:", e);
                playBeep('error');
                toast({ variant: "destructive", title: "Error", description: "Could not process meal stub scan." });
            } finally {
                setTimeout(resetScanner, 3000);
            }
            return;
        }

        toast({ variant: 'destructive', title: 'Unknown Scan', description: 'Invalid QR code format.' });
        setTimeout(resetScanner, 2000);
    }, [isProcessing, scanMode, allWorkers, allMealStubs, updateMealStubSql, recordAutoAttendanceSql, toast, resetScanner, logScanEvent, playBeep]);

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
        if (!isAuthenticated || !hasCameraPermission) return;

        const videoElement = videoRef.current;
        if (!videoElement) return;

        let isSubscribed = true;

        const start = async () => {
            try {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                }

                const constraints: MediaStreamConstraints = {
                    video: selectedDeviceId
                        ? { deviceId: { ideal: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                        : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (!isSubscribed) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = stream;
                videoElement.srcObject = stream;
                videoElement.setAttribute('playsinline', 'true');
                videoElement.play().catch((err) => {
                    // Ignore AbortError when video is interrupted
                    if (err.name !== 'AbortError') {
                        console.error('Video play error:', err);
                    }
                });
            } catch (err) {
                console.error('Camera stream error:', err);
            }
        };

        start();

        return () => {
            isSubscribed = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, [selectedDeviceId, hasCameraPermission, isAuthenticated]);

    // Resume scanning after processing/worker dismissed
    useEffect(() => {
        if (isProcessing || scannedWorker || scanResult) return;
        const videoElement = videoRef.current;
        const canvas = canvasRef.current;
        if (!videoElement || !canvas || !isAuthenticated || !hasCameraPermission) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        let active = true;

        const scan = () => {
            if (!active) return;
            if (videoElement.readyState >= 2 && !isProcessing && !scannedWorker && !scanResult) {
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
        return () => {
            active = false;
            cancelAnimationFrame(animFrameRef.current);
        };
    }, [isProcessing, scannedWorker, scanResult, isAuthenticated, hasCameraPermission, handleScan]);

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-sm rounded-2xl border border-border/80 shadow-md">
                    <CardHeader className="text-center space-y-2 pb-4">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <ScanLine className="h-6 w-6" />
                        </div>
                        <CardTitle className="font-headline text-2xl font-bold">Attendance Scanner</CardTitle>
                        <CardDescription className="text-xs">
                            Enter the scanner password to unlock camera scanning.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const p = passwordInput.trim();
                                if (p === 'CogMain123' || p === '2026' || p === '1234') {
                                    setIsAuthenticated(true);
                                    toast({ title: 'Scanner Unlocked', description: 'Scanner is now active.' });
                                } else {
                                    toast({
                                        variant: 'destructive',
                                        title: 'Invalid Password',
                                        description: 'Incorrect scanner password.',
                                    });
                                }
                            }}
                            className="flex flex-col gap-3.5"
                        >
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 pr-10 text-sm shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Scanner Password (e.g. CogMain123 or 2026)"
                                    value={passwordInput}
                                    onChange={e => setPasswordInput(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                    tabIndex={-1}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <Button type="submit" className="rounded-xl h-10 font-bold">
                                Unlock Scanner
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="flex items-center justify-center gap-2 rounded-xl h-10 text-xs"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Attendance
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-background overflow-hidden">
            <header className="flex items-center justify-between border-b px-4 py-3 shrink-0 bg-card/60 backdrop-blur-xs">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
                        title="Back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2.5 min-w-0">
                        <h1 className="text-lg sm:text-xl font-headline font-bold tracking-tight text-foreground whitespace-nowrap">
                            Attendance Scanner
                        </h1>
                        <p className="text-xs text-muted-foreground truncate">
                            Scan QR codes for automatic attendance.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {devices.length > 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 rounded-xl text-xs"
                            onClick={handleSwitchCamera}
                        >
                            <SwitchCamera className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Switch Camera</span>
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => {
                            setIsAuthenticated(false);
                            setPasswordInput('');
                        }}
                        title="Lock Scanner"
                    >
                        <Lock className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Lock</span>
                    </Button>
                </div>
            </header>

            <main className="grid flex-1 grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden min-h-0">
                <Card className="flex flex-col overflow-hidden min-h-0">
                    <CardHeader className="text-center pb-2 shrink-0">
                        <div className="flex justify-center"><ScanLine className="h-6 w-6 text-primary" /></div>
                        <CardTitle className="font-headline text-lg sm:text-xl">Live Scan</CardTitle>
                        <CardDescription className="text-xs">
                            Position the QR code in the frame. System automatically records Time In / Time Out.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 items-center justify-center p-3 sm:p-4 overflow-hidden min-h-0">
                        {scanResult ? (
                            <div className="flex flex-col items-center justify-center p-4 text-center w-full max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200">
                                {/* Avatar & Badge Icon */}
                                <div className="relative mb-2">
                                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-xl ring-4 ring-offset-2 ring-primary/20">
                                        <AvatarImage src={scanResult.worker.avatarUrl} alt={`${scanResult.worker.firstName} ${scanResult.worker.lastName}`} />
                                        <AvatarFallback><UserIcon className="h-10 w-10 sm:h-12 sm:w-12" /></AvatarFallback>
                                    </Avatar>
                                    <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-lg text-white ${scanResult.action === 'Clock In'
                                            ? 'bg-emerald-600'
                                            : scanResult.action === 'Clock Out'
                                                ? 'bg-blue-600'
                                                : 'bg-amber-600'
                                        }`}>
                                        {scanResult.action === 'Clock In' ? (
                                            <LogIn className="h-4 w-4" />
                                        ) : scanResult.action === 'Clock Out' ? (
                                            <LogOut className="h-4 w-4" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4" />
                                        )}
                                    </div>
                                </div>

                                {/* Worker Name & Role */}
                                <h2 className="text-lg font-headline font-bold text-foreground">
                                    {scanResult.worker.firstName} {scanResult.worker.lastName}
                                </h2>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                                    {scanResult.worker.roleId || scanResult.worker.employmentType || 'Personnel'}
                                </p>

                                {/* Action & Status Card */}
                                <div className={`w-full rounded-xl p-3 border mb-3 flex flex-col items-center gap-1 shadow-sm ${scanResult.action === 'Clock In'
                                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                        : scanResult.action === 'Clock Out'
                                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                                            : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                                    }`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${scanResult.action === 'Clock In'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                            : scanResult.action === 'Clock Out'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                        }`}>
                                        {scanResult.action === 'Clock In' ? '✓ TIMED IN' : scanResult.action === 'Clock Out' ? '✓ TIMED OUT' : '⚠ COOLDOWN ACTIVE'}
                                    </span>

                                    <span className="text-2xl font-extrabold font-mono tracking-tight text-foreground my-0.5">
                                        {scanResult.time ? new Date(scanResult.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : ''}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <Badge variant={
                                            scanResult.status === 'On Time' || scanResult.status === 'Shift Completed'
                                                ? 'success'
                                                : scanResult.status === 'Late' || scanResult.status === 'Undertime'
                                                    ? 'warning'
                                                    : 'secondary'
                                        }>
                                            {scanResult.status || 'Recorded'}
                                        </Badge>
                                    </div>

                                    <p className="text-[11px] text-muted-foreground mt-0.5 px-2 text-center leading-relaxed">
                                        {scanResult.message}
                                    </p>
                                </div>

                                {/* Auto-reset indicator */}
                                <div className="w-full flex flex-col items-center gap-1.5">
                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-primary h-full transition-all duration-1000 ease-linear"
                                            style={{ width: `${(countdown / 5) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <RefreshCw className="h-3 w-3 animate-spin text-primary" /> Auto-resetting in {countdown}s...
                                    </p>
                                    <Button variant="ghost" size="sm" onClick={resetScanner} className="text-xs text-primary hover:underline h-6 mt-0.5">
                                        Scan next worker now →
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center">
                                <div className="relative w-full max-w-[260px] sm:max-w-xs aspect-square mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
                                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                    {/* Hidden canvas for jsQR frame capture */}
                                    <canvas ref={canvasRef} className="hidden" />

                                    {/* Viewfinder matching Image 2 right side: dashed square with rounded corners and glowing red laser line */}
                                    <div className="absolute inset-0 flex items-center justify-center p-5 pointer-events-none">
                                        <div className="w-full h-full border-2 border-dashed border-white/70 rounded-3xl relative flex items-center justify-center">
                                            {/* Confined red laser scanning line with pulsing glow */}
                                            <div className="w-[90%] h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" />
                                        </div>
                                    </div>
                                    {(isProcessing || workersLoading) && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <LoaderCircle className="h-8 w-8 animate-spin text-white" />
                                        </div>
                                    )}
                                    {devices.length > 1 && (
                                        <div className="absolute bottom-3 right-3">
                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80" onClick={handleSwitchCamera}>
                                                <SwitchCamera className="h-4 w-4" />
                                                <span className="sr-only">Switch Camera</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 w-full max-w-xs">
                                    {hasCameraPermission === false && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Camera Access Required</AlertTitle>
                                            <AlertDescription className="space-y-2 mt-1">
                                                <p>Please allow camera access to use this feature.</p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={requestCameraPermission}
                                                    className="gap-1.5 text-xs bg-background hover:bg-muted text-foreground"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                    Retry Camera Access
                                                </Button>
                                            </AlertDescription>
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
