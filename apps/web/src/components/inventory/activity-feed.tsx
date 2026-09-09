"use client";

import React, { useEffect } from 'react';
import { Check, Minus, Pencil, ArrowDownRight, ArrowUpRight, CopyMinus, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@studio/ui';
import { useInventory, type InventoryLog } from '@/hooks/use-inventory';

export function ActivityFeed() {
  const { logs, fetchLogs, loading } = useInventory();

  useEffect(() => {
    fetchLogs(20);
  }, [fetchLogs]);

  const getIcon = (action: string) => {
    switch (action) {
      case 'Stock In':
      case 'Return':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <ArrowDownRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        );
      case 'Stock Out':
      case 'Checkout':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
            <Pencil className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
        );
    }
  };

  const getBadgeVariant = (action: string) => {
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

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Card className="h-full flex flex-col shadow-sm border">
      <CardHeader className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">Activity Feed</CardTitle>
            <CardDescription className="text-xs">Real-time inventory logs</CardDescription>
          </div>
          <button
            onClick={() => fetchLogs(20)}
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-y-auto flex-1 max-h-[500px] divide-y">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading recent activities...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">No recent activity found.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-3.5 flex items-start gap-3 hover:bg-muted/30 transition-colors">
              {getIcon(log.action || log.type)}

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-foreground truncate">
                  {log.item?.name || 'Item Record'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                  <span className="font-medium text-foreground">{log.action || log.type}</span>
                  <span> ({log.quantity > 0 ? `+${log.quantity}` : log.quantity}) </span>
                  &bull; <span>{formatTime(log.timestamp)}</span>
                </div>
                {log.notes && (
                  <div className="text-[10px] text-muted-foreground/80 italic mt-1 line-clamp-1">
                    "{log.notes}"
                  </div>
                )}
              </div>

              <Badge variant={getBadgeVariant(log.action || log.type)} className="text-[10px] shrink-0 font-medium">
                {log.action || log.type}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
