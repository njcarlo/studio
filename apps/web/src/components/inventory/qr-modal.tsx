"use client";

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer, Loader2, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from '@studio/ui';

interface QRModalItem {
  id: string;
  name: string;
  inventoryCode?: string;
  category?: { name: string };
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: QRModalItem | null;
  items?: QRModalItem[];
}

interface QRRecord {
  itemId: string;
  itemName: string;
  inventoryCode?: string;
  pngDataUrl: string;
}

export function QRModal({ isOpen, onClose, item, items }: QRModalProps) {
  const [records, setRecords] = useState<QRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const allItems: QRModalItem[] = items && items.length > 0 ? items : item ? [item] : [];

  useEffect(() => {
    if (!isOpen || allItems.length === 0) {
      setRecords([]);
      return;
    }

    let active = true;
    setLoading(true);

    const generate = async () => {
      try {
        const generated: QRRecord[] = [];
        for (const it of allItems) {
          const payload = it.inventoryCode || it.id;
          const url = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 320,
            color: { dark: '#111827', light: '#ffffff' },
          });
          if (active) {
            generated.push({
              itemId: it.id,
              itemName: it.name,
              inventoryCode: it.inventoryCode,
              pngDataUrl: url,
            });
          }
        }
        if (active) {
          setRecords(generated);
          setLoading(false);
        }
      } catch (err) {
        console.error('QR generation error:', err);
        if (active) setLoading(false);
      }
    };

    generate();

    return () => {
      active = false;
    };
  }, [isOpen, item, items]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Print Inventory QR Labels</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; }
    .label-grid {
      display: grid;
      grid-template-columns: repeat(4, 50.8mm);
      gap: 2mm;
      padding: 5mm;
    }
    .label {
      width: 50.8mm;
      height: 50.8mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3mm;
      border: 1px dashed #ccc;
      page-break-inside: avoid;
      text-align: center;
      gap: 1.5mm;
    }
    .label img {
      width: 28mm;
      height: 28mm;
      object-fit: contain;
    }
    .label-name {
      font-size: 7.5pt;
      font-weight: 700;
      color: #111827;
      line-height: 1.15;
      max-width: 44mm;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .label-code {
      font-size: 6.5pt;
      color: #6b7280;
      font-family: monospace;
      font-weight: 600;
    }
    @media print {
      @page { size: A4; margin: 5mm; }
      .label { border: 1px solid #eee; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="label-grid">
    ${records
      .map(
        (r) => `
      <div class="label">
        <img src="${r.pngDataUrl}" alt="QR" />
        <div class="label-name">${r.itemName}</div>
        <div class="label-code">${r.inventoryCode || r.itemId.slice(0, 8).toUpperCase()}</div>
      </div>
    `
      )
      .join('')}
  </div>
  <script>window.onload=()=>{ window.print(); window.close(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadAll = () => {
    records.forEach((r) => {
      const link = document.createElement('a');
      link.href = r.pngDataUrl;
      link.download = `QR_${r.inventoryCode || r.itemId.slice(0, 8)}.png`;
      link.click();
    });
  };

  const isBatch = allItems.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={isBatch ? 'max-w-2xl' : 'max-w-md'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {isBatch ? `QR Labels (${allItems.length} items)` : 'Item QR Code'}
          </DialogTitle>
          <DialogDescription>
            {isBatch
              ? 'Print-ready batch labels for selected items'
              : 'Scan this code with a mobile camera or barcode scanner to lookup and adjust stock.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Generating high-resolution QR codes...</span>
            </div>
          ) : (
            <div ref={printRef}>
              {isBatch ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {records.map((r) => (
                    <div
                      key={r.itemId}
                      className="border rounded-xl p-3 bg-muted/20 flex flex-col items-center gap-2 text-center"
                    >
                      <img src={r.pngDataUrl} alt={r.itemName} className="w-28 h-28 object-contain rounded" />
                      <div className="text-xs font-semibold line-clamp-1 w-full" title={r.itemName}>
                        {r.itemName}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {r.inventoryCode || r.itemId.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                records[0] && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm flex flex-col items-center gap-3">
                      <img
                        src={records[0].pngDataUrl}
                        alt={records[0].itemName}
                        className="w-52 h-52 object-contain"
                      />
                      <div className="text-center">
                        <div className="font-bold text-base">{records[0].itemName}</div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          {records[0].inventoryCode || records[0].itemId.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleDownloadAll} disabled={loading || records.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download PNG{records.length > 1 ? 's' : ''}
          </Button>
          <Button onClick={handlePrint} disabled={loading || records.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            {isBatch ? `Print ${records.length} Labels` : 'Print Label'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
