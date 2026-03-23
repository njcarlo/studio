"use client";

import React from "react";
import { Badge } from "@studio/ui";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";
import type { ApprovalRequest, Worker } from "@studio/types";

interface KanbanColumnProps {
  title: string;
  requests: ApprovalRequest[];
  onUpdateStatus: (request: ApprovalRequest, status: "Approved" | "Rejected") => void;
  checkCanManage: (request: ApprovalRequest) => boolean;
  onCardClick: (request: ApprovalRequest) => void;
  icon?: React.ReactNode;
  workers?: Worker[];
  isUpdating: boolean;
}

export function KanbanColumn({
  title,
  requests,
  onUpdateStatus,
  checkCanManage,
  onCardClick,
  icon,
  workers,
  isUpdating,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-full min-w-[300px] max-w-sm">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg shadow-sm border",
            title === "Pending" ? "bg-amber-50 text-amber-600 border-amber-200 shadow-amber-100" :
              title === "Approved" ? "bg-green-50 text-green-600 border-green-200 shadow-green-100" :
                "bg-red-50 text-red-600 border-red-200 shadow-red-100"
          )}>
            {icon}
          </div>
          <h3 className="font-bold text-sm tracking-tight text-foreground/80">{title}</h3>
        </div>
        <Badge variant="outline" className="text-[11px] font-bold px-2 py-0 h-6 bg-muted">
          {requests.length}
        </Badge>
      </div>

      <div className="bg-muted/30 rounded-2xl p-3 space-y-3 min-h-[500px] border border-border/50">
        {requests.length > 0 ? (
          requests.map((request) => {
            const canManage = checkCanManage(request);
            const requesterWorker = workers?.find((w) => w.id === request.workerId);
            return (
              <KanbanCard
                key={request.id}
                request={request}
                onUpdateStatus={onUpdateStatus}
                canManage={canManage}
                onClick={onCardClick}
                requesterWorker={requesterWorker}
                isUpdating={isUpdating}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center space-y-2 opacity-40">
            <div className="p-3 bg-muted rounded-full">
              <Clock className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">No {title.toLowerCase()} requests</p>
          </div>
        )}
      </div>
    </div>
  );
}
