"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Input, Button,
  Avatar, AvatarFallback, AvatarImage,
  Badge, Checkbox,
} from "@studio/ui";
import { LoaderCircle, X, CheckCircle2, AlertTriangle, Search, Hash } from "lucide-react";
import { cn } from "@studio/ui";

interface EligibleWorker {
  id: string;
  firstName: string;
  lastName: string;
  workerId?: string | null;
  avatarUrl?: string | null;
  majorMinistryId?: string | null;
  minorMinistryId?: string | null;
  priority: 1 | 2 | 3;
  unavailable: boolean;
}

interface WorkerSearchDropdownProps {
  open: boolean;
  onClose: () => void;
  assignDialog: {
    assignmentId: string;
    ministryId: string;
    roleName: string;
    reassign?: boolean;
    relatedSlots?: { id: string; workerName: string | null }[];
  } | null;
  ministries: any[];
  monthlyDuties: Record<string, number>;
  workerSearch: string;
  setWorkerSearch: (v: string) => void;
  filteredWorkers: EligibleWorker[];
  handleAssign: (workerId: string | null, slotIds?: string[]) => void;
  workerIdSearch: string;
  setWorkerIdSearch: (v: string) => void;
  workerIdResult: any | null | "not_found";
  setWorkerIdResult: (v: any) => void;
  handleWorkerIdSearch: () => void;
  workerIdSearching: boolean;
  isAssigning?: boolean;
  assigningWorkerId?: string | null;
  // legacy prop — kept for API compatibility but no longer used internally
  workers?: any[];
}

const PRIORITY_META: Record<1 | 2 | 3, { label: string; chipClass: string }> = {
  3: { label: "This Ministry",  chipClass: "bg-green-100  text-green-700  border-transparent" },
  2: { label: "Same Dept",      chipClass: "bg-blue-100   text-blue-700   border-transparent" },
  1: { label: "Other",          chipClass: "bg-gray-100   text-gray-600   border-transparent" },
};

function WorkerCard({
  w,
  dutyCount,
  ministryName,
  isAssigning,
  assigningWorkerId,
  onAssign,
}: {
  w: EligibleWorker;
  dutyCount: number;
  ministryName: string;
  isAssigning: boolean;
  assigningWorkerId: string | null | undefined;
  onAssign: (id: string) => void;
}) {
  const isThisAssigning = isAssigning && assigningWorkerId === w.id;
  const meta = PRIORITY_META[w.priority];
  const dutyVariant = dutyCount >= 3 ? "destructive" : "secondary";

  return (
    <button
      type="button"
      key={w.id}
      disabled={isAssigning}
      onClick={() => onAssign(w.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors",
        "hover:bg-accent hover:border-accent-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        w.unavailable && "border-amber-200 bg-amber-50/50"
      )}
    >
      {isThisAssigning ? (
        <div className="h-9 w-9 flex items-center justify-center shrink-0">
          <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={w.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs font-semibold">
            {w.firstName[0]}{w.lastName[0]}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{w.firstName} {w.lastName}</p>
        <p className="text-xs text-muted-foreground truncate">{ministryName}</p>
        {w.unavailable && (
          <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5 font-medium">
            <AlertTriangle className="h-3 w-3 shrink-0" /> Self-marked unavailable
          </p>
        )}
        {dutyCount >= 3 && (
          <p className="text-[11px] text-red-600 flex items-center gap-1 mt-0.5 font-medium">
            <AlertTriangle className="h-3 w-3 shrink-0" /> {dutyCount} duties this month
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge className={cn("text-[10px] h-4 px-1.5", meta.chipClass)}>{meta.label}</Badge>
        <Badge variant={dutyVariant} className="text-[10px] h-4 px-1.5">
          {dutyCount} {dutyCount === 1 ? "duty" : "duties"}
        </Badge>
      </div>
    </button>
  );
}

function WorkerSection({
  title,
  workers,
  dutyMap,
  ministries,
  isAssigning,
  assigningWorkerId,
  onAssign,
}: {
  title: string;
  workers: EligibleWorker[];
  dutyMap: Record<string, number>;
  ministries: any[];
  isAssigning: boolean;
  assigningWorkerId: string | null | undefined;
  onAssign: (id: string) => void;
}) {
  if (workers.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
        {title} · {workers.length}
      </p>
      {workers.map((w) => (
        <WorkerCard
          key={w.id}
          w={w}
          dutyCount={dutyMap[w.id] ?? 0}
          ministryName={ministries.find((m: any) => m.id === w.majorMinistryId)?.name?.replace(/^[WORDA]-/i, "") ?? "—"}
          isAssigning={isAssigning}
          assigningWorkerId={assigningWorkerId}
          onAssign={onAssign}
        />
      ))}
    </div>
  );
}

export default function WorkerSearchDropdown({
  open,
  onClose,
  assignDialog,
  ministries,
  monthlyDuties,
  workerSearch,
  setWorkerSearch,
  filteredWorkers,
  handleAssign,
  workerIdSearch,
  setWorkerIdSearch,
  workerIdResult,
  setWorkerIdResult,
  handleWorkerIdSearch,
  workerIdSearching,
  isAssigning = false,
  assigningWorkerId = null,
}: WorkerSearchDropdownProps) {
  const [showIdSearch, setShowIdSearch] = useState(false);

  // Multi-slot selection: default to the primary slot
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (assignDialog?.assignmentId) {
      setSelectedSlotIds(new Set([assignDialog.assignmentId]));
    }
  }, [assignDialog?.assignmentId]);

  const relatedSlots = assignDialog?.relatedSlots ?? [];
  const showSlotCheckboxes = !assignDialog?.reassign && relatedSlots.length > 1;

  const toggleSlot = (id: string) =>
    setSelectedSlotIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const ministryName = useMemo(() => {
    if (!assignDialog?.ministryId) return "";
    const m = ministries.find((m: any) => m.id === assignDialog.ministryId);
    return m?.name?.replace(/^[WORDA]-/i, "") ?? "";
  }, [assignDialog?.ministryId, ministries]);

  const directMembers  = useMemo(() => filteredWorkers.filter(w => w.priority === 3), [filteredWorkers]);
  const deptMembers    = useMemo(() => filteredWorkers.filter(w => w.priority === 2), [filteredWorkers]);
  const otherMembers   = useMemo(() => filteredWorkers.filter(w => w.priority === 1), [filteredWorkers]);
  const hasResults     = filteredWorkers.length > 0;

  const deptName = useMemo(() => {
    if (!assignDialog?.ministryId) return "Dept";
    const m = ministries.find((m: any) => m.id === assignDialog.ministryId);
    return (m as any)?.department || "Dept";
  }, [assignDialog?.ministryId, ministries]);

  const handleClose = () => {
    setShowIdSearch(false);
    setSelectedSlotIds(new Set());
    setWorkerIdResult(null);
    setWorkerIdSearch("");
    onClose();
  };

  const onAssignWorker = (workerId: string) =>
    handleAssign(workerId, showSlotCheckboxes ? [...selectedSlotIds] : undefined);

  const workerIdResultWorker = workerIdResult && workerIdResult !== "not_found" ? workerIdResult : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {assignDialog?.reassign ? "Reassign" : "Assign"} — {assignDialog?.roleName}
          </DialogTitle>
          {ministryName && (
            <p className="text-xs text-muted-foreground">{ministryName}</p>
          )}
        </DialogHeader>

        {/* Multi-slot checkboxes — only when role has >1 slots and not a reassign */}
        {showSlotCheckboxes && (
          <div className="rounded-lg border bg-muted/40 px-3 py-2.5 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Apply to slot{relatedSlots.length > 1 ? "s" : ""} ({selectedSlotIds.size} selected)
            </p>
            {relatedSlots.map((s, i) => (
              <label key={s.id} className="flex items-center gap-2.5 cursor-pointer text-sm select-none">
                <Checkbox
                  checked={selectedSlotIds.has(s.id)}
                  onCheckedChange={() => toggleSlot(s.id)}
                />
                <span className={s.workerName ? "text-muted-foreground" : ""}>
                  Slot {i + 1}{s.workerName ? ` · ${s.workerName}` : " · Unassigned"}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={`Search ${ministryName || "workers"} by name…`}
            value={workerSearch}
            onChange={(e) => setWorkerSearch(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {workerSearch && (
            <button
              type="button"
              onClick={() => setWorkerSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Worker list */}
        <div className="max-h-[40vh] overflow-y-auto space-y-4 pr-0.5">
          {hasResults ? (
            <>
              <WorkerSection
                title={`From ${ministryName || "This Ministry"}`}
                workers={directMembers}
                dutyMap={monthlyDuties}
                ministries={ministries}
                isAssigning={isAssigning}
                assigningWorkerId={assigningWorkerId}
                onAssign={onAssignWorker}
              />
              <WorkerSection
                title={`Other ${deptName}`}
                workers={deptMembers}
                dutyMap={monthlyDuties}
                ministries={ministries}
                isAssigning={isAssigning}
                assigningWorkerId={assigningWorkerId}
                onAssign={onAssignWorker}
              />
              <WorkerSection
                title="Other Results"
                workers={otherMembers}
                dutyMap={monthlyDuties}
                ministries={ministries}
                isAssigning={isAssigning}
                assigningWorkerId={assigningWorkerId}
                onAssign={onAssignWorker}
              />
            </>
          ) : (
            <p className="text-sm text-center text-muted-foreground py-6">
              {workerSearch ? "No workers match your search." : "No eligible workers found."}
            </p>
          )}
        </div>

        {/* Worker ID lookup — collapsed by default */}
        <div className="border-t pt-3 space-y-2">
          <button
            type="button"
            onClick={() => { setShowIdSearch(v => !v); setWorkerIdResult(null); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Hash className="h-3.5 w-3.5" />
            Search by Worker ID
          </button>

          {showIdSearch && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 3320"
                  value={workerIdSearch}
                  onChange={(e) => setWorkerIdSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleWorkerIdSearch()}
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8" onClick={handleWorkerIdSearch} disabled={workerIdSearching}>
                  {workerIdSearching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Find"}
                </Button>
              </div>

              {workerIdResult === "not_found" && (
                <p className="text-xs text-destructive">No worker found with that ID.</p>
              )}

              {workerIdResultWorker && (() => {
                const isSameMinistry =
                  workerIdResultWorker.majorMinistryId === assignDialog?.ministryId ||
                  workerIdResultWorker.minorMinistryId === assignDialog?.ministryId;
                const dutyCount = monthlyDuties[workerIdResultWorker.id] ?? 0;
                return (
                  <button
                    type="button"
                    disabled={isAssigning}
                    onClick={() => onAssignWorker(workerIdResultWorker.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-accent text-left disabled:opacity-50"
                  >
                    {isAssigning && assigningWorkerId === workerIdResultWorker.id ? (
                      <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <CheckCircle2 className={`h-5 w-5 shrink-0 ${isSameMinistry ? "text-green-500" : "text-amber-500"}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{workerIdResultWorker.firstName} {workerIdResultWorker.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ministries.find((m: any) => m.id === workerIdResultWorker.majorMinistryId)?.name?.replace(/^[WORDA]-/i, "") ?? "—"}
                        {!isSameMinistry && " · Outside this ministry"}
                      </p>
                      {dutyCount >= 3 && (
                        <p className="text-[11px] text-red-600 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3" /> {dutyCount} duties this month
                        </p>
                      )}
                    </div>
                    <Badge variant={dutyCount >= 3 ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                      {dutyCount} {dutyCount === 1 ? "duty" : "duties"}
                    </Badge>
                  </button>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t">
          {!assignDialog?.reassign ? (
            <button
              type="button"
              disabled={isAssigning}
              onClick={() => handleAssign(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              {isAssigning && assigningWorkerId === "__clear__"
                ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                : <X className="h-3.5 w-3.5" />
              }
              Clear assignment
            </button>
          ) : <span />}
          <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
