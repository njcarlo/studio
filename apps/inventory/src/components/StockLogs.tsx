import { useEffect, useState } from 'react';
import { Clock, Activity, Edit3, Trash2, PlusCircle, LogIn, ArrowRightLeft, Search, ChevronDown, ChevronRight } from 'lucide-react';

export function StockLogs() {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/inventory/audit?take=200') // fetch more so local search works better
      .then(res => res.json())
      .then(data => {
        setTimeline(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggleExpand = (index: number) => {
    const next = new Set(expandedIds);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedIds(next);
  };

  const filteredTimeline = timeline.filter(entry => {
    if (!searchQuery) return true;
    const { type, data } = entry;
    const query = searchQuery.toLowerCase();
    const itemName = String((type === 'LOG' ? data.item?.name : data.itemName) || '').toLowerCase();
    const action = String(data.action || '').toLowerCase();
    const user = String((type === 'LOG' ? data.workerId : data.userName) || '').toLowerCase();
    const itemCode = String((type === 'LOG' ? data.item?.inventoryCode : '') || '').toLowerCase();
    
    return itemName.includes(query) || action.includes(query) || user.includes(query) || itemCode.includes(query);
  });

  const getIcon = (type: string, action: string) => {
    if (type === 'AUDIT') {
      if (action === 'CREATED') return <PlusCircle size={16} color="#10b981" />;
      if (action === 'UPDATED') return <Edit3 size={16} color="#3b82f6" />;
      if (action === 'DELETED') return <Trash2 size={16} color="#ef4444" />;
    } else {
      if (action === 'Stock In') return <LogIn size={16} color="#10b981" />;
      if (action === 'Stock Out') return <ArrowRightLeft size={16} color="#f59e0b" />;
      return <Activity size={16} color="#6366f1" />;
    }
    return <Activity size={16} color="#6b7280" />;
  };

  const getActionColor = (type: string, action: string) => {
    if (type === 'AUDIT') {
      if (action === 'CREATED') return '#d1fae5';
      if (action === 'UPDATED') return '#dbeafe';
      if (action === 'DELETED') return '#fee2e2';
    } else {
      if (action === 'Stock In') return '#d1fae5';
      if (action === 'Stock Out') return '#fef3c7';
    }
    return '#f3f4f6';
  };

  const formatTimestamp = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(d);
  };

  const renderChanges = (changesStr: string) => {
    try {
      const parsed = JSON.parse(changesStr);
      const ignoreKeys = ['id', 'categoryId', 'locationId', 'imageUrl', 'createdAt', 'lastUpdated'];
      
      const friendlyNames: Record<string, string> = {
        name: 'Item Name',
        type: 'Item Type',
        stock: 'Stock Quantity',
        minStock: 'Minimum Stock',
        unit: 'Measurement Unit',
        status: 'Status',
        statusDetails: 'Condition Notes',
        inventoryCode: 'Inventory Code',
        aisle: 'Aisle',
        shelf: 'Shelf',
        bin: 'Bin',
        isApprovalRequired: 'Requires Approval',
        assignedTo: 'Assigned To'
      };

      const entries = Object.entries(parsed).filter(([k, v]) => !ignoreKeys.includes(k) && v !== null && v !== '');

      if (entries.length === 0) return <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.5rem' }}>No significant item details recorded.</div>;

      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem', marginTop: '1rem', padding: '0.5rem 0' }}>
          {entries.map(([key, value]) => {
            const label = friendlyNames[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            // Handle Diff Objects vs Plain Strings
            const isDiff = typeof value === 'object' && value !== null && 'from' in value && 'to' in value;

            const formatVal = (v: any) => {
              if (v === null || v === undefined || v === '') return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Empty</span>;
              if (typeof v === 'boolean') return v ? 'Yes' : 'No';
              if (typeof v === 'object' && !Array.isArray(v)) {
                return v.name || v.title || v.id || JSON.stringify(v);
              }
              return String(v);
            };

            return (
              <div key={key} style={{ backgroundColor: '#fff', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 700, marginBottom: '0.3rem' }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {isDiff ? (
                    <>
                      <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{formatVal((value as any).from)}</span>
                      <ArrowRightLeft size={12} color="#9ca3af" />
                      <span style={{ color: '#10b981', padding: '0.1rem 0.3rem', backgroundColor: '#d1fae5', borderRadius: '4px' }}>{formatVal((value as any).to)}</span>
                    </>
                  ) : (
                    <span>{formatVal(value)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      
      {/* Header Panel */}
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem 2rem',
        border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={24} color="#4f46e5" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Detailed Audit Trail</h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Chronological history of all stock movements and system records.</p>
          </div>
        </div>
        
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input 
            type="text" placeholder="Search history..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: '8px', border: '1px solid #d1d5db',
              fontSize: '0.875rem', outline: 'none', minWidth: '240px'
            }} 
          />
        </div>
      </div>

      {/* Timeline Board */}
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '2rem',
        border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        minHeight: '400px'
      }}>
        
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
             <Activity size={24} style={{ animation: 'spin 2s linear infinite' }} />
             <span>Loading Audit Trails...</span>
          </div>
        ) : filteredTimeline.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No activity logs found matching your search.</div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Vertical Line */}
            <div style={{
              position: 'absolute', left: '23px', top: '24px', bottom: '24px',
              width: '2px', backgroundColor: '#f3f4f6', zIndex: 0
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredTimeline.map((entry, globalIdx) => {
                const { type, timestamp, data } = entry;
                const isExpanded = expandedIds.has(globalIdx);
                
                return (
                  <div key={globalIdx} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                    
                    {/* Icon Bubble */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      backgroundColor: getActionColor(type, data.action),
                      border: '4px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      {getIcon(type, data.action)}
                    </div>

                    {/* Content Card */}
                    <div style={{
                      flex: 1, backgroundColor: '#f9fafb', border: '1px solid #f3f4f6',
                      borderRadius: '10px', padding: '1rem 1.25rem',
                      transition: 'all 0.15s', cursor: 'pointer',
                      boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                      borderColor: isExpanded ? '#e5e7eb' : '#f3f4f6'
                    }}
                    onClick={() => toggleExpand(globalIdx)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isExpanded ? '#fff' : '#f9fafb'; e.currentTarget.style.borderColor = isExpanded ? '#e5e7eb' : '#f3f4f6'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            {data.action}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                            {type === 'AUDIT' ? 'System Record' : 'Stock Adjustment'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                            {formatTimestamp(timestamp)}
                          </div>
                          {isExpanded ? <ChevronDown size={16} color="#9ca3af" /> : <ChevronRight size={16} color="#9ca3af" />}
                        </div>
                      </div>

                      {type === 'LOG' ? (
                        <>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                            {data.item?.name || 'Unknown Item'} <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.875rem' }}>({data.item?.inventoryCode || 'No Code'})</span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5 }}>
                            <strong style={{ color: '#111827' }}>{data.workerId || 'Admin'}</strong> 
                            {data.action === 'Stock In' ? (
                              <span> added <strong style={{ color: '#10b981' }}>{data.quantity}</strong> unit(s) to the inventory.</span>
                            ) : data.action === 'Stock Out' ? (
                              <span> removed <strong style={{ color: '#f59e0b' }}>{data.quantity}</strong> unit(s) from the inventory.</span>
                            ) : data.action === 'Checkout' ? (
                              <span> checked out <strong style={{ color: '#f59e0b' }}>{data.quantity}</strong> unit(s).</span>
                            ) : data.action === 'Return' ? (
                              <span> returned <strong style={{ color: '#10b981' }}>{data.quantity}</strong> unit(s) back.</span>
                            ) : (
                              <span> manually adjusted stock by <strong style={{ color: '#3b82f6' }}>{data.quantity}</strong> unit(s).</span>
                            )}
                            <div style={{ marginTop: '0.25rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                              Current Total Balance: <strong style={{ color: '#111827' }}>{data.balance}</strong>
                            </div>
                            {isExpanded && data.notes && (
                              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', backgroundColor: '#eef2ff', color: '#4338ca', borderRadius: '8px', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                                "{data.notes}"
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                            {data.itemName} {data.itemId && <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.875rem' }}>(ID: {data.itemId.substring(0,8)}...)</span>}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5 }}>
                            <strong style={{ color: '#111827' }}>{data.userName}</strong> {data.action.toLowerCase()} the item record.
                            {isExpanded && data.changes && (
                              <>
                                <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0.85rem 0' }} />
                                {renderChanges(data.changes)}
                              </>
                            )}
                          </div>
                        </>
                      )}
                      
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
