"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ArrowLeft } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ScanMealStubPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

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

    const handleScan = (status: 'Issued' | 'Claimed') => {
        if (status === 'Issued') {
            toast({
                title: "Meal Stub Claimed!",
                description: "The meal stub has been successfully validated and claimed.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Stub Already Claimed",
                description: "This meal stub has already been used.",
            });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="absolute top-4 left-4">
                <Button asChild variant="ghost">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to App
                    </Link>
                </Button>
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center items-center mb-4">
                        <QrCode className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl">Scan Meal Stub</CardTitle>
                    <CardDescription>
                        Position the QR code inside the frame to validate a meal stub.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full aspect-square bg-slate-900 rounded-lg overflow-hidden my-4">
                       <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-64 h-64 border-4 border-dashed border-primary rounded-lg" />
                        </div>
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
                        <p>For demonstration purposes:</p>
                    </div>
                     <div className="flex justify-center gap-4 mt-2">
                        <Button onClick={() => handleScan('Issued')}>Simulate Valid Scan</Button>
                        <Button variant="outline" onClick={() => handleScan('Claimed')}>Simulate Claimed Scan</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
