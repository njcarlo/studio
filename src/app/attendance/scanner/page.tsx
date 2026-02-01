"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ArrowLeft, LoaderCircle, User, SwitchCamera } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import type { Worker } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function QRScannerPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [scannedWorker, setScannedWorker] = useState<Worker | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // New state for camera switching
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
    const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = useState(true);
    
    const firestore = useFirestore();

    const workersRef = useMemoFirebase(() => collection(firestore, "worker_profiles"), [firestore]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    // Effect to get permissions and enumerate devices
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
    
    // Effect to set up the stream when the selected device changes
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
            
            // Cleanup: stop the stream when the component unmounts or device changes
            return () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        }
    }, [selectedDeviceId]);

    const handleSwitchCamera = () => {
        if (devices.length < 2) return; // No other cameras to switch to

        const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        setSelectedDeviceId(devices[nextIndex].deviceId);
    };

    const resetScanner = useCallback(() => {
        setScannedWorker(null);
        setIsProcessing(false);
    }, []);

    const handleScan = useCallback(async (data: string) => {
        if (!data || isProcessing) return;
        
        setIsProcessing(true);

        // Meal Stub
        if (data.startsWith('MEALSTUB:')) {
            const stubId = data.split(':')[1];
            if (!stubId) {
                toast({ variant: 'destructive', title: 'Invalid Meal Stub QR Code' });
                setTimeout(() => resetScanner(), 2000);
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
                setTimeout(() => resetScanner(), 2000);
            }
        }
        // Room Check-in (placeholder)
        else if (data.startsWith('ROOM_CHECKIN:')) {
            const bookingId = data.split(':')[1];
            toast({ title: 'Room Check-in Scanned', description: `Booking ID: ${bookingId}. (This feature is not yet fully implemented)` });
            setTimeout(() => resetScanner(), 2000);
        }
        // Worker ID for Attendance
        else {
            if (workersLoading) {
                toast({ title: "Please wait", description: "Worker data is still loading." });
                setIsProcessing(false); // Allow re-scanning if data is not ready
                return;
            }
            const worker = workers?.find(w => w.id === data || w.workerId === data);
            if (worker) {
                setScannedWorker(worker);
            } else {
                toast({ variant: 'destructive', title: 'Worker Not Found', description: 'The scanned ID does not correspond to any worker.' });
                setTimeout(() => resetScanner(), 2000);
            }
        }
    }, [isProcessing, workers, firestore, toast, workersLoading, resetScanner]);

     // Effect for continuous QR code scanning
    useEffect(() => {
        if (!videoRef.current || !hasCameraPermission || !isBarcodeDetectorSupported || isProcessing || scannedWorker) {
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
                        return; // Stop scanning once a code is found and being processed
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
    }, [hasCameraPermission, isBarcodeDetectorSupported, isProcessing, scannedWorker, handleScan]);


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
                        Position a QR code in the frame to scan.
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
                                
                                {devices.length > 1 && (
                                    <div className="absolute bottom-4 right-4">
                                        <Button size="icon" onClick={handleSwitchCamera}>
                                            <SwitchCamera className="h-5 w-5" />
                                            <span className="sr-only">Switch Camera</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                            
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
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
