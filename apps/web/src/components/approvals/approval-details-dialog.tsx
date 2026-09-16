"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Dialog, DialogContent, DialogTitle } from "@studio/ui";
import {
  Info, UserPlus, Calendar, UserCog, ArrowRightLeft,
  CheckCircle2, Clock, XCircle, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ApprovalRequest, Worker } from "@studio/types";

function getIconForType(type: ApprovalRequest["type"]) {
  switch (type) {
    case "New Worker": return <UserPlus className="h-5 w-5 text-white" />;
    case "Profile Update": return <UserCog className="h-5 w-5 text-white" />;
    case "Room Booking": return <Calendar className="h-5 w-5 text-white" />;
    case "Ministry Change": return <ArrowRightLeft className="h-5 w-5 text-white" />;
    default: return <UserPlus className="h-5 w-5 text-white" />;
  }
}

function getStatusBadge(status: ApprovalRequest["status"]) {
  if (status === "Approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Approved
      </span>
    );
  }
  if (status === "Rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 whitespace-nowrap shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        Rejected
      </span>
    );
  }
  if (status === "Pending Admin Approval" || status === "Pending Incoming Approval") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        Pending Admin
      </span>
    );
  }
  if (status === "Pending Ministry Approval" || status === "Pending Outgoing Approval") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        Pending Ministry
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
      Pending
    </span>
  );
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

  const reqDate = request.date ? new Date(request.date as any) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[540px] p-0 overflow-hidden !border-0 !border-none !outline-none !ring-0 rounded-3xl shadow-2xl bg-sidebar [&>button]:text-white/70 [&>button]:hover:text-white [&>button]:!bg-transparent [&>button]:hover:!bg-transparent [&>button]:focus:!bg-transparent [&>button]:data-[state=open]:!bg-transparent [&>button]:!border-0 [&>button]:!border-none [&>button]:!outline-none [&>button]:!ring-0 [&>button]:!ring-offset-0 [&>button]:focus:!ring-0 [&>button]:focus:!outline-none [&>button]:focus-visible:!ring-0 [&>button]:focus-visible:!outline-none [&>button]:top-4.5 [&>button]:right-5 sm:[&>button]:top-5 sm:[&>button]:right-6 [&>button]:p-0.5 [&>button]:transition-opacity"
        style={{ border: "none", outline: "none", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)" }}
      >
        <DialogTitle className="sr-only">{request.type} Request Details</DialogTitle>
        
        {/* Signature Header Banner */}
        <div className="bg-sidebar px-6 pt-4.5 pb-4.5 sm:px-7 sm:pt-5 sm:pb-4.5 relative overflow-hidden rounded-t-3xl flex items-center">
          <div className="flex items-center gap-3.5 relative z-10 text-white">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 shadow-xs shrink-0 flex items-center justify-center">
              {getIconForType(request.type)}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-headline tracking-tight text-white leading-tight">
                {request.type}
              </h2>
              <p className="text-white/80 text-xs font-medium mt-0.5">
                Request Details
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pb-7 space-y-5 bg-card rounded-b-3xl">
          {/* Submitted By Card */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-muted/40 border border-slate-200/80 dark:border-border/60 shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar className="h-11 w-11 rounded-full border-2 border-background shadow-xs shrink-0">
                <AvatarImage src={requesterWorker?.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary uppercase font-bold text-xs">
                  {request.requester.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submitted By</p>
                <p className="text-sm font-bold text-foreground leading-tight truncate">{request.requester}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  {reqDate ? format(reqDate, "MMM d, yyyy • h:mm a") : "—"}
                </p>
              </div>
            </div>
            <div className="shrink-0">{getStatusBadge(request.status)}</div>
          </div>

          {/* Context Alert Banner */}
          {getStatusDescription(request.type, request.status) && (
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 text-xs leading-relaxed flex items-start gap-2.5 shadow-2xs">
              <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-medium">{getStatusDescription(request.type, request.status)}</span>
            </div>
          )}

          {/* Approval Progress Multi-step Card */}
          {request.type === "Room Booking" && request.status === "Pending Admin Approval" && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Approval Progress</p>
              <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-muted/40 border border-slate-200/80 dark:border-border/60 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2.5 flex-1 p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-tight">Ministry Head</p>
                      <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Approved</p>
                    </div>
                  </div>
                  <div className="h-0.5 w-4 bg-slate-300 dark:bg-border shrink-0 rounded-full" />
                  <div className="flex items-center gap-2.5 flex-1 p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-tight">Admin</p>
                      <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Awaiting Final Approval</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description Block */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Description</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-muted/40 border border-slate-200/80 dark:border-border/60 text-xs font-medium text-foreground leading-relaxed whitespace-pre-wrap shadow-2xs">
              {request.details || "No additional details provided."}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
