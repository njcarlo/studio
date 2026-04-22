"use client";

import React from "react";
import { Button } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@studio/ui";
import { Info, UserPlus, Calendar, UserCog, ArrowRightLeft, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ApprovalRequest, Worker } from "@studio/types";

function getIconForType(type: ApprovalRequest["type"]) {
  switch (type) {
    case "New Worker": return <UserPlus className="h-5 w-5" />;
    case "Profile Update": return <UserCog className="h-5 w-5" />;
    case "Room Booking": return <Calendar className="h-5 w-5" />;
    case "Ministry Change": return <ArrowRightLeft className="h-5 w-5" />;
    default: return <UserPlus className="h-5 w-5" />;
  }
}

function getStatusBadge(status: ApprovalRequest["status"]) {
  switch (status) {
    case "Approved": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">Approved</Badge>;
    case "Rejected": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">Rejected</Badge>;
    case "Pending Ministry Approval": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">Pending Ministry</Badge>;
    case "Pending Admin Approval": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">Pending Admin</Badge>;
    case "Pending Outgoing Approval": return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Pending Outgoing</Badge>;
    case "Pending Incoming Approval": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Pending Incoming</Badge>;
    default: return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">Pending</Badge>;
  }
}

function getStatusDescription(type: ApprovalRequest["type"], status: ApprovalRequest["status"]) {
  if (type === "Room Booking") {
    switch (status) {
      case "Pending Ministry Approval":
        return "Awaiting initial approval from Ministry Head. Room is not yet reserved.";
      case "Pending Admin Approval":
        return "Ministry Head approved. Awaiting final approval from Admin to officially reserve the room.";
      case "Approved":
        return "Room reservation is officially approved and confirmed.";
      case "Rejected":
        return "Room reservation request was rejected.";
    }
  }
  return null;
}

interface ApprovalDetailsDialogProps {
  request: ApprovalRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requesterWorker?: Worker | null;
}

export function ApprovalDetailsDialog({
  request,
  open,
  onOpenChange,
  requesterWorker,
}: ApprovalDetailsDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogTitle className="sr-only">{request.type} Request Details</DialogTitle>
        <div className={cn("h-24 flex items-end p-6", request.status === "Approved" ? "bg-green-600" : request.status === "Rejected" ? "bg-red-600" : "bg-primary")}>
          <div className="flex items-center gap-4 text-white">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">{getIconForType(request.type)}</div>
            <div>
              <h2 className="text-xl font-bold font-headline leading-tight">{request.type}</h2>
              <p className="text-white/80 text-sm">Request Details</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src={requesterWorker?.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary uppercase">{request.requester.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Submitted By</p>
              <p className="text-sm font-semibold">{request.requester}</p>
              <p className="text-[10px] text-muted-foreground">
                {request.date ? format(new Date(request.date as any), "MMM d, yyyy • h:mm a") : "N/A"}
              </p>
            </div>
            <div className="ml-auto">{getStatusBadge(request.status)}</div>
          </div>

          {getStatusDescription(request.type, request.status) && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
              <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{getStatusDescription(request.type, request.status)}</span>
              </p>
            </div>
          )}

          {request.type === "Room Booking" && request.status === "Pending Admin Approval" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Approval Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-green-800 dark:text-green-300">Ministry Head</p>
                    <p className="text-[10px] text-green-600 dark:text-green-500">Approved</p>
                  </div>
                </div>
                <div className="h-px w-4 bg-border shrink-0" />
                <div className="flex items-center gap-2 flex-1 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <Clock className="h-4 w-4 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-orange-800 dark:text-orange-300">Admin</p>
                    <p className="text-[10px] text-orange-600 dark:text-orange-500">Awaiting Final Approval</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Info className="h-4 w-4" />
              Description
            </div>
            <div className="p-4 rounded-xl bg-card border shadow-sm text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {request.details}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
