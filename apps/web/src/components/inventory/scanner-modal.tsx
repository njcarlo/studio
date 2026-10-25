"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Input } from '@studio/ui';
import { decodeQrFromImageData } from '@/lib/qr-decoder';

interface ScannerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onScan: (payload: string) => void;
}

export function ScannerModal({ isOpen = true, onClose, onScan }: ScannerModalProps) {
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const tick = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = await decodeQrFromImageData(imageData);

        if (code) {
          stopCamera();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
          }
          onScan(code);
          return;
        }
      }
    }

    if (streamRef.current) {
      animFrameIdRef.current = requestAnimationFrame(tick);
    }
  }, [onScan, stopCamera]);

  const startCamera = async () => {
    setError('');
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          if (playErr.name !== 'AbortError') {
            throw playErr;
          }
        }
        animFrameIdRef.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Camera access denied or unavailable. You can enter or scan code manually below.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setManualCode('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopCamera();
    onScan(manualCode.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-md max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-border/80 shadow-2xl bg-background [&>button:last-child]:hidden">
        {/* ── STICKY MODAL HEADER ── */}
        <div className="p-5 pb-4 border-b border-border/70 bg-card/80 backdrop-blur-md shrink-0 sticky top-0 z-10 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Camera className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold font-headline tracking-tight text-foreground">
                Quick Scan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                Point your camera at a QR code or barcode to scan, or type code below.
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer shrink-0 -mt-1 -mr-1"
            title="Close modal"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* ── MODAL BODY ── */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Camera Viewport Card */}
          <div className="p-3 rounded-2xl border border-border/70 bg-card/60 shadow-2xs space-y-3">
            <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              <canvas ref={canvasRef} className="hidden" />

              {!cameraActive && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-xs font-semibold">Starting camera...</span>
                </div>
              )}

              {/* Target Reticle */}
              <div className="absolute inset-[15%] border-2 border-dashed border-white/80 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Manual Input Fallback */}
          <div className="p-4 rounded-2xl border border-border/70 bg-card/60 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-headline">
              Manual Code Lookup
            </span>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                placeholder="Type or paste code here..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="text-xs h-9 rounded-xl border-border/70 bg-background flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!manualCode.trim()}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-sidebar hover:bg-sidebar/90 text-white cursor-pointer shadow-xs"
              >
                Enter
              </Button>
            </form>
          </div>
        </div>

        {/* ── STICKY MODAL FOOTER ── */}
        <div className="p-4 sm:p-5 border-t border-border/70 bg-card/95 backdrop-blur-md sticky bottom-0 z-10 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9 px-4 font-semibold border-border/80 hover:bg-muted/60 cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
