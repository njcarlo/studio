"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
  ChevronDown,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import {
  Tabs,
  TabsContent,
  Card,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@studio/ui';
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

const INVENTORY_TABS = [
  {
    id: "items",
    label: "Items & Catalog",
    description: "Browse registered SKUs, check stock levels, and manage equipment barcodes",
    icon: Boxes,
  },
  {
    id: "borrowings",
    label: "Borrowings",
    description: "Track active checkouts, expected return dates, and worker assignments",
    icon: ArrowLeftRight,
  },
  {
    id: "logs",
    label: "Stock Logs",
    description: "Real-time audit trail of check-ins, adjustments, disposals, and restocking",
    icon: History,
  },
  {
    id: "categories",
    label: "Categories",
    description: "Organize items into departments, equipment classifications, and color tags",
    icon: Layers,
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    description: "Equipment utilization, inventory valuation, and low-stock telemetry",
    icon: BarChart3,
  },
  {
    id: "settings",
    label: "Settings & Checklists",
    description: "Preventive maintenance (PMS) cycles, inspection checklists, and configurations",
    icon: Settings,
  },
];

function InventoryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') || 'items';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [quickStatusFilter, setQuickStatusFilter] = useState<string>("");
  const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [overdueAlerts, setOverdueAlerts] = useState<any[]>([]);

  const { stats, fetchStats } = useInventory();

  useEffect(() => {
    fetchStats();
    fetch('/api/inventory/borrowings?status=BORROWED')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const now = new Date();
          const over = data.filter((b) => b.expectedReturnDate && new Date(b.expectedReturnDate) < now);
          setOverdueAlerts(over);
        } else if (data.borrowings) {
          setOverdueAlerts(data.borrowings.filter((b: any) => b.isOverdue));
        } else {
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
    router.push(`/inventory?tab=${val}`, { scroll: false });
  };

  const activeTabMeta = useMemo(() => {
    return INVENTORY_TABS.find((t) => t.id === activeTab) || INVENTORY_TABS[0];
  }, [activeTab]);

  const ActiveIcon = activeTabMeta.icon;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ── TOP HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-headline font-black tracking-tight">
                  Inventory & Assets
                </h1>
                <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full font-semibold border-primary/20 text-primary bg-primary/5">
                  Church Asset System
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centralized equipment tracking, barcode checkout system, and preventive maintenance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCameraScannerOpen(true)}
              className="gap-2 rounded-xl border-border/80 shadow-2xs text-xs font-semibold"
            >
              <ScanBarcode className="h-4 w-4 text-primary" />
              Quick Scan (Camera)
            </Button>
            <Button
              size="sm"
              onClick={() => setIsScanModalOpen(true)}
              className="gap-2 rounded-xl shadow-xs text-xs font-semibold"
            >
              <ScanBarcode className="h-4 w-4" />
              Scan Barcode (Handheld)
            </Button>
          </div>
        </div>

        {/* ── OVERDUE BANNER ALERT ── */}
        {overdueAlerts.length > 0 && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between flex-wrap gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs font-bold">
                  {overdueAlerts.length} Overdue Borrowing Item(s) Detected!
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Some borrowed equipment has exceeded its return schedule. Please verify returns or send reminders to workers.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs rounded-xl h-8 px-3 shadow-xs"
              onClick={() => handleTabChange('borrowings')}
            >
              View Overdue
            </Button>
          </div>
        )}

        {/* ── MODERN KPI STAT CARDS (INTERACTIVE QUICK ACCESS) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Catalog */}
          <Card
            onClick={() => {
              handleTabChange('items');
              setQuickStatusFilter('');
            }}
            className="rounded-2xl border border-border/70 p-5 bg-card bg-gradient-to-b from-purple-500/[0.04] via-transparent to-transparent shadow-xs hover:shadow-md hover:border-purple-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                Total Catalog
              </span>
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-headline font-black text-foreground">
                {stats?.totalItems ?? '—'}
              </p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-muted-foreground font-medium">
                  All registered SKUs
                </p>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  View catalog →
                </span>
              </div>
            </div>
          </Card>

          {/* 2. Active Borrowed */}
          <Card
            onClick={() => handleTabChange('borrowings')}
            className="rounded-2xl border border-border/70 p-5 bg-card bg-gradient-to-b from-sky-500/[0.04] via-transparent to-transparent shadow-xs hover:shadow-md hover:border-sky-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                Active Borrowed
              </span>
              <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-headline font-black text-sky-600 dark:text-sky-400">
                  {stats?.borrowedCount ?? '—'}
                </p>
                {stats?.overdueCount ? (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-bold rounded-full animate-pulse">
                    {stats.overdueCount} overdue
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-muted-foreground font-medium">
                  In worker possession
                </p>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  View records →
                </span>
              </div>
            </div>
          </Card>

          {/* 3. Low Stock Alert */}
          <Card
            onClick={() => {
              handleTabChange('items');
              setQuickStatusFilter('Low Stock');
            }}
            className="rounded-2xl border border-border/70 p-5 bg-card bg-gradient-to-b from-amber-500/[0.04] via-transparent to-transparent shadow-xs hover:shadow-md hover:border-amber-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                Low Stock
              </span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-headline font-black ${(stats?.lowStockAlerts ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                  {stats?.lowStockAlerts ?? '—'}
                </p>
                {(stats?.lowStockAlerts ?? 0) > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-transparent text-[10px] px-1.5 py-0 font-bold rounded-full">
                    Needs restock
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-muted-foreground font-medium">
                  Below safety reorder point
                </p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Filter low stock →
                </span>
              </div>
            </div>
          </Card>

          {/* 4. PMS Alerts */}
          <Card
            onClick={() => handleTabChange('settings')}
            className="rounded-2xl border border-border/70 p-5 bg-card bg-gradient-to-b from-indigo-500/[0.04] via-transparent to-transparent shadow-xs hover:shadow-md hover:border-indigo-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                PMS Alerts
              </span>
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-headline font-black text-indigo-600 dark:text-indigo-400">
                {stats?.pmsAlerts ?? '—'}
              </p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-muted-foreground font-medium">
                  Due maintenance within 30d
                </p>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Manage PMS →
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── SECTION HEADER & STREAMLINED VIEW SWITCHER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <ActiveIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground tracking-tight">
                  {activeTabMeta.label}
                </h2>
                {activeTab === "borrowings" && overdueAlerts.length > 0 && (
                  <Badge variant="destructive" className="h-4 px-1.5 text-[9px] font-bold rounded-full">
                    {overdueAlerts.length} overdue
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeTabMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {activeTab === "items" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsActivityFeedOpen(true)}
                className="h-9 text-xs rounded-xl gap-1.5 border-border/80"
              >
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span>Activity Feed</span>
              </Button>
            )}

            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="h-9 w-[220px] text-xs font-bold rounded-xl bg-muted/40 border-border/80 shadow-2xs">
                <div className="flex items-center gap-2 truncate">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">View: {activeTabMeta.label}</span>
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="w-[240px] rounded-2xl">
                {INVENTORY_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = tab.id === activeTab;
                  return (
                    <SelectItem
                      key={tab.id}
                      value={tab.id}
                      className="text-xs py-2.5 cursor-pointer rounded-xl font-medium"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={isSelected ? "font-bold text-primary" : "text-foreground"}>
                            {tab.label}
                          </span>
                        </span>
                        {tab.id === "borrowings" && overdueAlerts.length > 0 && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 font-bold">
                            {overdueAlerts.length}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── TAB PANELS CONTENT ── */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <TabsContent value="items" className="space-y-6 mt-0">
            <div className="w-full">
              <InventoryTable
                onScanClick={() => setIsScanModalOpen(true)}
                statusFilterOverride={quickStatusFilter}
                onClearStatusFilterOverride={() => setQuickStatusFilter('')}
              />
            </div>
          </TabsContent>

          <TabsContent value="borrowings" className="space-y-6 mt-0">
            <BorrowingsPanel />
          </TabsContent>

          {/* Tab 3: Stock Logs */}
          <TabsContent value="logs" className="space-y-6 mt-0">
            <StockLogsPanel />
          </TabsContent>

          {/* Tab 4: Categories */}
          <TabsContent value="categories" className="space-y-6 mt-0">
            <CategoriesPanel />
          </TabsContent>

          {/* Tab 5: Reports */}
          <TabsContent value="reports" className="space-y-6 mt-0">
            <ReportsPanel />
          </TabsContent>

          {/* Tab 6: Settings */}
          <TabsContent value="settings" className="space-y-6 mt-0">
            <SettingsPanel />
          </TabsContent>
        </Tabs>

        {/* ── ACTIVITY FEED SIDE SHEET (Unclutters the Table) ── */}
        <Sheet open={isActivityFeedOpen} onOpenChange={setIsActivityFeedOpen}>
          <SheetContent className="sm:max-w-md w-full overflow-y-auto p-6">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Live Activity Feed
              </SheetTitle>
              <SheetDescription className="text-xs">
                Real-time equipment checkouts, check-ins, and inventory audit logs.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-2">
              <ActivityFeed />
            </div>
          </SheetContent>
        </Sheet>

        {/* ── SCAN MODALS ── */}
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
            onScan={() => {
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

