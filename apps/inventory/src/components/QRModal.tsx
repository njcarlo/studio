import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: { id: string; name: string } | null;
}

export function QRModal({ isOpen, onClose, item }: QRModalProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && item) {
      QRCode.toDataURL(JSON.stringify({ id: item.id, name: item.name }), { width: 250, margin: 2 })
        .then(url => setDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '320px', alignItems: 'center' }}>
        <div className="modal-header" style={{ width: '100%' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Item QR Code</h3>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.25rem', border: 'none' }}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body" style={{ width: '100%', alignItems: 'center' }}>
          {dataUrl ? (
            <img src={dataUrl} alt={`QR for ${item.name}`} style={{ borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center' }}>Generating...</div>
          )}
          
          <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: '1.5rem' }}>{item.name}</p>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
