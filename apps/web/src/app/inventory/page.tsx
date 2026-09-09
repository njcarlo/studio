"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Package,
  ScanBarcode,
  Layers,
  ArrowLeftRight,
  History,
  BarChart3,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Boxes,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsList, TabsTrigger, TabsContent, Card, CardContent, Button, Badge } from '@studio/ui';
import { useInventory } from '@/hooks/use-inventory';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { ActivityFeed } from '@/components/inventory/activity-feed';
import { BorrowingsPanel } from '@/components/inventory/borrowings-panel';
import { CategoriesPanel } from '@/components/inventory/categories-panel';
import { StockLogsPanel } from '@/components/inventory/stock-logs-panel';
import { ReportsPanel } from '@/components/inventory/reports-panel';
import { SettingsPanel } from '@/components/inventory/settings-panel';
import { StockScanModal } from '@/components/inventory/stock-scan-modal';
import { ScannerModal } from '@/components/inventory/scanner-modal';

function InventoryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') || 'items';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { stats, fetchStats } = useInventory();
  const [overdueAlerts, setOverdueAlerts] = useState<any[]>([]);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  useEffect(() => {
    fetchStats();

    // Check overdue borrowings
    fetch('/api/borrowings/overdue')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setOverdueAlerts(data);
        }
      })
      .catch(() => {});
  }, [fetchStats]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['items', 'borrowings', 'logs', 'categories', 'reports', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.push(`/inventory?tab=${val}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline tracking-tight text-foreground flex items-center gap-2.5">
              <Package className="h-7 w-7 text-primary" />
              Inventory Management
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track church equipment, consumables, worker borrowings, and maintenance cycles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsCameraScannerOpen(true)}
            >
              <ScanBarcode className="h-4 w-4 text-primary" />
              Quick Camera Scan
            </Button>
            <Button
              size="sm"
              className="gap-2 shadow"
              onClick={() => setIsScanModalOpen(true)}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Scan to Action
            </Button>
          </div>
        </div>

        {/* Automated Overdue Alert Banner */}
        {overdueAlerts.length > 0 && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start justify-between gap-3 text-destructive animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-destructive" />
              <div>
                <h4 className="font-bold text-sm">Action Needed: {overdueAlerts.length} Overdue Borrowing(s)</h4>
                <p className="text-xs text-destructive/90 mt-0.5">
                  Items have passed their expected return date. Please review active borrowings to coordinate returns.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0 text-xs h-8"
              onClick={() => handleTabChange('borrowings')}
            >
              View Overdue
            </Button>
          </div>
        )}

        {/* Stat Cards KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-xs border">
            <CardContent className="p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Catalog</div>
              <div className="text-2xl font-black text-foreground mt-1">{stats?.totalItems ?? '—'}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">All registered SKUs</p>
            </CardContent>
          </Card>

          <Card className="shadow-xs border">
            <CardContent className="p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Borrowed</div>
              <div className="text-2xl font-black text-primary mt-1">{stats?.borrowedCount ?? '—'}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {stats?.overdueCount ? `${stats.overdueCount} overdue` : 'In worker possession'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs border">
            <CardContent className="p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock Alert</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {stats?.lowStockAlerts ?? '—'}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Below safety reorder point</p>
            </CardContent>
          </Card>

          <Card className="shadow-xs border">
            <CardContent className="p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">PMS Alerts</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {stats?.pmsAlerts ?? '—'}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Due maintenance within 30d</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="items" className="gap-2 text-xs py-2 px-3">
              <Boxes className="h-4 w-4" />
              Items & Catalog
            </TabsTrigger>
            <TabsTrigger value="borrowings" className="gap-2 text-xs py-2 px-3">
              <ArrowLeftRight className="h-4 w-4" />
              Borrowings
              {overdueAlerts.length > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[9px] font-bold ml-1">
                  {overdueAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 text-xs py-2 px-3">
              <History className="h-4 w-4" />
              Stock Logs
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 text-xs py-2 px-3">
              <Layers className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 text-xs py-2 px-3">
              <BarChart3 className="h-4 w-4" />
              Reports & Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 text-xs py-2 px-3">
              <Settings className="h-4 w-4" />
              Settings & Checklists
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Master Items & Catalog */}
          <TabsContent value="items" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
              {/* Left 3 cols: Table */}
              <div className="xl:col-span-3">
                <InventoryTable />
              </div>

              {/* Right 1 col: Live Activity Feed */}
              <div className="xl:col-span-1">
                <ActivityFeed />
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Borrowings */}
          <TabsContent value="borrowings" className="space-y-6">
            <BorrowingsPanel />
          </TabsContent>

          {/* Tab 3: Stock Logs */}
          <TabsContent value="logs" className="space-y-6">
            <StockLogsPanel />
          </TabsContent>

          {/* Tab 4: Categories */}
          <TabsContent value="categories" className="space-y-6">
            <CategoriesPanel />
          </TabsContent>

          {/* Tab 5: Reports */}
          <TabsContent value="reports" className="space-y-6">
            <ReportsPanel />
          </TabsContent>

          {/* Tab 6: Settings */}
          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>

        {/* Scan Modals */}
        {isScanModalOpen && (
          <StockScanModal
            isOpen={isScanModalOpen}
            onClose={() => setIsScanModalOpen(false)}
            onStockUpdated={fetchStats}
          />
        )}

        {isCameraScannerOpen && (
          <ScannerModal
            isOpen={isCameraScannerOpen}
            onClose={() => setIsCameraScannerOpen(false)}
            onScan={(data) => {
              setIsCameraScannerOpen(false);
              setIsScanModalOpen(true);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Loading Inventory...</span>
          </div>
        </AppLayout>
      }
    >
      <InventoryPageContent />
    </Suspense>
  );
}
