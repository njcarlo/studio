import { useState, useRef, useEffect } from 'react';
import { Bell, ArrowDownRight, ArrowUpRight, CopyMinus, ScanBarcode, AlertTriangle, X } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useLocation } from 'react-router-dom';
import { StockScanModal } from './StockScanModal';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/categories': 'Categories',
  '/logs': 'Stock Logs',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [overdueAlerts, setOverdueAlerts] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const { logs, fetchLogs } = useInventory();
  const location = useLocation();

  const pageTitle = routeTitles[location.pathname] ?? 'Dashboard';

  useEffect(() => {
    fetchLogs();
    
    // Check for overdue items (Automated Alerts)
    fetch('/api/borrowings/overdue')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setOverdueAlerts(data);
        }
      })
      .catch(() => {});
  }, [fetchLogs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Stock In': return <ArrowDownRight size={14} color="var(--success)" />;
      case 'Stock Out': return <ArrowUpRight size={14} color="var(--warning)" />;
      default: return <CopyMinus size={14} color="var(--text-muted)" />;
    }
  };

  return (
    <>
    <header className="app-header">
      {/* Mobile hamburger placeholder — actual button is in Sidebar.tsx */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="mobile-header-menu-slot" />
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
          {pageTitle}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '2rem' }}>
        {/* Global Scan to Action */}
        <button
          className="btn btn-primary"
          style={{ height: '34px', fontSize: '0.8125rem', padding: '0 0.75rem', borderRadius: '8px', marginRight: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          onClick={() => setShowScanner(true)}
        >
          <ScanBarcode size={14} /> Scan
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="icon-btn"
            style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '10px', marginRight: '2rem' }}
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {logs && logs.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '7px',
                height: '7px',
                backgroundColor: 'var(--danger)',
                borderRadius: '50%',
                display: 'block',
                border: '1.5px solid var(--surface)'
              }} />
            )}
          </button>

          {showNotifications && (
            <div className="dropdown-menu" style={{ width: '300px' }}>
              <div className="dropdown-header">
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{logs?.length || 0} recent</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {logs && logs.length > 0 ? logs.slice(0, 8).map((log: any) => (
                  <div key={log.id} className="dropdown-item">
                    <div style={{
                      width: '28px', height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--background)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getActionIcon(log.action)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.item?.name || 'Unknown Item'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.action} · Qty: {log.quantity}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Status Automated Alerts / Toast Notification */}
    {overdueAlerts.length > 0 && (
      <div style={{ 
        position: 'fixed', 
        top: '72px', 
        right: '24px', 
        zIndex: 9999, 
        padding: '1rem 1.25rem', 
        backgroundColor: '#fef2f2', 
        border: '1px solid #fecaca', 
        borderRadius: '8px', 
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
        display: 'flex', 
        gap: '0.75rem',
        alignItems: 'flex-start',
        maxWidth: '380px'
      }}>
        <AlertTriangle size={18} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.2rem' }}>
            Overdue Warning
          </div>
          <div style={{ color: '#991b1b', fontSize: '0.8125rem', lineHeight: 1.4 }}>
            You have {overdueAlerts.length} overdue borrowing{overdueAlerts.length > 1 ? 's' : ''}. Please check the borrowings page to follow up.
          </div>
        </div>
        <button onClick={() => setOverdueAlerts([])} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0', flexShrink: 0, marginLeft: '0.25rem' }}>
          <X size={16} />
        </button>
      </div>
    )}

    {showScanner && <StockScanModal onClose={() => setShowScanner(false)} />}
    </>
  );
}
