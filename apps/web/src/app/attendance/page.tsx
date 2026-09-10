"use client";

import React, { useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { AppLayout } from "@/components/layout/app-layout";
import {
  LoaderCircle, ShieldAlert, Search, Download, Upload,
  RefreshCw, CheckCircle2, Clock, QrCode, SlidersHorizontal,
  LogIn, LogOut, MoreHorizontal,
} from "lucide-react";
import { useAuthStore } from "@studio/store";
import { format, differenceInMinutes, startOfWeek } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useAttendance } from "@/hooks/use-attendance";
import { useWorkers } from "@/hooks/use-workers";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useRoles } from "@/hooks/use-roles";
import { useMinistries } from "@/hooks/use-ministries";
import { Card, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@studio/ui";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function WorkerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-[11px] font-black shrink-0">
      {init}
    </span>
  );
}

function pairSessions(records: any[]) {
  const sorted = [...records].sort((a, b) => {
    const da = a.time instanceof Date ? a.time : new Date(a.time);
    const db = b.time instanceof Date ? b.time : new Date(b.time);
    return da.getTime() - db.getTime();
  });
  const sessions: { date: Date; timeIn: Date; timeOut: Date | null; totalMinutes: number | null; isLate: boolean }[] = [];
  const ins: Date[] = [];
  for (const r of sorted) {
    const t = r.time instanceof Date ? r.time : new Date(r.time);
    if (r.type === "Clock In") {
      ins.push(t);
    } else if (r.type === "Clock Out" && ins.length > 0) {
      const tin = ins.shift()!;
      sessions.push({ date: tin, timeIn: tin, timeOut: t, totalMinutes: differenceInMinutes(t, tin), isLate: tin.getHours() > 8 || (tin.getHours() === 8 && tin.getMinutes() > 30) });
    }
  }
  for (const tin of ins) {
    sessions.push({ date: tin, timeIn: tin, timeOut: null, totalMinutes: null, isLate: tin.getHours() > 8 || (tin.getHours() === 8 && tin.getMinutes() > 30) });
  }
  return sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function formatHours(mins: number | null) {
  if (mins === null) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}.${Math.round((m / 60) * 10)}h` : `${h}h`;
}

function StatusPill({ isLate, hasOut }: { isLate: boolean; hasOut: boolean }) {
  if (!hasOut) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Active</span>;
  if (isLate) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Late</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Present</span>;
}

function AttendanceStatusBadge({ status }: { status: "timed-in" | "timed-out" | "not-yet" }) {
  if (status === "timed-in") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Timed In</span>;
  if (status === "timed-out") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" /> Timed Out</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Not Yet Timed In</span>;
}

function SelectFilter({ value, onChange, children, minWidth = "130px" }: { value: string; onChange: (v: string) => void; children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="h-9 pl-3 pr-8 rounded-xl border border-border/60 bg-background text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
        style={{ minWidth }}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { user } = useAuthStore();
  const { canViewAttendance, workerProfile, isLoading: isRoleLoading, isMinistryHead, canManageWorkers, canOperateScanner } = useUserRole();
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localToken, setLocalToken] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") || "personal") as "personal" | "manual" | "records";

  // Manual tab state
  const [assignSearch, setAssignSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Records tab state
  const [recordsSearch, setRecordsSearch] = useState("");
  const [recordsMinistryFilter, setRecordsMinistryFilter] = useState("all");
  const [recordsRoleFilter, setRecordsRoleFilter] = useState("all");
  const [recordsStatusFilter, setRecordsStatusFilter] = useState("all");
  const [recordsRange, setRecordsRange] = useState<"today" | "yesterday" | "this-week" | "this-month" | "all-time">("today");

  const isAssigner = isMinistryHead || canManageWorkers || canOperateScanner;

  const { workers: allWorkers } = useWorkers({ enabled: isAssigner, limit: 999999 });
  const { createAttendanceRecord } = useAttendance({ enabled: false });
  const { roles } = useRoles();
  const { ministries } = useMinistries();

  const todayStart = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);
  const { createMealStub, mealStubs: assignedStubs } = useMealStubs({ dateFrom: todayStart, enabled: isAssigner });
  const { updateWorker: updateWorkerSql } = useWorkers();

  const { attendanceRecords: todayAttendance } = useAttendance(
    isAssigner ? { dateFrom: todayStart } : { enabled: false }
  );

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const { attendanceRecords: allAttendance, isLoading: attendanceLoading } = useAttendance(
    workerProfile?.id ? { workerProfileId: workerProfile.id, dateFrom: weekStart } : { enabled: false }
  );

  // Records tab date range
  const recordsDateFrom = useMemo(() => {
    const now = new Date();
    if (recordsRange === "today") { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
    if (recordsRange === "yesterday") { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d; }
    if (recordsRange === "this-week") return startOfWeek(new Date(), { weekStartsOn: 1 });
    if (recordsRange === "this-month") { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
    return undefined;
  }, [recordsRange]);

  const { attendanceRecords: allRecords, isLoading: recordsLoading } = useAttendance(
    activeTab === "records" && isAssigner ? { dateFrom: recordsDateFrom } : { enabled: false }
  );

  const isLoading = attendanceLoading || isRoleLoading;

  const activeToken = localToken ?? workerProfile?.qrToken ?? workerProfile?.id ?? "";
  const qrData = workerProfile?.id ? `COG_USER:${workerProfile.id}:${activeToken}` : "";
  const userQrCodeUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=000000&margin=8`
    : "";

  const handleRegenerateQR = useCallback(async () => {
    if (!workerProfile?.id) return;
    setIsRegenerating(true);
    try {
      const newToken = generateToken();
      await updateWorkerSql({ id: workerProfile.id, data: { qrToken: newToken } });
      setLocalToken(newToken);
      toast({ title: "QR Code Regenerated", description: "Your old QR is now invalid." });
    } catch { toast({ variant: "destructive", title: "Failed to regenerate QR" }); }
    finally { setIsRegenerating(false); }
  }, [workerProfile?.id, updateWorkerSql, toast]);

  const sessions = useMemo(() => pairSessions(allAttendance || []), [allAttendance]);
  const presentCount = sessions.filter(s => s.timeOut !== null).length;
  const lateCount = sessions.filter(s => s.isLate && s.timeOut !== null).length;

  const workerStatusMap = useMemo(() => {
    const map: Record<string, { status: "timed-in" | "timed-out" | "not-yet"; lastTime: Date | null; lastType: string | null }> = {};
    if (!todayAttendance) return map;
    const sorted = [...todayAttendance].sort((a, b) => {
      const da = a.time instanceof Date ? a.time : new Date(a.time);
      const db = b.time instanceof Date ? b.time : new Date(b.time);
      return da.getTime() - db.getTime();
    });
    for (const r of sorted) {
      const t = r.time instanceof Date ? r.time : new Date(r.time);
      map[r.workerProfileId] = { status: r.type === "Clock In" ? "timed-in" : "timed-out", lastTime: t, lastType: r.type };
    }
    return map;
  }, [todayAttendance]);

  const fmtId = (id: string | null | undefined) => {
    if (!id) return "—";
    const n = parseInt(id, 10);
    return isNaN(n) ? id : `COG-${String(n).padStart(4, "0")}`;
  };

  const getRoleName = (w: any) => {
    if (w.roles?.length > 0) return w.roles[0]?.role?.name || w.roles[0]?.roleId || "Worker";
    return (roles as any[]).find(r => r.id === w.roleId)?.name || "Worker";
  };

  const filteredWorkers = useMemo(() => {
    if (!allWorkers) return [];
    return allWorkers.filter(w => {
      const name = `${w.firstName} ${w.lastName}`.toLowerCase();
      const wId = fmtId(w.workerId).toLowerCase();
      const q = assignSearch.trim().toLowerCase();
      if (q && !name.includes(q) && !wId.includes(q)) return false;
      if (ministryFilter !== "all" && w.majorMinistryId !== ministryFilter) return false;
      if (roleFilter !== "all") {
        const rn = getRoleName(w).toLowerCase();
        if (!rn.includes(roleFilter.toLowerCase())) return false;
      }
      const ws = workerStatusMap[w.id];
      const cs = ws?.status ?? "not-yet";
      if (statusFilter !== "all" && cs !== statusFilter) return false;
      return true;
    });
  }, [allWorkers, assignSearch, ministryFilter, roleFilter, statusFilter, workerStatusMap]);

  // Records tab: build rows
  const recordRows = useMemo(() => {
    const workerRecordsMap: Record<string, any[]> = {};
    for (const r of (allRecords || [])) {
      if (!workerRecordsMap[r.workerProfileId]) workerRecordsMap[r.workerProfileId] = [];
      workerRecordsMap[r.workerProfileId].push(r);
    }
    const rows: { worker: any; date: Date; timeIn: Date | null; timeOut: Date | null; hours: number | null; status: "present" | "late" | "absent" | "incomplete" }[] = [];
    for (const [wId, recs] of Object.entries(workerRecordsMap)) {
      const w = allWorkers?.find(x => x.id === wId);
      if (!w) continue;
      const dayMap: Record<string, any[]> = {};
      for (const r of recs) {
        const t = r.time instanceof Date ? r.time : new Date(r.time);
        const day = format(t, "yyyy-MM-dd");
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push({ ...r, _t: t });
      }
      for (const [day, dayRecs] of Object.entries(dayMap)) {
        const sorted = dayRecs.sort((a, b) => a._t.getTime() - b._t.getTime());
        const inRec = sorted.find(r => r.type === "Clock In");
        const outRec = [...sorted].reverse().find(r => r.type === "Clock Out");
        const timeIn = inRec ? inRec._t as Date : null;
        const timeOut = outRec ? outRec._t as Date : null;
        const hours = timeIn && timeOut ? differenceInMinutes(timeOut, timeIn) : null;
        let status: "present" | "late" | "absent" | "incomplete" = "absent";
        if (!timeIn) status = "absent";
        else if (!timeOut) status = "incomplete";
        else if (timeIn.getHours() > 8 || (timeIn.getHours() === 8 && timeIn.getMinutes() > 30)) status = "late";
        else status = "present";
        rows.push({ worker: w, date: new Date(day), timeIn, timeOut, hours, status });
      }
    }
    return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allRecords, allWorkers]);

  const filteredRecordRows = useMemo(() => {
    return recordRows.filter(r => {
      const name = `${r.worker.firstName} ${r.worker.lastName}`.toLowerCase();
      const wId = fmtId(r.worker.workerId).toLowerCase();
      const q = recordsSearch.trim().toLowerCase();
      if (q && !name.includes(q) && !wId.includes(q)) return false;
      if (recordsMinistryFilter !== "all" && r.worker.majorMinistryId !== recordsMinistryFilter) return false;
      if (recordsRoleFilter !== "all") {
        const rn = getRoleName(r.worker).toLowerCase();
        if (!rn.includes(recordsRoleFilter.toLowerCase())) return false;
      }
      if (recordsStatusFilter !== "all" && r.status !== recordsStatusFilter) return false;
      return true;
    });
  }, [recordRows, recordsSearch, recordsMinistryFilter, recordsRoleFilter, recordsStatusFilter]);

  const recordStats = useMemo(() => ({
    total: filteredRecordRows.length,
    present: filteredRecordRows.filter(r => r.status === "present").length,
    late: filteredRecordRows.filter(r => r.status === "late").length,
    absent: filteredRecordRows.filter(r => r.status === "absent").length,
    incomplete: filteredRecordRows.filter(r => r.status === "incomplete").length,
  }), [filteredRecordRows]);

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!canViewAttendance) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>No permission.</CardDescription></CardHeader></Card></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-7 pb-12 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Scan, monitor, and manage attendance across every ministry — in one workforce command center.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(activeTab === "manual" || activeTab === "records") && (
              <button className="h-9 px-3.5 flex items-center gap-2 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
                <Download className="h-4 w-4 text-muted-foreground" /> Export
              </button>
            )}
          </div>
        </div>

        {/* ── Personal Log ── */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* QR Card — col-span-5 like meal stub */}
            <div className="lg:col-span-5 bg-card rounded-2xl border border-border/60 shadow-card-dark p-6 flex flex-col items-center gap-5 min-h-[520px] justify-between">
              {/* Card header */}
              <div className="flex items-center justify-between w-full pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Personal Attendance QR</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                </span>
              </div>

              {/* QR image */}
              <div className="flex flex-col items-center gap-3 flex-1 justify-center">
                <h3 className="text-base font-bold text-foreground">Your Attendance QR</h3>
                <p className="text-xs text-muted-foreground text-center max-w-[260px] leading-relaxed">
                  Scan this QR code at the attendance scanner to record your time in/out.
                </p>
                {userQrCodeUrl ? (
                  <div className="bg-white p-4 rounded-xl border border-border/40 shadow-xs mt-1">
                    <Image src={userQrCodeUrl} alt="QR Code" width={230} height={230} unoptimized />
                  </div>
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center bg-muted/30 rounded-xl border border-border/40">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                <div className="text-center mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Worker ID</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                    {workerProfile?.workerId ? `COG-${String(parseInt(workerProfile.workerId, 10)).padStart(4, "0")}` : "—"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-2">
                <button onClick={handleRegenerateQR} disabled={isRegenerating}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all active:scale-[0.99]">
                  {isRegenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Regenerate QR Code
                </button>
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  Refreshes every 24 hours · Last generated {format(new Date(), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Right col — col-span-7 like meal stub */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">PRESENT COUNT</p>
                  <div className="flex items-start justify-between gap-2 mt-2">
                    <p className="text-4xl font-black text-foreground leading-none">{presentCount}</p>
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">this week</p>
                </div>
                <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">LATE COUNT</p>
                  <div className="flex items-start justify-between gap-2 mt-2">
                    <p className="text-4xl font-black text-foreground leading-none">{lateCount}</p>
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40"><Clock className="h-5 w-5 text-amber-500" /></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">this week</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
                <div className="px-7 pt-5 pb-4 border-b border-border/40">
                  <h2 className="text-base font-bold text-foreground">This week's personal log</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Recent attendance history.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/40">
                        {["Date", "Time In", "Time Out", "Total Hours", "Status"].map(h => (
                          <th key={h} className="px-8 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.length === 0 ? (
                        <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No records this week.</td></tr>
                      ) : sessions.map((s, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-8 py-3.5 text-sm text-foreground whitespace-nowrap">{format(s.date, "MMM d, yyyy")}</td>
                          <td className="px-8 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{format(s.timeIn, "H:mm")}</td>
                          <td className="px-8 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{s.timeOut ? format(s.timeOut, "H:mm") : "—"}</td>
                          <td className="px-8 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{formatHours(s.totalMinutes)}</td>
                          <td className="px-8 py-3.5"><StatusPill isLate={s.isLate} hasOut={s.timeOut !== null} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Manual Attendance ── */}
        {activeTab === "manual" && isAssigner && (
          <div className="flex flex-col gap-5">
            <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search ID, requestor, room..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <SelectFilter value={ministryFilter} onChange={setMinistryFilter}>
                  <option value="all">All Ministries</option>
                  {(ministries as any[]).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </SelectFilter>
                <SelectFilter value={roleFilter} onChange={setRoleFilter} minWidth="110px">
                  <option value="all">All Roles</option>
                  {(roles as any[]).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </SelectFilter>
                <SelectFilter value={statusFilter} onChange={setStatusFilter} minWidth="120px">
                  <option value="all">All Statuses</option>
                  <option value="timed-in">Timed In</option>
                  <option value="timed-out">Timed Out</option>
                  <option value="not-yet">Not Yet Timed In</option>
                </SelectFilter>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/40">
                      {["Worker", "Worker ID", "Role", "Ministry", "Current Status", "Last Activity", "Actions"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.length === 0 ? (
                      <tr><td colSpan={7} className="py-14 text-center text-sm text-muted-foreground">No workers found.</td></tr>
                    ) : filteredWorkers.map(w => {
                      const ws = workerStatusMap[w.id];
                      const currentStatus = ws?.status ?? "not-yet";
                      const lastTime = ws?.lastTime ? format(ws.lastTime, "H:mm") : null;
                      const lastType = ws?.lastType;
                      const ministry = (ministries as any[]).find(m => m.id === w.majorMinistryId);
                      const roleName = getRoleName(w);
                      return (
                        <tr key={w.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <WorkerInitials name={`${w.firstName} ${w.lastName}`} />
                              <span className="text-sm font-semibold text-foreground">{w.firstName} {w.lastName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm font-mono text-muted-foreground whitespace-nowrap">{fmtId(w.workerId)}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">{roleName}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{ministry?.name || "—"}</td>
                          <td className="px-5 py-3.5"><AttendanceStatusBadge status={currentStatus} /></td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                            {lastTime ? `${lastType === "Clock In" ? "In" : "Out"} · ${lastTime}` : "——"}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {currentStatus !== "timed-in" ? (
                                <button onClick={async () => {
                                  await createAttendanceRecord({ workerProfileId: w.id, type: "Clock In" });
                                  const hasStub = assignedStubs?.some((s: any) => { const sd = s.date instanceof Date ? s.date : new Date(s.date); return s.workerId === w.id && sd >= todayStart; });
                                  if (!hasStub) { try { await createMealStub({ workerId: w.id, workerName: `${w.firstName} ${w.lastName}`, status: "Issued", assignedBy: workerProfile?.id || user?.id, assignedByName: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.email || "System"), stubType: "daily" }); } catch {} }
                                  toast({ title: "Timed In", description: `${w.firstName} ${w.lastName}` });
                                }} className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap">
                                  <LogIn className="h-3 w-3" /> Time In
                                </button>
                              ) : (
                                <button onClick={async () => { await createAttendanceRecord({ workerProfileId: w.id, type: "Clock Out" }); toast({ title: "Timed Out", description: `${w.firstName} ${w.lastName}` }); }}
                                  className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border/60 text-foreground text-[11px] font-semibold hover:bg-muted/40 transition-colors whitespace-nowrap">
                                  <LogOut className="h-3 w-3" /> Time Out
                                </button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted/40 transition-colors">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={async () => { await createAttendanceRecord({ workerProfileId: w.id, type: "Clock In" }); toast({ title: "Timed In", description: `${w.firstName} ${w.lastName}` }); }}>
                                    <LogIn className="h-3.5 w-3.5 mr-2" /> Time In
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => { await createAttendanceRecord({ workerProfileId: w.id, type: "Clock Out" }); toast({ title: "Timed Out", description: `${w.firstName} ${w.lastName}` }); }}>
                                    <LogOut className="h-3.5 w-3.5 mr-2" /> Time Out
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Attendance Records ── */}
        {activeTab === "records" && isAssigner && (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total Today", value: recordStats.total, sub: "records", icon: <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>, ibg: "bg-primary/10" },
                { label: "Present",    value: recordStats.present,    sub: "on time",          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, ibg: "bg-emerald-50 dark:bg-emerald-950/40" },
                { label: "Late",       value: recordStats.late,       sub: "after 9:00",        icon: <Clock className="h-5 w-5 text-amber-500" />,         ibg: "bg-amber-50 dark:bg-amber-950/40" },
                { label: "Absent",     value: recordStats.absent,     sub: "no time in",        icon: <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-500" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>, ibg: "bg-red-50 dark:bg-red-950/40" },
                { label: "Incomplete", value: recordStats.incomplete, sub: "missing time out",  icon: <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-500" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>, ibg: "bg-blue-50 dark:bg-blue-950/40" },
              ].map(s => (
                <div key={s.label} className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm font-semibold text-foreground">{s.label}</p>
                    <div className={cn("p-2 rounded-xl", s.ibg)}>{s.icon}</div>
                  </div>
                  <p className="text-4xl font-black text-foreground leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Search + filters + range */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="Search ID, requestor, room..." value={recordsSearch} onChange={e => setRecordsSearch(e.target.value)}
                    className="w-full pl-9 pr-3 h-9 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <SelectFilter value={recordsMinistryFilter} onChange={setRecordsMinistryFilter}>
                    <option value="all">All Ministries</option>
                    {(ministries as any[]).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </SelectFilter>
                  <SelectFilter value={recordsRoleFilter} onChange={setRecordsRoleFilter} minWidth="110px">
                    <option value="all">All Roles</option>
                    {(roles as any[]).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </SelectFilter>
                  <SelectFilter value={recordsStatusFilter} onChange={setRecordsStatusFilter} minWidth="120px">
                    <option value="all">All Statuses</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="incomplete">Incomplete</option>
                  </SelectFilter>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Range:
                </span>
                {([
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "this-week", label: "This week" },
                  { key: "this-month", label: "This month" },
                  { key: "all-time", label: "All time" },
                ] as const).map(r => (
                  <button key={r.key} onClick={() => setRecordsRange(r.key)}
                    className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                      recordsRange === r.key
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card border-border/60 text-foreground hover:bg-muted/40")}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/40">
                      {["Worker", "Worker ID", "Role", "Ministry", "Date", "Time In", "Time Out", "Hours", "Status", "Actions"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recordsLoading ? (
                      <tr><td colSpan={10} className="py-12 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
                    ) : filteredRecordRows.length === 0 ? (
                      <tr><td colSpan={10} className="py-14 text-center text-sm text-muted-foreground">No records found.</td></tr>
                    ) : filteredRecordRows.map((row, i) => {
                      const ministry = (ministries as any[]).find(m => m.id === row.worker.majorMinistryId);
                      return (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <WorkerInitials name={`${row.worker.firstName} ${row.worker.lastName}`} />
                              <span className="text-sm font-semibold text-foreground">{row.worker.firstName} {row.worker.lastName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm font-mono text-muted-foreground whitespace-nowrap">{fmtId(row.worker.workerId)}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">{getRoleName(row.worker)}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{ministry?.name || "—"}</td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{format(row.date, "MMM d, yyyy")}</td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{row.timeIn ? format(row.timeIn, "H:mm") : "——"}</td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{row.timeOut ? format(row.timeOut, "H:mm") : "——"}</td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{formatHours(row.hours)}</td>
                          <td className="px-5 py-3.5">
                            {row.status === "present"    && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Present</span>}
                            {row.status === "late"       && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Late</span>}
                            {row.status === "absent"     && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Absent</span>}
                            {row.status === "incomplete" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Incomplete</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
