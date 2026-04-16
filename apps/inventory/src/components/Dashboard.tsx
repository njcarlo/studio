import { StatCard } from './StatCard';
import { ActivityFeed } from './ActivityFeed';
import { InventoryTable } from './InventoryTable';
import { useInventory } from '../hooks/useInventory';
import { useAuth } from '../lib/auth-context';
import { useEffect } from 'react';

export function Dashboard() {
  const { ministryId } = useAuth();
  const { stats, fetchStats } = useInventory(ministryId);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    /* Two-column layout: left = stats + table, right = activity feed */
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
            value={stats?.lowStockAlerts ?? '—'}
            subtitle="Below reorder point"
          />
          <StatCard
            title="OUT OF STOCK"
            value={stats?.outOfStock ?? '—'}
            subtitle="Requires action"
          />
          <StatCard
            title="PMS ALERTS"
            value={stats?.pmsAlerts ?? '—'}
            subtitle="Due soon or overdue"
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
