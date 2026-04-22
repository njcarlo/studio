"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@studio/ui";
import { Button } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Badge } from "@studio/ui";
import { XCircle, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ApprovalRequest, Worker } from "@studio/types";

interface KanbanCardProps {
  request: ApprovalRequest;
  onUpdateStatus: (request: ApprovalRequest, status: "Approved" | "Rejected") => void;
  canManage: boolean;
  onClick: (request: ApprovalRequest) => void;
  requesterWorker?: Worker | null;
  isUpdating: boolean;
}

export function KanbanCard({
  request,
  onUpdateStatus,
  canManage,
  onClick,
  requesterWorker,
  isUpdating,
}: KanbanCardProps) {
  const handleUpdateClick = (e: React.MouseEvent, status: "Approved" | "Rejected") => {
    e.stopPropagation();
    onUpdateStatus(request, status);
  };

  return (
    <Card
      className="group relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/30"
      onClick={() => onClick(request)}
    >
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full transition-transform group-hover:scale-y-110",
        request.status === "Approved" ? "bg-green-500" : request.status === "Rejected" ? "bg-red-500" : "bg-primary"
      )} />

      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8 shrink-0 shadow-sm border border-border">
              <AvatarImage src={requesterWorker?.avatarUrl} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{request.requester.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="text-[13px] font-semibold truncate">{request.requester}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {request.date ? formatDistanceToNow(new Date(request.date as any), { addSuffix: true }) : ""}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium h-5 rounded-md shrink-0">
            {request.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-1 italic">
          "{request.details}"
        </p>
        {request.type === "Room Booking" && request.status === "Pending Ministry Approval" && !canManage && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-2 py-1">
            <Clock className="h-3 w-3 shrink-0" />
            Waiting for Ministry Head Approval
          </div>
        )}
        {request.type === "Room Booking" && request.status === "Pending Admin Approval" && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-2 py-1">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Ministry Head Approved
          </div>
        )}
      </CardContent>

      {canManage && request.status.startsWith("Pending") && (
        <div className="px-4 pb-4 flex gap-2">
          <Button size="sm" variant="ghost" className="h-8 flex-1 text-xs text-destructive hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20" onClick={(e) => handleUpdateClick(e, "Rejected")} disabled={isUpdating}>
            <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
          </Button>
          <Button size="sm" variant="outline" className="h-8 flex-1 text-xs border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary" onClick={(e) => handleUpdateClick(e, "Approved")} disabled={isUpdating}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
          </Button>
        </div>
      )}

      <div className="absolute right-2 bottom-2 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary group-hover:right-3 transition-all">
        <ChevronRight className="h-4 w-4" />
      </div>
    </Card>
  );
}
