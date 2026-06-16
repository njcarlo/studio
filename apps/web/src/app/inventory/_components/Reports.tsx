'use client';

import { useEffect, useState } from 'react';
import { Download, AlertTriangle, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useInventoryAuth } from '@/hooks/use-inventory-auth';

interface AnalyticsData {
  mostUsed: { item: any; count: number }[];
  stockByCategory: { name: string; count: number }[];
  lowStockItems: any[];
}

async function fetchAnalytics(ministryId: string | null): Promise<AnalyticsData> {
  // Most-used items: count borrowings per item
  let borrowQuery = supabaseBrowser
    .from('InventoryBorrowing')
    .select('itemId, item:InventoryItem!inner(id, name, group)');
  if (ministryId) borrowQuery = borrowQuery.eq('item.group', ministryId);
  const { data: borrowings } = await borrowQuery;

  const countMap = new Map<string, { item: any; count: number }>();
  for (const b of borrowings ?? []) {
    const key = b.itemId;
    if (!countMap.has(key)) countMap.set(key, { item: b.item, count: 0 });
    countMap.get(key)!.count += 1;
  }
  const mostUsed = Array.from(countMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Stock by category
  let itemQuery = supabaseBrowser
    .from('InventoryItem')
    .select('categoryId, quantity, minQuantity, status, name, inventoryCode, category:InventoryCategory(id,name)');
  if (ministryId) itemQuery = itemQuery.eq('group', ministryId);
  const { data: items } = await itemQuery;

  const catMap = new Map<string, { name: string; count: number }>();
  for (const item of items ?? []) {
    const cat = (item as any).category;
    const key = cat?.id ?? 'uncategorized';
    const label = cat?.name ?? 'Uncategorized';
    if (!catMap.has(key)) catMap.set(key, { name: label, count: 0 });
    catMap.get(key)!.count += 1;
  }
  const stockByCategory = Array.from(catMap.values()).sort((a, b) => b.count - a.count);

  // Low-stock items
  const lowStockItems = (items ?? [])
    .filter((i: any) => (i.minQuantity ?? 0) > 0 && (i.quantity ?? 0) <= (i.minQuantity ?? 0))
    .map((i: any) => ({ ...i, stock: i.quantity, minStock: i.minQuantity }))
    .sort((a: any, b: any) => a.stock - b.stock);

  return { mostUsed, stockByCategory, lowStockItems };
}

export function Reports() {
  const { ministryId } = useInventoryAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ministryId === undefined) return;
    fetchAnalytics(ministryId ?? null)
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [ministryId]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', flexDirection: 'column', gap: '1rem' }}>
        <Activity size={32} style={{ animation: 'inv-spin 2s linear infinite' }} />
        <span>Generating Analytics Report...</span>
      </div>
    );
  }

  const maxUsage = data.mostUsed.length > 0 ? Math.max(...data.mostUsed.map(m => m.count)) : 10;
  const maxCategory = data.stockByCategory.length > 0 ? Math.max(...data.stockByCategory.map(c => c.count)) : 10;

  return (
    <div className="reports-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      <style>{`
        @media print {
          body { background: white !important; }
          .sidebar, .header, .btn-no-print { display: none !important; }
          .reports-container { padding: 0 !important; width: 100% !important; margin: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .card-shadow { box-shadow: none !important; border: 1px solid #d1d5db !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="card-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem 2rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={28} color="#7c3aed" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Inventory Analytics</h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Data-driven insights for consumables and equipment usage.</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="btn-no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', backgroundColor: '#111827', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          <Download size={16} /> Export as PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={20} color="#4f46e5" />
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>High Usage Equipment</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {data.mostUsed.length === 0 ? (
              <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>No checkout history yet.</span>
            ) : data.mostUsed.map((m, idx) => {
              const pct = Math.max((m.count / maxUsage) * 100, 5);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    <span style={{ color: '#374151' }}>{m.item?.name || 'Deleted Item'}</span>
                    <span style={{ color: '#4f46e5', backgroundColor: '#eef2ff', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{m.count} checkouts</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#4f46e5', transition: 'width 1s ease-out' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <PieChart size={20} color="#059669" />
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>Stock by Category</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {data.stockByCategory.length === 0 ? (
              <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>No categories found.</span>
            ) : data.stockByCategory.map((cat, idx) => {
              const pct = Math.max((cat.count / maxCategory) * 100, 2);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    <span style={{ color: '#374151' }}>{cat.name}</span>
                    <span style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{cat.count} items</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 1s ease-out' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #fecaca' }}>
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
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>Available</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>Minimum</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>To Order</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockItems.map((item: any, idx: number) => {
                  const deficit = item.minStock - item.stock;
                  const toBuy = deficit > 0 ? deficit : 0;
                  const computedStatus = item.stock === 0 ? 'Out of Stock' : item.stock <= item.minStock ? 'Low Stock' : 'In Stock';
                  const badge: Record<string, { bg: string; border: string; text: string; dot: string }> = {
                    'In Stock': { bg: '#ecfdf5', border: '#a7f3d0', text: '#10b981', dot: '#10b981' },
                    'Low Stock': { bg: '#fffbeb', border: '#fde68a', text: '#f59e0b', dot: '#f59e0b' },
                    'Out of Stock': { bg: '#fef2f2', border: '#fecaca', text: '#ef4444', dot: '#ef4444' },
                  };
                  const s = badge[computedStatus] ?? badge['Low Stock'];
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #fee2e2' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.inventoryCode}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}`, padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: s.dot }} />
                          {computedStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, color: '#ef4444' }}>{item.stock}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#4b5563' }}>{item.minStock}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, color: '#991b1b', fontSize: '1rem' }}>{toBuy > 0 ? `+${toBuy}` : '0'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
