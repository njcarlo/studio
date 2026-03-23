"use client";

import React from "react";
import { LoaderCircle, History } from "lucide-react";
import { format } from "date-fns";
import { useWorkerLogs } from "@/hooks/use-worker-logs";

export function WorkerActivityLog({ workerId }: { workerId: string }) {
  const { logs, isLoading } = useWorkerLogs(workerId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
        <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm border-0">No activity logs found for this worker.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {logs.map((log: any) => (
        <div
          key={log.id}
          className="relative pl-6 pb-4 border-l border-border last:border-0 last:pb-0"
        >
          <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold">{log.action}</span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {log.timestamp ? format(new Date(log.timestamp), "MMM d, h:mm a") : "Unknown"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{log.details}</p>
            <div className="text-[10px] font-medium text-primary/70 mt-1">By: {log.userName}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
