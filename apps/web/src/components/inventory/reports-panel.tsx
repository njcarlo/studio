"use client";

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, TrendingUp, BarChart3, Package, PieChart, Activity, Printer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@studio/ui';

export function ReportsPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inventory/analytics')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleExportPDF = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Activity className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Generating analytics and reports...</span>
      </div>
    );
  }

  const maxUsage = data.mostUsed?.length > 0 ? Math.max(...data.mostUsed.map((m: any) => m.count), 1) : 1;
  const maxCategory = data.stockByCategory?.length > 0 ? Math.max(...data.stockByCategory.map((c: any) => c.count), 1) : 1;

  return (
    <div className="space-y-6 print:p-0">
      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          header, nav, aside, .no-print { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; break-inside: avoid; }
        }
      `}</style>

      {/* Header Panel */}
      <Card className="shadow-sm border print-card">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">Inventory Analytics & Report</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Data-driven insights for consumables, high-usage equipment, and safety reorders.
              </p>
            </div>
          </div>

          <Button onClick={handleExportPDF} className="no-print gap-2 shadow">
            <Printer className="h-4 w-4" />
            Export / Print PDF
          </Button>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border print-card">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Catalog SKUs</div>
            <div className="text-2xl font-black text-foreground mt-1">{data.totalItems}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tracked records across all categories</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border print-card">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Borrowings</div>
            <div className="text-2xl font-black text-primary mt-1">{data.activeBorrowingsCount || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Equipment currently checked out</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border print-card">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Low Stock Warnings</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {data.lowStockItems?.length || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Items needing immediate reorder</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Heavily Used Equipment */}
        <Card className="shadow-sm border print-card flex flex-col">
          <CardHeader className="p-5 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Top High-Usage Equipment</CardTitle>
            </div>
            <CardDescription className="text-xs">Most frequently borrowed equipment items</CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex-1 space-y-4">
            {data.mostUsed?.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No borrowing usage recorded yet.
              </div>
            ) : (
              data.mostUsed?.map((item: any, idx: number) => {
                const pct = Math.round((item.count / maxUsage) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-semibold text-foreground truncate pr-2">
                        {item.name} <span className="text-[10px] font-mono text-muted-foreground">({item.code || 'SKU'})</span>
                      </div>
                      <span className="font-bold shrink-0">{item.count} checkouts</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-sm border print-card flex flex-col">
          <CardHeader className="p-5 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Stock by Category</CardTitle>
            </div>
            <CardDescription className="text-xs">Item distribution across categories</CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex-1 space-y-4">
            {data.stockByCategory?.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No categories available.
              </div>
            ) : (
              data.stockByCategory?.map((cat: any, idx: number) => {
                const pct = Math.round((cat.count / maxCategory) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate">{cat.name}</span>
                      <span className="font-bold text-muted-foreground">{cat.count} items</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.color || '#3b82f6',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts Table */}
      <Card className="shadow-sm border print-card">
        <CardHeader className="p-5 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-sm font-bold">Safety Stock & Reorder Alert List</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Items currently at or below their safety stock threshold
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {data.lowStockItems?.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              All inventory items are currently well-stocked.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 border-b text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-4 text-left font-semibold">Item Name</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Code</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Category</th>
                  <th className="py-2.5 px-4 text-center font-semibold">Stock</th>
                  <th className="py-2.5 px-4 text-center font-semibold">Min Threshold</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.lowStockItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-4 font-medium text-foreground">{item.name}</td>
                    <td className="py-2.5 px-4 font-mono text-muted-foreground">{item.inventoryCode || '—'}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{item.category}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-destructive">{item.stock}</td>
                    <td className="py-2.5 px-4 text-center text-muted-foreground">{item.minStock}</td>
                    <td className="py-2.5 px-4 text-right">
                      <Badge variant={item.stock === 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                        {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
