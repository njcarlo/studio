import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera } from 'lucide-react';
// Capacitor removed for web build
// BarcodeScanner removed � using web camera only

export function ScannerModal({ onClose, onScan }: { onClose: () => void, onScan: (payload: string) => void }) {
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Use useCallback so we don't recreate the function on every render, avoiding stale closures where possible
  const tick = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      canvasRef.current.height = videoRef.current.videoHeight;
      canvasRef.current.width  = videoRef.current.videoWidth;
      const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        const code = (window as any).jsQR && (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code && code.data) {
          stopCamera();
          if (navigator.vibrate) navigator.vibrate(200);
          onScan(code.data);
          return;
        }
      }
    }
    if (videoRef.current?.srcObject) {
      requestAnimationFrame(tick);
    }
  }, [onScan, stopCamera]);

  const startWebCamera = async () => {
    setCameraActive(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      setError("Camera access denied. Ensure browser permissions are granted.");
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startWebCamera();
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-overlay" style={{ zIndex: 500 }}>
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Scan QR Code</h3>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Position the QR code within the frame</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px', backgroundColor: '#fef2f2' }}>{error}</div>}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {!cameraActive && !error && (
               <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                 <Camera size={32} />
               </div>
            )}
            <div style={{
              position: 'absolute', inset: '15%', border: '2px dashed rgba(255,255,255,0.7)',
              borderRadius: '12px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', pointerEvents: 'none'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

