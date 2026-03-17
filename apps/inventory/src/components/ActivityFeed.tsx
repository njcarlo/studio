import { useInventory } from '../hooks/useInventory';
import { useEffect } from 'react';
import { Check, Minus, Pencil } from 'lucide-react';

type ActivityType = 'Stock In' | 'Stock Out' | 'Adjustment';

export function ActivityFeed() {
  const { logs, fetchLogs, loading } = useInventory();

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getIcon = (action: ActivityType) => {
    switch (action) {
      case 'Stock In':
        return (
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            backgroundColor: '#d1fae5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Check size={14} color="#10b981" strokeWidth={2.5} />
          </div>
        );
      case 'Stock Out':
        return (
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Minus size={14} color="#ef4444" strokeWidth={2.5} />
          </div>
        );
      default:
        return (
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            backgroundColor: '#e0e7ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Pencil size={13} color="#6366f1" strokeWidth={2} />
          </div>
        );
    }
  };

  const getBadge = (action: ActivityType) => {
    switch (action) {
      case 'Stock In':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.7rem', fontWeight: 600,
            border: '1px solid #d1d5db',
            color: '#374151',
            backgroundColor: '#f9fafb',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            Stock In
          </span>
        );
      case 'Stock Out':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.7rem', fontWeight: 600,
            backgroundColor: '#ef4444',
            color: '#fff',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            Stock Out
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.7rem', fontWeight: 600,
            border: '1px solid #c7d2fe',
            color: '#6366f1',
            backgroundColor: '#eef2ff',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            Adjust
          </span>
        );
    }
  };

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString([], { month: 'numeric', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="activity-feed-card">
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: '#1a1a2e' }}>
          Activity Feed
        </h3>
        <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.15rem' }}>Real-time inventory logs</p>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading && logs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recent activity.</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 1.25rem',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              {getIcon(log.action as ActivityType)}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.item?.name || 'Unknown Item'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                  {log.action} {log.quantity > 0 ? `+${log.quantity}` : log.quantity} · {formatTime(log.timestamp)}
                </div>
              </div>

              {getBadge(log.action as ActivityType)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
