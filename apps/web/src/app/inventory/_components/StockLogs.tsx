'use client';

import { useEffect, useState } from 'react';
import { Clock, Activity, LogIn, ArrowRightLeft, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useInventoryAuth } from '@/hooks/use-inventory-auth';
import { getLogs } from '@/services/inventory-api';

export function StockLogs() {
  const { ministryId } = useInventoryAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (ministryId === undefined) return;
    getLogs(ministryId ?? null, { limit: 200 })
      .then(data => { setLogs(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [ministryId]);

  const toggleExpand = (index: number) => {
    const next = new Set(expandedIds);
    if (next.has(index)) next.delete(index); else next.add(index);
    setExpandedIds(next);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.item?.name || '').toLowerCase().includes(q) ||
      (log.type || '').toLowerCase().includes(q) ||
      (log.notes || '').toLowerCase().includes(q)
    );
  });

  const getIcon = (type: string) => {
    if (type === 'Stock In') return <LogIn size={16} color="#10b981" />;
    if (type === 'Stock Out') return <ArrowRightLeft size={16} color="#f59e0b" />;
    return <Activity size={16} color="#6366f1" />;
  };

  const getActionColor = (type: string) => {
    if (type === 'Stock In') return '#d1fae5';
    if (type === 'Stock Out') return '#fef3c7';
    return '#e0e7ff';
  };

  const formatTimestamp = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem 2rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="#4f46e5" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Stock Logs</h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>History of all stock movements.</p>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input type="text" placeholder="Search logs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', minWidth: '240px' }} />
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '2rem', border: '1px solid #e5e7eb', minHeight: '400px' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Activity size={24} style={{ animation: 'inv-spin 2s linear infinite' }} />
            <span>Loading logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No stock logs found{searchQuery ? ' matching your search' : ''}.</div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '23px', top: '24px', bottom: '24px', width: '2px', backgroundColor: '#f3f4f6', zIndex: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredLogs.map((log, idx) => {
                const isExpanded = expandedIds.has(idx);
                return (
                  <div key={log.id ?? idx} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: getActionColor(log.type), border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      {getIcon(log.type)}
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '10px', padding: '1rem 1.25rem', cursor: 'pointer', boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.04)' : 'none', borderColor: isExpanded ? '#e5e7eb' : '#f3f4f6' }}
                      onClick={() => toggleExpand(idx)}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isExpanded ? '#fff' : '#f9fafb'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{log.type}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                            {formatTimestamp(log.timestamp)}
                          </div>
                          {isExpanded ? <ChevronDown size={16} color="#9ca3af" /> : <ChevronRight size={16} color="#9ca3af" />}
                        </div>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                        {log.item?.name || 'Unknown Item'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5 }}>
                        {log.type === 'Stock In' ? (
                          <span>Added <strong style={{ color: '#10b981' }}>{log.quantity}</strong> unit(s). Balance: <strong>{log.balance}</strong></span>
                        ) : log.type === 'Stock Out' ? (
                          <span>Removed <strong style={{ color: '#f59e0b' }}>{log.quantity}</strong> unit(s). Balance: <strong>{log.balance}</strong></span>
                        ) : (
                          <span>Adjusted by <strong style={{ color: '#3b82f6' }}>{log.quantity}</strong> unit(s). Balance: <strong>{log.balance}</strong></span>
                        )}
                        {isExpanded && log.notes && (
                          <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', backgroundColor: '#eef2ff', color: '#4338ca', borderRadius: '8px', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                            &ldquo;{log.notes}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
