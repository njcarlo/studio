// src/components/WorkerSearchDropdown.tsx
"use client";

import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input,
  Button,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Avatar, AvatarFallback, AvatarImage,
  Badge
} from "@studio/ui";
import { LoaderCircle, X, CheckCircle2, AlertTriangle } from "lucide-react";

interface WorkerSearchDropdownProps {
  open: boolean;
  onClose: () => void;
  assignDialog: { assignmentId: string; ministryId: string; roleName: string; reassign?: boolean } | null;
  ministries: any[];
  workers: any[];
  monthlyDuties: Record<string, number>;
  workerSearch: string;
  setWorkerSearch: (v: string) => void;
  filteredWorkers: any[];
  handleAssign: (workerId: string | null) => void;
  workerIdSearch: string;
  setWorkerIdSearch: (v: string) => void;
  workerIdResult: any | null | "not_found";
  setWorkerIdResult: (v: any) => void;
  handleWorkerIdSearch: () => void;
  workerIdSearching: boolean;
  isAssigning?: boolean;
  assigningWorkerId?: string | null;
}

export default function WorkerSearchDropdown({
  open,
  onClose,
  assignDialog,
  ministries,
  workers,
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
  const getMinistryName = (id: string) => {
    const m = ministries.find((m) => m.id === id);
    return m?.name?.replace(/^[WORDA]-/i, "") ?? id;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{assignDialog?.reassign ? "Reassign Worker" : "Assign Worker"} — {assignDialog?.roleName}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="search">
          <TabsList className="w-full">
            <TabsTrigger value="search" className="flex-1">Search by Name</TabsTrigger>
            <TabsTrigger value="workerid" className="flex-1">Search by Worker ID</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="space-y-3 mt-2">
            <Input
              placeholder="Search workers..."
              value={workerSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkerSearch(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Showing workers from <strong>{assignDialog ? getMinistryName(assignDialog.ministryId) : ""}</strong>. Search by name or Worker ID.
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {!assignDialog?.reassign && (
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isAssigning}
                  onClick={() => handleAssign(null)}
                >
                  {isAssigning && assigningWorkerId === "__clear__" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Clear assignment
                </button>
              )}
              {filteredWorkers.map((w) => {
                const dutyCount = monthlyDuties[w.id] || 0;
                const isThisAssigning = isAssigning && assigningWorkerId === w.id;
                return (
                  <button
                    type="button"
                    key={w.id}
                    className="w-full flex flex-col gap-1 px-3 py-2 rounded-md hover:bg-muted text-left border border-transparent focus:border-border mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isAssigning}
                    onClick={() => handleAssign(w.id)}
                  >
                    <div className="w-full flex items-center gap-3">
                      {isThisAssigning ? (
                        <div className="h-7 w-7 flex items-center justify-center shrink-0">
                          <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={w.avatarUrl} />
                          <AvatarFallback className="text-[10px]">{w.firstName[0]}{w.lastName[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{w.firstName} {w.lastName}</p>
                        <p className="text-xs text-muted-foreground">{ministries.find((m) => m.id === w.majorMinistryId)?.name || "—"}</p>
                      </div>
                      <Badge variant={dutyCount >= 3 ? "destructive" : "secondary"} className="text-[10px] shrink-0">{dutyCount} duties</Badge>
                    </div>
                    {dutyCount >= 3 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1 mt-0.5 font-medium">
                        <AlertTriangle className="h-3 w-3" /> Exceeds 3 duties/month. You can still assign.
                      </p>
                    )}
                    {w.unavailable && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1 mt-0.5 font-medium">
                        <AlertTriangle className="h-3 w-3" /> Marked themselves unavailable this day. You can still assign.
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="workerid" className="space-y-3 mt-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Worker ID (e.g. 3320)"
                value={workerIdSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkerIdSearch(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleWorkerIdSearch()}
                autoFocus
              />
              <Button onClick={handleWorkerIdSearch} disabled={workerIdSearching} size="sm">
                {workerIdSearching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Find"}
              </Button>
            </div>
            {workerIdResult === "not_found" && (
              <p className="text-sm text-destructive">No worker found with that ID.</p>
            )}
            {workerIdResult && workerIdResult !== "not_found" && (
              (() => {
                const workerMinistryId = workerIdResult.majorMinistryId;
                const targetMinistryId = assignDialog?.ministryId;
                const isSameMinistry = workerMinistryId === targetMinistryId || workerIdResult.minorMinistryId === targetMinistryId;
                const workerMinistryName = ministries.find((m) => m.id === workerMinistryId)?.name || "—";
                const dutyCount = monthlyDuties[workerIdResult.id] || 0;
                return (
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="w-full flex flex-col gap-1 px-3 py-3 rounded-md border hover:bg-muted text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isAssigning}
                      onClick={() => handleAssign(workerIdResult.id)}
                    >
                      <div className="w-full flex items-center gap-3">
                        {isAssigning && assigningWorkerId === workerIdResult.id ? (
                          <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
                        ) : (
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${isSameMinistry ? "text-green-500" : "text-amber-500"}`} />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{workerIdResult.firstName} {workerIdResult.lastName}</p>
                          <p className="text-xs text-muted-foreground">{workerMinistryName} · {workerIdResult.status}</p>
                        </div>
                        <Badge variant={dutyCount >= 3 ? "destructive" : "secondary"} className="text-[10px] shrink-0">{dutyCount} duties</Badge>
                      </div>
                      {dutyCount >= 3 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1 mt-1 font-medium ml-8">
                          <AlertTriangle className="h-3 w-3" /> Exceeds 3 duties/month. You can still assign.
                        </p>
                      )}
                    </button>
                    {!isSameMinistry && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        ⚠ This worker is from <strong>{workerMinistryName}</strong>, not the assigned ministry. You can still assign them.
                      </p>
                    )}
                  </div>
                );
              })()
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
