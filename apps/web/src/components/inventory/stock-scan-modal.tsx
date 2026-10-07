"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  CheckCircle2,
  Plus,
  Minus,
  ScanBarcode,
  ArrowLeftRight,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  MapPin,
  Tag,
  Layers,
  ArrowRight,
  Camera,
  X,
  ImageIcon,
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
import { cn } from '@/lib/utils';

interface StockScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: () => void;
  initialCode?: string;
  activeTab?: string;
  onSwitchTab?: (tab: string) => void;
}

export function StockScanModal({
  isOpen,
  onClose,
  onStockUpdated,
  initialCode,
  activeTab = 'items',
  onSwitchTab,
}: StockScanModalProps) {
  const [qrInput, setQrInput] = useState(initialCode || '');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Stock In / Out state (for Item QR)
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Borrowing Return state (for Borrowing QR)
  const [returnCondition, setReturnCondition] = useState('Good Condition');
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [damagePhoto, setDamagePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const isBorrowingsTab = activeTab === 'borrowings';

  // Validation mismatch checks
  const isItemOnBorrowingsScreen = isBorrowingsTab && scanResult?.qrType === 'ITEM';
  const isBorrowingOnItemsScreen = !isBorrowingsTab && scanResult?.qrType === 'BORROWING';
  const hasTypeMismatch = isItemOnBorrowingsScreen || isBorrowingOnItemsScreen;

  useEffect(() => {
    if (initialCode && isOpen) {
      setQrInput(initialCode);
      handleScanAPI(initialCode);
    }
  }, [initialCode, isOpen]);

  useEffect(() => {
    if (isOpen && !scanResult) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scanResult]);

  const handleResetScan = () => {
    setScanResult(null);
    setQrInput('');
    setError('');
    setSuccessMsg('');
    setQuantity(1);
    setNotes('');
    setReturnCondition('Good Condition');
    setReturnNotes('');
    setDamagePhoto(null);
    setIsUploadingPhoto(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Photo size exceeds 15MB limit.');
      return;
    }

    setIsUploadingPhoto(true);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setDamagePhoto(compressed);
          } else {
            setDamagePhoto(reader.result as string);
          }
          setIsUploadingPhoto(false);
        };
        img.onerror = () => {
          setDamagePhoto(reader.result as string);
          setIsUploadingPhoto(false);
        };
        img.src = reader.result;
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
        setError(data.error || 'No matching Item or Borrowing transaction found for this code.');
        return;
      }
      setScanResult(data);
      setQuantity(1);
    } catch {
      setError('Scan lookup failed. Check network connection.');
    } finally {
      setScanning(false);
    }
  };

  // Stock In / Out handler (Item QR)
  const handleStockUpdate = async (action: 'Stock In' | 'Stock Out') => {
    if (!scanResult?.item) return;
    const qty = Math.max(1, Number(quantity) || 1);

    if (action === 'Stock Out' && scanResult.item.stock < qty) {
      setError(`Cannot stock out ${qty} units. Only ${scanResult.item.stock} available in stock.`);
      return;
    }

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
        body: JSON.stringify({
          action,
          quantity: qty,
          notes: notes.trim() || `Scanned via Item QR (${action === 'Stock In' ? '+' : '-'}${qty})`,
        }),
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

      setSuccessMsg(
        `Successfully ${action === 'Stock In' ? 'added' : 'deducted'} ${qty} ${scanResult.item.unit || 'pcs'}. New available stock: ${data.updatedItem.stock}`
      );
      if (onStockUpdated) onStockUpdated();
    } catch {
      setError('Stock update failed. Check network connection.');
    } finally {
      setScanning(false);
    }
  };

  // Borrowing Return handler (Borrowing QR)
  const handleReturnSubmit = async () => {
    if (!scanResult?.borrowing) return;
    const isDamaged = returnCondition === 'Damaged';

    if (isDamaged && !damagePhoto) {
      setError('Kinakailangan ng photo evidence bago mai-record ang damaged return. Mangyaring kumuha o mag-upload ng litrato.');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setSubmittingReturn(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/borrowings/${scanResult.borrowing.id}/return`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnNotes: returnNotes.trim() || 'Scanned Borrowing QR check-in return',
          returnCondition,
          damaged: isDamaged,
          returnPhotos: damagePhoto ? [damagePhoto] : [],
          quantity: scanResult.borrowing.quantity || 1,
        }),
      });

      const returnData = await res.json();
      if (!res.ok) {
        throw new Error(returnData.error || 'Failed to process return');
      }

      const borrowerName = scanResult.borrowing.borrowerName;
      const itemName = scanResult.borrowing.item.name;

      if (isDamaged) {
        setSuccessMsg(
          `⚠️ Notice: Equipment "${itemName}" returned by ${borrowerName} and flagged as DAMAGED! Photo evidence saved to database.`
        );
      } else {
        setSuccessMsg(
          `Equipment "${itemName}" returned by ${borrowerName} and restored to available stock!`
        );
      }

      // Mark local borrowing status as RETURNED with database persisted data
      setScanResult((prev: any) => ({
        ...prev,
        borrowing: {
          ...prev.borrowing,
          status: 'RETURNED',
          returnedAt: returnData.returnedAt || new Date(),
          returnCondition: returnData.returnCondition || returnCondition,
          returnNotes: returnData.returnNotes || returnNotes,
          returnPhotos: returnData.returnPhotos || (damagePhoto ? [damagePhoto] : []),
        },
      }));

      if (onStockUpdated) onStockUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to process return');
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleResetScan();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBorrowingsTab ? (
              <>
                <ArrowLeftRight className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <span>Scan Borrowing QR</span>
              </>
            ) : (
              <>
                <ScanBarcode className="h-5 w-5 text-primary" />
                <span>Scan Item QR</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBorrowingsTab
              ? 'Scan a Borrowing Transaction QR (BORROW-...) to verify records and process returns.'
              : 'Scan an Item QR (ITEM-...) to inspect stock levels, condition, and catalog details.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Direct Handheld Barcode Input (Auto-focused, No Camera needed) */}
          {!scanResult && (
            <div className="p-4 border border-border/80 rounded-2xl bg-muted/20 flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {isBorrowingsTab
                    ? 'Ready for Borrowing QR (e.g. BORROW-2026-...)'
                    : 'Ready for Item QR (e.g. ITEM-...)'}
                </span>
              </div>

              <div className="flex w-full gap-2">
                <Input
                  ref={inputRef}
                  placeholder={
                    isBorrowingsTab
                      ? 'Scan Borrowing QR (e.g. BORROW-...)'
                      : 'Scan Item QR (e.g. ITEM-EQP-...)'
                  }
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanAPI(qrInput)}
                  className="bg-background text-xs font-mono h-10 shadow-2xs"
                  autoFocus
                />
                <Button
                  onClick={() => handleScanAPI(qrInput)}
                  disabled={scanning || !qrInput.trim()}
                  size="sm"
                  className="h-10 px-4 cursor-pointer"
                >
                  {scanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Point handheld scanner at the barcode/QR code or press Enter after typing.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* VALIDATION SCREEN 1: TYPE MISMATCH WARNING                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {hasTypeMismatch && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    QR Type Mismatch Detected
                  </div>
                  {isItemOnBorrowingsScreen ? (
                    <p className="text-xs leading-relaxed">
                      You scanned an <strong>Item QR</strong> (<span className="font-mono">{scanResult.item.itemQrCode}</span>). The <strong>Borrowings</strong> screen strictly requires a <strong>Borrowing Transaction QR</strong> (e.g. <span className="font-mono">BORROW-...</span>) to process equipment returns.
                    </p>
                  ) : (
                    <p className="text-xs leading-relaxed">
                      You scanned a <strong>Borrowing Transaction QR</strong> (<span className="font-mono">{scanResult.borrowing.borrowingCode}</span>). The <strong>Items &amp; Catalog</strong> screen strictly requires an <strong>Item QR</strong> (e.g. <span className="font-mono">ITEM-...</span>) for catalog stock adjustments.
                    </p>
                  )}
                </div>
              </div>

              {/* Resolution Action Buttons */}
              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                {isItemOnBorrowingsScreen && onSwitchTab && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 text-xs font-bold gap-1.5 bg-sidebar hover:bg-sidebar/90 text-white rounded-xl shadow-xs cursor-pointer flex-1"
                    onClick={() => {
                      onSwitchTab('items');
                      handleResetScan();
                    }}
                  >
                    <span>Switch to Items &amp; Catalog</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                {isBorrowingOnItemsScreen && onSwitchTab && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 text-xs font-bold gap-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs cursor-pointer flex-1"
                    onClick={() => {
                      onSwitchTab('borrowings');
                      handleResetScan();
                    }}
                  >
                    <span>Switch to Borrowings Tab</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-semibold rounded-xl cursor-pointer"
                  onClick={handleResetScan}
                >
                  Scan Correct QR
                </Button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* VIEW A: ITEM / CATALOG QR (Stock Monitoring Only)             */}
          {/* ───────────────────────────────────────────────────────────── */}
          {!hasTypeMismatch && scanResult?.qrType === 'ITEM' && scanResult.item && (
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs animate-in fade-in duration-300">
              {/* Item Card Header */}
              <div className="p-4 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-muted border overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
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
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-foreground leading-snug truncate">
                      {scanResult.item.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-mono font-bold text-primary">
                        {scanResult.item.itemQrCode || `ITEM-${scanResult.item.inventoryCode}`}
                      </span>
                      <span>&bull;</span>
                      <span>{scanResult.item.category || 'General'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Stock</div>
                  <div className="text-2xl font-black font-headline text-foreground leading-none mt-0.5">
                    {scanResult.item.stock}{' '}
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {scanResult.item.unit || 'pcs'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item Metadata Specs Grid */}
              <div className="p-3 bg-muted/20 border-b border-border/60 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-background rounded-xl border border-border/60">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Availability</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold mt-1 px-2 py-0",
                      scanResult.item.stock > 0
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-destructive/15 text-destructive border-destructive/30"
                    )}
                  >
                    {scanResult.item.availability || (scanResult.item.stock > 0 ? 'Available' : 'Out of Stock')}
                  </Badge>
                </div>

                <div className="p-2 bg-background rounded-xl border border-border/60">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Location</span>
                  <div className="font-bold text-foreground truncate mt-1 text-[11px] flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>{scanResult.item.location || 'Main Storage'}</span>
                  </div>
                </div>

                <div className="p-2 bg-background rounded-xl border border-border/60">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Condition</span>
                  <span className="font-bold text-foreground truncate mt-1 text-[11px] block">
                    {scanResult.item.condition || 'Good Condition'}
                  </span>
                </div>
              </div>

              {/* Stock In / Stock Out Controls */}
              <div className="p-4 space-y-3.5 bg-card">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Quantity to Stock In / Out
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Unit: <strong className="text-foreground">{scanResult.item.unit || 'pcs'}</strong>
                    </span>
                  </div>

                  {/* Stepper Input */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl cursor-pointer shrink-0"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={scanning || quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="h-10 text-center font-black font-headline text-base rounded-xl bg-background"
                      disabled={scanning}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl cursor-pointer shrink-0"
                      onClick={() => setQuantity((q) => q + 1)}
                      disabled={scanning}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bulk Quick Presets */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[10px] font-semibold text-muted-foreground mr-1">Presets:</span>
                    {[1, 5, 10, 20, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setQuantity(val)}
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer",
                          quantity === val
                            ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                        )}
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Transaction Note (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Bulk restock, delivery, batch replenishment..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-background"
                    disabled={scanning}
                  />
                </div>

                {/* Stock Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl gap-1.5 cursor-pointer shadow-xs"
                    onClick={() => handleStockUpdate('Stock In')}
                    disabled={scanning || quantity <= 0}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    {scanning ? 'Updating...' : `Stock IN (+${quantity})`}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold text-xs h-10 rounded-xl gap-1.5 cursor-pointer"
                    onClick={() => handleStockUpdate('Stock Out')}
                    disabled={scanning || quantity <= 0 || scanResult.item.stock < quantity}
                    title={scanResult.item.stock < quantity ? 'Insufficient stock' : undefined}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    {scanning ? 'Updating...' : `Stock OUT (-${quantity})`}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center italic pt-1">
                  Item QR &bull; Strictly for item identification and stock monitoring.
                </p>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* VIEW B: BORROWING TRANSACTION QR (Return & Tracking Only)     */}
          {/* ───────────────────────────────────────────────────────────── */}
          {!hasTypeMismatch && scanResult?.qrType === 'BORROWING' && scanResult.borrowing && (
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs animate-in fade-in duration-300">
              {/* Borrowing Transaction Banner */}
              <div className="p-4 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border-b border-border/60 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    <span>Borrowing Transaction</span>
                  </div>
                  <div className="font-mono font-black text-sm text-foreground">
                    {scanResult.borrowing.borrowingCode}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider",
                    scanResult.borrowing.status === 'RETURNED'
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : scanResult.borrowing.dueDate && new Date(scanResult.borrowing.dueDate) < new Date()
                      ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                      : "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                  )}
                >
                  {scanResult.borrowing.status === 'RETURNED'
                    ? 'Returned'
                    : scanResult.borrowing.dueDate && new Date(scanResult.borrowing.dueDate) < new Date()
                    ? 'Overdue'
                    : 'Active Borrowed'}
                </Badge>
              </div>

              <div className="p-4 space-y-4 bg-card">
                {/* Borrower & Item Details */}
                <div className="space-y-2.5">
                  {/* Borrower Card */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Borrower
                      </div>
                      <div className="text-sm font-bold text-foreground truncate">
                        {scanResult.borrowing.borrowerName}
                      </div>
                      {scanResult.borrowing.borrowerEmail && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {scanResult.borrowing.borrowerEmail}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Borrowed Item Details Card */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-muted border overflow-hidden flex items-center justify-center shrink-0">
                        {scanResult.borrowing.item.imageUrl ? (
                          <img src={scanResult.borrowing.item.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          {scanResult.borrowing.item.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {scanResult.borrowing.item.inventoryCode}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Borrowed</span>
                      <div className="text-sm font-black font-headline text-foreground">
                        {scanResult.borrowing.quantity || 1} {scanResult.borrowing.item.unit || 'pcs'}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Borrowed Date
                      </span>
                      <p className="font-bold text-foreground mt-1 text-xs">
                        {scanResult.borrowing.borrowedAt
                          ? new Date(scanResult.borrowing.borrowedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Expected Return
                      </span>
                      <p className="font-bold text-foreground mt-1 text-xs">
                        {scanResult.borrowing.dueDate
                          ? new Date(scanResult.borrowing.dueDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Open Schedule'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Return Check-in Section (Only if status is BORROWED) */}
                {scanResult.borrowing.status === 'BORROWED' ? (
                  <div className="space-y-3 pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Return &amp; Check-in Intake
                      </h4>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Return Condition</label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
                        value={returnCondition}
                        onChange={(e) => setReturnCondition(e.target.value)}
                        disabled={submittingReturn}
                      >
                        <option value="Good Condition">Good Condition (No issues)</option>
                        <option value="Minor Wear">Minor Wear (Functional)</option>
                        <option value="Damaged">Damaged / Needs Maintenance</option>
                      </select>
                    </div>

                    {/* Photo Upload Section: Damaged (Required), Minor Wear (Optional), Good Condition (Hidden) */}
                    {(returnCondition === 'Damaged' || returnCondition === 'Minor Wear') && (
                      <div
                        className={cn(
                          "space-y-2 p-3 rounded-2xl border-2 border-dashed animate-in fade-in zoom-in-95 duration-200",
                          returnCondition === 'Damaged'
                            ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40"
                            : "bg-muted/40 dark:bg-muted/20 border-border/80"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Camera
                              className={cn(
                                "h-4 w-4",
                                returnCondition === 'Damaged'
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                              )}
                            />
                            <label
                              className={cn(
                                "text-xs font-bold",
                                returnCondition === 'Damaged'
                                  ? "text-amber-900 dark:text-amber-200"
                                  : "text-foreground"
                              )}
                            >
                              {returnCondition === 'Damaged'
                                ? 'Damage Evidence Photo'
                                : 'Condition Photo (Minor Wear)'}
                            </label>
                          </div>
                          {returnCondition === 'Damaged' ? (
                            <Badge className="bg-destructive hover:bg-destructive text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 text-destructive-foreground">
                              Required *
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 text-muted-foreground border-border/70"
                            >
                              Optional
                            </Badge>
                          )}
                        </div>

                        <p
                          className={cn(
                            "text-[11px] leading-snug",
                            returnCondition === 'Damaged'
                              ? "text-amber-900/80 dark:text-amber-200/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {returnCondition === 'Damaged'
                            ? 'Kailangan ng malinaw na litrato ng sira upang ma-verify bago tanggapin ang pagbalik.'
                            : 'Maaaring mag-upload ng litrato ng minor wear o gasgas (opsyonal para sa inspection records).'}
                        </p>

                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handlePhotoSelect}
                          disabled={submittingReturn || isUploadingPhoto}
                        />

                        {damagePhoto ? (
                          <div className="relative rounded-xl overflow-hidden border border-border/80 bg-background/90 shadow-xs">
                            <div className="relative aspect-video w-full max-h-48 bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                              <img
                                src={damagePhoto}
                                alt="Return condition evidence"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="p-2 bg-background/95 border-t border-border/60 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Photo Attached
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => photoInputRef.current?.click()}
                                  disabled={submittingReturn}
                                  className="h-7 px-2 text-[11px] rounded-lg cursor-pointer"
                                >
                                  Retake / Change
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDamagePhoto(null)}
                                  disabled={submittingReturn}
                                  className="h-7 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5 mr-1" /> Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => !isUploadingPhoto && photoInputRef.current?.click()}
                            className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border/80 bg-background/60 hover:bg-muted/30 transition-colors text-center group"
                          >
                            <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                              <Camera className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-bold text-foreground">
                              {isUploadingPhoto ? 'Compacting & loading photo...' : 'Take Photo or Upload Image'}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Tap to open camera or browse files (JPG, PNG)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Inspection Notes
                      </label>
                      <Input
                        placeholder="e.g. Returned clean, functional, complete accessories verified..."
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-background"
                        disabled={submittingReturn}
                      />
                    </div>

                    {returnCondition === 'Damaged' && (
                      <div className="p-3 text-xs bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 rounded-xl flex items-start gap-2.5 animate-in fade-in">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-bold">Damaged Return Notification</p>
                          <p className="text-[11px] opacity-90 mt-0.5">
                            Mairerecord ang pagbalik ng gamit ngunit may markang <strong>"Damaged"</strong>. Awtomatiko itong ifa-flag para sa inspection at preventive maintenance.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        type="button"
                        className={cn(
                          "w-full font-bold text-xs h-11 rounded-xl shadow-xs gap-2 transition-all cursor-pointer",
                          returnCondition === 'Damaged'
                            ? (!damagePhoto
                                ? "bg-amber-600/60 hover:bg-amber-600/60 text-white cursor-not-allowed opacity-80"
                                : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20")
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                        onClick={handleReturnSubmit}
                        disabled={submittingReturn || (returnCondition === 'Damaged' && !damagePhoto)}
                      >
                        {returnCondition === 'Damaged' ? (
                          <>
                            <AlertTriangle className="h-4 w-4" />
                            <span>
                              {submittingReturn
                                ? 'Processing Return...'
                                : !damagePhoto
                                ? 'Photo Required to Complete Return'
                                : 'Complete Return & Flag as Damaged'}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>
                              {submittingReturn
                                ? 'Processing Return...'
                                : 'Complete Return & Restore Stock'}
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-border/60">
                    <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Returned &amp; Completed Transaction</span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[10px]">
                        Saved in Database
                      </Badge>
                    </div>

                    <div className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-muted-foreground">Return Condition:</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold",
                            scanResult.borrowing.returnCondition === 'Damaged'
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          )}
                        >
                          {scanResult.borrowing.returnCondition || 'Good Condition'}
                        </Badge>
                      </div>

                      {scanResult.borrowing.returnNotes && (
                        <div className="text-[11px]">
                          <span className="text-muted-foreground block">Inspection Notes:</span>
                          <p className="font-medium text-foreground mt-0.5">{scanResult.borrowing.returnNotes}</p>
                        </div>
                      )}

                      {/* Display Saved Photos from Database */}
                      {scanResult.borrowing.returnPhotos && scanResult.borrowing.returnPhotos.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                              <Camera className="h-3.5 w-3.5 text-primary" />
                              Saved Damage Photo Evidence:
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {scanResult.borrowing.returnPhotos.length} photo(s)
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {scanResult.borrowing.returnPhotos.map((photo: string, idx: number) => (
                              <a
                                key={idx}
                                href={photo}
                                target="_blank"
                                rel="noreferrer"
                                className="relative aspect-video rounded-lg overflow-hidden border border-border/70 bg-black/5 hover:opacity-90 transition-opacity block group"
                              >
                                <img
                                  src={photo}
                                  alt={`Saved damage evidence ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-semibold transition-opacity">
                                  View Full
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground text-center italic pt-1">
                  Borrowing QR &bull; For transaction tracking, return intake, and verification.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-1">
          {scanResult ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetScan}
              className="text-xs rounded-xl gap-1.5 border-border/80 cursor-pointer"
            >
              <ScanBarcode className="h-3.5 w-3.5" />
              <span>Scan Another Code</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleResetScan();
              onClose();
            }}
            className="text-xs rounded-xl cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
