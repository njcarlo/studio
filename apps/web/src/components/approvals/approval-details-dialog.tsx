"use client";

import React from "react";
import { Button } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Dialog, DialogContent, DialogFooter } from "@studio/ui";
import { Info, UserPlus, Calendar, UserCog, ArrowRightLeft } from "lucide-react";
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
