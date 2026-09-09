"use client";

import React, { useState } from 'react';
import {
  QrCode,
  Camera,
  RefreshCw,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Badge,
} from '@studio/ui';
import { ScannerModal } from './scanner-modal';

interface StockScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: () => void;
}

export function StockScanModal({ isOpen, onClose, onStockUpdated }: StockScanModalProps) {
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleScanAPI = async (payload: string) => {
    if (!payload.trim()) return;
    setScanning(true);
    setError('');
    setSuccessMsg('');
    setScanResult(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payload.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Item not found for the provided code');
        return;
      }
      setScanResult(data);
    } catch {
      setError('Scan lookup failed. Check network connection.');
    } finally {
      setScanning(false);
      setIsCameraOpen(false);
    }
  };

  const handleStockUpdate = async (action: 'Stock In' | 'Stock Out') => {
    if (!scanResult?.item) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setScanning(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/inventory/items/${scanResult.item.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quantity: 1, notes: 'Scanned via Fast Action' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update stock');
        return;
      }

      setScanResult((prev: any) => ({
        ...prev,
        item: { ...prev.item, stock: data.updatedItem.stock, status: data.updatedItem.status },
      }));

      setSuccessMsg(`Successfully performed ${action} (+1)`);
      if (onStockUpdated) onStockUpdated();
    } catch {
      setError('Update failed. Check network connection.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      {isCameraOpen && (
        <ScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScan={(data) => {
            setQrInput(data);
            handleScanAPI(data);
          }}
        />
      )}

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Scan to Action
            </DialogTitle>
            <DialogDescription>
              Quickly scan an item code to look up stock and perform instant Stock In / Out.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Camera Trigger & Search Box */}
            <div className="p-4 border-2 border-dashed rounded-2xl bg-muted/20 flex flex-col items-center gap-3 text-center">
              <Button
                variant="default"
                size="sm"
                className="gap-2 shadow"
                onClick={() => setIsCameraOpen(true)}
              >
                <Camera className="h-4 w-4" />
                Open Live Camera Scanner
              </Button>

              <span className="text-xs text-muted-foreground">or type/paste barcode or item ID:</span>

              <div className="flex w-full gap-2">
                <Input
                  placeholder="e.g. EQP-2026-X1 or Item ID"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanAPI(qrInput)}
                  className="bg-background"
                />
                <Button
                  onClick={() => handleScanAPI(qrInput)}
                  disabled={scanning || !qrInput.trim()}
                  size="sm"
                >
                  {scanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {scanResult?.item && (
              <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
                <div className="p-4 bg-muted/40 border-b flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted border overflow-hidden flex items-center justify-center shrink-0">
                      {scanResult.item.imageUrl ? (
                        <img
                          src={scanResult.item.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm leading-snug">{scanResult.item.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{scanResult.item.inventoryCode || scanResult.item.id.slice(0, 8)}</span>
                        <span>&bull;</span>
                        <span>{scanResult.item.category?.name || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase">Stock</div>
                    <div className="text-xl font-extrabold text-foreground">{scanResult.item.stock}</div>
                  </div>
                </div>

                <div className="p-3 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1.5"
                    onClick={() => handleStockUpdate('Stock In')}
                    disabled={scanning}
                  >
                    <ArrowUpCircle className="h-4 w-4" /> Stock IN (+1)
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/50 gap-1.5"
                    onClick={() => handleStockUpdate('Stock Out')}
                    disabled={scanning || scanResult.item.stock <= 0}
                  >
                    <ArrowDownCircle className="h-4 w-4" /> Stock OUT (-1)
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
