'use client';

import { StatCard } from './StatCard';
import { ActivityFeed } from './ActivityFeed';
import { InventoryTable } from './InventoryTable';
import { useInventory } from '@/hooks/use-inventory';
import { useInventoryAuth } from '@/hooks/use-inventory-auth';
import { useEffect } from 'react';

export function Dashboard() {
  const { ministryId } = useInventoryAuth();
  const { stats, fetchStats } = useInventory(ministryId);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="dashboard-content">

      {/* Left column */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Stats Row */}
        <div className="stats-grid">
          <StatCard
            title="TOTAL ITEMS"
            value={stats?.totalItems ?? '—'}
            subtitle="All tracked records"
          />
          <StatCard
            title="LOW STOCK"
            value={stats?.lowStock ?? '—'}
            subtitle="Below reorder point"
          />
          <StatCard
            title="ACTIVE BORROWINGS"
            value={stats?.activeBorrowings ?? '—'}
            subtitle="Currently borrowed"
          />
          <StatCard
            title="EQUIPMENT"
            value={stats?.equipment ?? '—'}
            subtitle="Equipment items"
          />
        </div>

        {/* Inventory Table */}
        <InventoryTable />
      </div>

      {/* Right column — Activity Feed */}
      <div className="dashboard-sidebar">
        <ActivityFeed />
      </div>

    </div>
  );
}
