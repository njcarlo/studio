"use client";

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Loader2, ArrowLeftRight, User, Calendar, Clock, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Badge } from '@studio/ui';

export interface BorrowingQRData {
  id: string;
  itemId: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowedAt: string | Date;
  dueDate?: string | Date | null;
  status?: string;
  quantity?: number;
  item?: {
    name?: string;
    inventoryCode?: string;
    category?: { name?: string };
    unit?: string;
  };
}

interface BorrowingQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  borrowing: BorrowingQRData | null;
}

export function BorrowingQRModal({ isOpen, onClose, borrowing }: BorrowingQRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const borrowYear = borrowing?.borrowedAt ? new Date(borrowing.borrowedAt).getFullYear() : 2026;
  const borrowingCode = borrowing ? `BORROW-${borrowYear}-${borrowing.id.slice(0, 8).toUpperCase()}` : '';
  const qrPayload = borrowing ? `BORROW-${borrowYear}-${borrowing.id}` : '';

  useEffect(() => {
    if (!isOpen || !borrowing) {
      setQrDataUrl('');
      return;
    }

    let active = true;
    setLoading(true);

    const generate = async () => {
      try {
        const url = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 360,
          color: { dark: '#0369a1', light: '#ffffff' }, // Deep sky-blue for borrowing QRs
        });
        if (active) {
          setQrDataUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error('Borrowing QR generation error:', err);
        if (active) setLoading(false);
      }
    };

    generate();

    return () => {
      active = false;
    };
  }, [isOpen, borrowing, qrPayload]);

  const handlePrint = () => {
    if (!borrowing) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedBorrowed = borrowing.borrowedAt
      ? new Date(borrowing.borrowedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';
    const formattedDue = borrowing.dueDate
      ? new Date(borrowing.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : 'Open Schedule';

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Borrowing Transaction Slip - ${borrowingCode}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; padding: 10mm; display: flex; justify-content: center; }
    .slip {
      width: 75mm;
      padding: 5mm;
      border: 2px dashed #0284c7;
      border-radius: 4mm;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2mm;
    }
    .header { font-size: 8pt; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; }
    .code { font-size: 11pt; font-family: monospace; font-weight: 900; color: #0f172a; margin: 1mm 0; }
    .qr-img { width: 44mm; height: 44mm; object-fit: contain; }
    .divider { width: 100%; border-top: 1px solid #e2e8f0; margin: 2mm 0; }
    .details { width: 100%; font-size: 7.5pt; text-align: left; display: flex; flex-direction: column; gap: 1.5mm; }
    .row { display: flex; justify-content: space-between; }
    .label { color: #64748b; font-weight: 600; }
    .val { color: #0f172a; font-weight: 700; text-align: right; }
    .footer { font-size: 6.5pt; color: #94a3b8; margin-top: 2mm; text-align: center; }
    @media print {
      body { padding: 0; }
      @page { size: auto; margin: 5mm; }
    }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">COG App &bull; Borrowing Transaction QR</div>
    <div class="code">${borrowingCode}</div>
    <img src="${qrDataUrl}" alt="Borrowing QR" class="qr-img" />
    <div class="divider"></div>
    <div class="details">
      <div class="row"><span class="label">Borrower:</span><span class="val">${borrowing.borrowerName}</span></div>
      <div class="row"><span class="label">Item:</span><span class="val">${borrowing.item?.name || 'Equipment'}</span></div>
      <div class="row"><span class="label">Item Code:</span><span class="val">${borrowing.item?.inventoryCode || borrowing.itemId.slice(0, 8)}</span></div>
      <div class="row"><span class="label">Quantity:</span><span class="val">${borrowing.quantity || 1} ${borrowing.item?.unit || 'pcs'}</span></div>
      <div class="row"><span class="label">Borrowed Date:</span><span class="val">${formattedBorrowed}</span></div>
      <div class="row"><span class="label">Expected Return:</span><span class="val">${formattedDue}</span></div>
      <div class="row"><span class="label">Status:</span><span class="val">${borrowing.status || 'BORROWED'}</span></div>
    </div>
    <div class="divider"></div>
    <div class="footer">Scan with handheld scanner on return check-in. Transaction record only &bull; Do not use as Item QR.</div>
  </div>
  <script>window.onload=()=>{ window.print(); window.close(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!qrDataUrl || !borrowing) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `BORROWING_QR_${borrowingCode}.png`;
    link.click();
  };

  if (!borrowing) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <span>Borrowing Transaction QR</span>
          </DialogTitle>
          <DialogDescription>
            Unique transaction QR code for checkout tracking, verification, and return check-in.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
              <span className="text-xs font-medium">Generating transaction QR code...</span>
            </div>
          ) : (
            <div ref={printRef} className="space-y-4">
              {/* QR Image Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-sky-500/10 via-sky-500/5 to-transparent border border-sky-300 dark:border-sky-800 flex flex-col items-center text-center gap-2">
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-sky-200 dark:border-sky-800">
                  <img src={qrDataUrl} alt={borrowingCode} className="w-48 h-48 object-contain" />
                </div>
                <div className="font-mono font-black text-sm text-foreground mt-1">
                  {borrowingCode}
                </div>
                <Badge variant="outline" className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[10px] font-bold">
                  Transaction QR &bull; Single-Use Return Verification
                </Badge>
              </div>

              {/* Transaction Metadata Card */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5 text-sky-600" />
                    <span>Borrower:</span>
                  </div>
                  <span className="font-bold text-foreground">{borrowing.borrowerName}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Package className="h-3.5 w-3.5 text-sky-600" />
                    <span>Borrowed Item:</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {borrowing.item?.name || 'Equipment'} ({borrowing.quantity || 1} {borrowing.item?.unit || 'pcs'})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-sky-600" />
                    <span>Date Borrowed:</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    {borrowing.borrowedAt ? new Date(borrowing.borrowedAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground text-center italic">
                Note: This QR code is strictly for this borrowing transaction and does not replace the Item&apos;s permanent QR.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={loading}
              className="gap-1.5 rounded-xl text-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Slip</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={loading}
              className="gap-1.5 rounded-xl text-xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PNG</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
