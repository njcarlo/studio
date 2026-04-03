import { useEffect, useState } from 'react';
import { Download, AlertTriangle, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';

export function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inventory/analytics')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleExportPDF = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', flexDirection: 'column', gap: '1rem' }}>
        <Activity size={32} style={{ animation: 'spin 2s linear infinite' }} />
        <span>Generating Analytics Report...</span>
      </div>
    );
  }

  // Calculate max usage for relative chart scaling
  const maxUsage = data.mostUsed.length > 0 ? Math.max(...data.mostUsed.map((m: any) => m.count)) : 10;

  // Calculate max category items for scaling
  const maxCategory = data.stockByCategory.length > 0 ? Math.max(...data.stockByCategory.map((c: any) => c.count)) : 10;

  return (
    <div className="reports-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>

      {/* Dynamic Print Styles for PDF Generation */}
      <style>
        {`
          @media print {
            body { background: white !important; }
            .sidebar, .header, .btn-no-print { display: none !important; }
            .reports-container { padding: 0 !important; width: 100% !important; margin: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .card-shadow { box-shadow: none !important; border: 1px solid #d1d5db !important; }
            @page { margin: 1.5cm; }
          }
        `}
      </style>

      {/* Header Panel */}
      <div className="card-shadow" style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem 2rem',
        border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BarChart3 size={28} color="#7c3aed" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Inventory Analytics</h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Data-driven insights for consumables and equipment usage.</p>
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          className="btn-no-print"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem',
            backgroundColor: '#111827', color: '#fff', borderRadius: '8px', border: 'none',
            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#374151'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#111827'}
        >
          <Download size={16} /> Export as PDF
        </button>
      </div>

      {/* Grid Layout for Charts & Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

        {/* Most Heavily Used Equipment */}
        <div className="card-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={20} color="#4f46e5" />
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>High Usage Equipment</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {data.mostUsed.length === 0 ? (
              <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>No checkout history yet.</span>
            ) : data.mostUsed.map((m: any, idx: number) => {
              const percentage = Math.max((m.count / maxUsage) * 100, 5);
              return (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    <span style={{ color: '#374151' }}>{m.item?.name || 'Deleted Item'}</span>
                    <span style={{ color: '#4f46e5', backgroundColor: '#eef2ff', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{m.count} checkouts</span>
                  </div>
                  {/* Progress Bar background */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    {/* Progress Fill */}
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#4f46e5', transition: 'width 1s ease-out' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <PieChart size={20} color="#059669" />
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>Stock by Category</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {data.stockByCategory.length === 0 ? (
              <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>No categories found.</span>
            ) : data.stockByCategory.map((cat: any, idx: number) => {
              const percentage = Math.max((cat.count / maxCategory) * 100, 2);
              return (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    <span style={{ color: '#374151' }}>{cat.name}</span>
                    <span style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{cat.count} items</span>
                  </div>
                  {/* Progress Bar background */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    {/* Progress Fill */}
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 1s ease-out' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Critical Alerts: Low Stock Level */}
      <div className="card-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #fecaca', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <AlertTriangle size={24} color="#ef4444" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>Low Stock Level Alerts</h2>
        </div>

        {data.lowStockItems.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#059669', backgroundColor: '#f0fdf4', borderRadius: '8px', fontWeight: 600 }}>
            All stocks are currently above minimum threshold.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #fee2e2', color: '#b91c1c' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Item Info</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>Available Stock</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>Minimum Requirement</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>Target to Order</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockItems.map((item: any, idx: number) => {
                  const deficit = item.minStock - item.stock;
                  const toBuy = deficit < 0 ? 0 : deficit;

                  // Calculate synced status based on exact logic in Dashboard
                  const computedStatus = item.stock === 0 ? 'Out of Stock' : item.stock <= item.minStock ? 'Low Stock' : item.status || 'In Stock';

                  // Dynamic Dashboard Status Badge Matching
                  const getBadgeProps = (status: string) => {
                    switch (status) {
                      case 'In Stock': return { bg: '#ecfdf5', border: '#a7f3d0', text: '#10b981', dot: '#10b981' };
                      case 'Low Stock': return { bg: '#fffbeb', border: '#fde68a', text: '#f59e0b', dot: '#f59e0b' };
                      case 'Out of Stock': return { bg: '#fef2f2', border: '#fecaca', text: '#ef4444', dot: '#ef4444' };
                      default: return { bg: '#f3f4f6', border: '#e5e7eb', text: '#6b7280', dot: '#9ca3af' };
                    }
                  };
                  const style = getBadgeProps(computedStatus);

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #fee2e2' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.inventoryCode}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}`,
                          padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: '0.375rem'
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: style.dot }} />
                          {computedStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, color: '#ef4444' }}>
                        {item.stock}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#4b5563' }}>
                        {item.minStock}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, color: '#991b1b', fontSize: '1rem' }}>
                        {toBuy > 0 ? `+${toBuy}` : '0'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
