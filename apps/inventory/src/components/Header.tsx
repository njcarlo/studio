import { useState, useRef, useEffect } from 'react';
import { Bell, ArrowDownRight, ArrowUpRight, CopyMinus } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useLocation } from 'react-router-dom';

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
  const notifRef = useRef<HTMLDivElement>(null);
  const { logs, fetchLogs } = useInventory();
  const location = useLocation();

  const pageTitle = routeTitles[location.pathname] ?? 'Dashboard';

  useEffect(() => {
    fetchLogs();
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
    <header className="app-header">
      {/* Mobile hamburger placeholder — actual button is in Sidebar.tsx */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="mobile-header-menu-slot" />
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>
          {pageTitle}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '2rem' }}>
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
  );
}
