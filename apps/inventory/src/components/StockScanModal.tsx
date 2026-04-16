import { useState } from 'react';
import { X, RefreshCw, QrCode, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Package } from 'lucide-react';
import { ScannerModal } from './ScannerModal';

export function StockScanModal({ onClose }: { onClose: () => void }) {
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleScanAPI = async (payload: string) => {
    if (!payload.trim()) return;
    setScanning(true);
    setError('');
    setScanResult(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payload.trim() })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Item not found'); return; }
      setScanResult(data);
    } catch {
      setError('Scan failed. Check network connection.');
    } finally {
      setScanning(false);
      setIsCameraOpen(false);
    }
  };

  const handleStockUpdate = async (action: 'Stock In' | 'Stock Out') => {
    if (!scanResult) return;
    if (navigator.vibrate) navigator.vibrate(50);
    setScanning(true);
    setError('');
    try {
      const res = await fetch(`/api/inventory/items/${scanResult.item.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quantity: 1, notes: 'Scanned via Mobile Action' })
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to update stock'); return; }

      // Update local state to reflect changes and let user scan again or close
      setScanResult((prev: any) => ({
        ...prev,
        item: { ...prev.item, stock: data.updatedItem.stock, status: data.updatedItem.status }
      }));

    } catch {
      setError('Update failed. Check network connection.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 400 }}>
      {isCameraOpen && (
        <ScannerModal
          onClose={() => setIsCameraOpen(false)}
          onScan={(data) => {
            setQrInput(data);
            handleScanAPI(data);
          }}
        />
      )}
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Scan to Action</h3>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Search an item to update its stock</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', backgroundColor: '#f9fafb', borderRadius: '10px', border: '2px dashed #e5e7eb' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
              <QrCode size={40} color="#3b5bdb" style={{ opacity: 0.6, marginBottom: '0.75rem' }} />
              <button className="btn btn-primary" style={{ fontSize: '0.78rem' }} onClick={() => setIsCameraOpen(true)}>
                Start Camera Scanner
              </button>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Or type the QR payload manually below:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScanAPI(qrInput)}
                placeholder="Item ID or Code"
              />
              <button
                className="btn btn-primary"
                style={{ flexShrink: 0 }}
                onClick={() => handleScanAPI(qrInput)}
                disabled={scanning || !qrInput.trim()}
              >
                {scanning ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Search'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.8125rem' }}>
              <AlertTriangle size={14} style={{ display: 'inline', marginRight: '0.35rem' }} /> {error}
            </div>
          )}

          {scanResult && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e5e7eb', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {scanResult.item.imageUrl ? <img src={scanResult.item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={20} color="#9ca3af" />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1a1a2e' }}>{scanResult.item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                      {scanResult.item.inventoryCode || scanResult.item.id.slice(0, 8)} · {scanResult.item.category?.name}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Current Stock</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e' }}>
                    {scanResult.item.stock}
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, borderColor: '#10b981', color: '#10b981' }}
                  onClick={() => handleStockUpdate('Stock In')}
                  disabled={scanning}
                >
                  <ArrowUpCircle size={14} /> Stock IN (+1)
                </button>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, borderColor: '#d97706', color: '#d97706' }}
                  onClick={() => handleStockUpdate('Stock Out')}
                  disabled={scanning || scanResult.item.stock <= 0}
                >
                  <ArrowDownCircle size={14} /> Stock OUT (-1)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
