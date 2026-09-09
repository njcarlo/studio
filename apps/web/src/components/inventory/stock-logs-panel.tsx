"use client";

import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Clock,
  Activity,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
} from '@studio/ui';

export function StockLogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/audit?take=100');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const toggleExpand = (idx: number) => {
    const next = new Set(expandedIds);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExpandedIds(next);
  };

  const filteredLogs = logs.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const d = entry.data || {};
    return (
      d.item?.name?.toLowerCase().includes(q) ||
      d.item?.inventoryCode?.toLowerCase().includes(q) ||
      d.action?.toLowerCase().includes(q) ||
      d.workerId?.toLowerCase().includes(q) ||
      (d.notes || '').toLowerCase().includes(q)
    );
  });

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (action) {
      case 'Stock In':
      case 'Return':
        return 'outline';
      case 'Stock Out':
      case 'Checkout':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <Card className="shadow-sm border">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base">Inventory Audit Trail & Stock Logs</h3>
            <p className="text-xs text-muted-foreground">
              Complete chronological history of stock movements, checkouts, and adjustments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchAuditLogs} className="gap-1.5 h-9">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Board */}
      <Card className="shadow-sm border">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Activity className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Loading activity records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No stock logs matching your search criteria.
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
              {filteredLogs.map((entry, idx) => {
                const { timestamp, data } = entry;
                const isExpanded = expandedIds.has(idx);

                return (
                  <div key={idx} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>

                    {/* Content Card */}
                    <div
                      onClick={() => toggleExpand(idx)}
                      className="p-4 rounded-xl border bg-card hover:bg-muted/20 transition-all cursor-pointer shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionBadgeVariant(data.action)} className="text-[10px] font-bold uppercase tracking-wider">
                            {data.action}
                          </Badge>
                          <span className="font-bold text-sm text-foreground">
                            {data.item?.name || 'Item Record'}
                          </span>
                          {data.item?.inventoryCode && (
                            <span className="text-xs font-mono text-muted-foreground">
                              ({data.item.inventoryCode})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatTimestamp(timestamp)}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">{data.workerId || 'Admin'}</strong>
                        {data.action === 'Stock In' && (
                          <span> added <strong className="text-emerald-600 dark:text-emerald-400">+{data.quantity}</strong> unit(s) to stock.</span>
                        )}
                        {data.action === 'Stock Out' && (
                          <span> removed <strong className="text-rose-600 dark:text-rose-400">-{data.quantity}</strong> unit(s) from stock.</span>
                        )}
                        {data.action === 'Checkout' && (
                          <span> checked out <strong className="text-amber-600 dark:text-amber-400">-{data.quantity}</strong> unit(s).</span>
                        )}
                        {data.action === 'Return' && (
                          <span> returned <strong className="text-emerald-600 dark:text-emerald-400">+{data.quantity}</strong> unit(s) back.</span>
                        )}
                        {data.action === 'Adjustment' && (
                          <span> adjusted stock by <strong className="text-primary">{data.quantity}</strong> unit(s).</span>
                        )}
                        <span className="ml-2 font-medium">Balance: <strong className="text-foreground">{data.balance}</strong></span>
                      </div>

                      {isExpanded && data.notes && (
                        <div className="mt-2 p-2.5 bg-muted/40 rounded-lg text-xs italic text-muted-foreground border">
                          "{data.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
