"use client";

import React, { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@studio/ui";
import { useSearchParams } from "next/navigation";
import {
  LoaderCircle, Download, Users, UtensilsCrossed, Utensils,
  CalendarCheck, CheckCircle2, Clock, XCircle, TrendingUp,
  PlusCircle, Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  FileText,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  format, startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, subDays, isSunday, isWithinInterval,
  differenceInMinutes,
} from "date-fns";
import type { AttendanceRecord, MealStub, Booking, Worker, Room, Ministry } from "@studio/types";
import { cn, toJsDate } from "@/lib/utils";
import {
  createMealStub, getApprovals, getAttendanceRecords, getBookings,
  getMealStubs, getMinistries, getRooms, getWorkers,
} from "@/actions/db";
import { Badge } from "@studio/ui";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@studio/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────
function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function WorkerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-[11px] font-black shrink-0">{init}</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "present") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Present</span>;
  if (status === "late") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Late</span>;
  if (status === "absent") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Absent</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {status}</span>;
}

function StatCard({ label, value, sub, icon: Icon, iconBg, accentColor }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; accentColor: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-0 shadow-card-dark bg-card">
      <div className={cn("h-1.5 w-full", accentColor)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-4xl font-black tracking-tight text-foreground leading-none mt-3">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs", iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectFilter({ value, onChange, children, minWidth = "130px" }: { value: string; onChange: (v: string) => void; children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className="h-9 pl-3 pr-8 rounded-xl border border-border/60 bg-background text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none" style={{ minWidth }}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
    </div>
  );
}

const ITEMS_PER_PAGE = 6;

// ── Attendance Tab ────────────────────────────────────────────────────────────
function AttendanceTab() {
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);
  const todayStart = useMemo(() => startOfDay(new Date()), []);

  const { data: workers } = useQuery({ queryKey: ["workers"], queryFn: getWorkers });
  const { data: ministries } = useQuery({ queryKey: ["ministries"], queryFn: getMinistries });
  const { data: attendance, isLoading } = useQuery({
    queryKey: ["attendance-report-month"],
    queryFn: () => getAttendanceRecords({ dateFrom: monthStart, dateTo: monthEnd }),
  });

  const [search, setSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState<"today" | "this-week" | "custom">("today");
  const [page, setPage] = useState(1);

  const fmtId = (id: string | null | undefined) => {
    if (!id) return "—"; const n = parseInt(id, 10); return isNaN(n) ? id : `COG-${String(n).padStart(4, "0")}`;
  };

  // Ministry distribution chart
  const ministryChartData = useMemo(() => {
    if (!attendance || !workers || !ministries) return [];
    const counts: Record<string, number> = {};
    for (const rec of attendance) {
      if (rec.type !== "Clock In") continue;
      const w = workers.find(x => x.id === rec.workerProfileId);
      if (!w) continue;
      const min = (ministries as any[]).find(m => m.id === w.majorMinistryId);
      if (min) counts[min.name] = (counts[min.name] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [attendance, workers, ministries]);

  // Stats
  const totalTimeIns = useMemo(() => attendance?.filter(a => a.type === "Clock In").length ?? 0, [attendance]);
  const totalTimeOuts = useMemo(() => attendance?.filter(a => a.type === "Clock Out").length ?? 0, [attendance]);
  const uniqueWorkers = useMemo(() => new Set(attendance?.map(a => a.workerProfileId)).size ?? 0, [attendance]);
  const avgRate = useMemo(() => {
    if (!workers?.length) return "0%";
    const pct = Math.round((uniqueWorkers / workers.length) * 100);
    return `${pct}%`;
  }, [uniqueWorkers, workers]);

  // Build per-worker per-day rows
  const rows = useMemo(() => {
    if (!attendance || !workers) return [];
    const workerMap: Record<string, any[]> = {};
    for (const r of attendance) {
      if (!workerMap[r.workerProfileId]) workerMap[r.workerProfileId] = [];
      workerMap[r.workerProfileId].push({ ...r, _t: toJsDate(r.time) });
    }
    const result: any[] = [];
    for (const [wId, recs] of Object.entries(workerMap)) {
      const w = workers.find(x => x.id === wId);
      if (!w) continue;
      const dayMap: Record<string, any[]> = {};
      for (const r of recs) { const day = format(r._t, "yyyy-MM-dd"); if (!dayMap[day]) dayMap[day] = []; dayMap[day].push(r); }
      for (const [day, dayRecs] of Object.entries(dayMap)) {
        const sorted = dayRecs.sort((a, b) => a._t.getTime() - b._t.getTime());
        const inRec = sorted.find(r => r.type === "Clock In");
        const outRec = [...sorted].reverse().find(r => r.type === "Clock Out");
        const timeIn = inRec ? inRec._t : null;
        const timeOut = outRec ? outRec._t : null;
        const hours = timeIn && timeOut ? differenceInMinutes(timeOut, timeIn) : null;
        let status = "absent";
        if (!timeIn) status = "absent";
        else if (!timeOut) status = "incomplete";
        else if (timeIn.getHours() > 8 || (timeIn.getHours() === 8 && timeIn.getMinutes() > 30)) status = "late";
        else status = "present";
        result.push({ worker: w, date: new Date(day), timeIn, timeOut, hours, status });
      }
    }
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [attendance, workers]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const name = `${r.worker.firstName} ${r.worker.lastName}`.toLowerCase();
      const q = search.trim().toLowerCase();
      if (q && !name.includes(q) && !fmtId(r.worker.workerId).toLowerCase().includes(q)) return false;
      if (ministryFilter !== "all" && r.worker.majorMinistryId !== ministryFilter) return false;
      if (workerTypeFilter !== "all" && r.worker.employmentType !== workerTypeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, ministryFilter, workerTypeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    exportCsv(`attendance-report.csv`,
      ["Worker", "Ministry", "Date", "Time In", "Time Out", "Hours", "Status"],
      filteredRows.map(r => [
        `${r.worker.firstName} ${r.worker.lastName}`,
        (ministries as any[])?.find(m => m.id === r.worker.majorMinistryId)?.name || "—",
        format(r.date, "MMM d, yyyy"),
        r.timeIn ? format(r.timeIn, "H:mm") : "—",
        r.timeOut ? format(r.timeOut, "H:mm") : "—",
        r.hours != null ? `${Math.floor(r.hours / 60)}h ${r.hours % 60}m` : "—",
        r.status,
      ])
    );
  };

  if (isLoading) return <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Time Ins" value={totalTimeIns} sub="this month" icon={CheckCircle2} iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-500" accentColor="bg-blue-500" />
        <StatCard label="Total Time Outs" value={totalTimeOuts} sub="this month" icon={XCircle} iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500" accentColor="bg-emerald-500" />
        <StatCard label="Unique Workers" value={uniqueWorkers} sub="who clocked in" icon={Users} iconBg="bg-orange-50 dark:bg-orange-950/40 text-orange-500" accentColor="bg-orange-400" />
        <StatCard label="Avg. Attendance Rate" value={avgRate} sub="of total workforce" icon={TrendingUp} iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-500" accentColor="bg-amber-400" />
      </div>

      {/* Chart */}
      {ministryChartData.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-6">
          <h2 className="text-base font-bold text-foreground mb-0.5">Attendance by Ministry</h2>
          <p className="text-xs text-muted-foreground mb-5">Logs per ministry this month.</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ministryChartData} margin={{ top: 4, right: 4, left: -20, bottom: 5 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: "#9ca3af" }} interval={0} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "12px" }} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Bar dataKey="count" name="Clock Ins" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 h-9 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <SelectFilter value={ministryFilter} onChange={v => { setMinistryFilter(v); setPage(1); }}>
              <option value="all">Ministry</option>
              {(ministries as any[] || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </SelectFilter>
            <SelectFilter value={workerTypeFilter} onChange={v => { setWorkerTypeFilter(v); setPage(1); }} minWidth="120px">
              <option value="all">Worker Type</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Volunteer">Volunteer</option>
              <option value="On-Call">On-Call</option>
            </SelectFilter>
            <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} minWidth="110px">
              <option value="all">Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="incomplete">Incomplete</option>
            </SelectFilter>
          </div>
        </div>
        {/* Range pills */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters:
          </span>
          {([
            { key: "today", label: "Today" },
            { key: "this-week", label: "This Week" },
            { key: "custom", label: "Custom Range" },
          ] as const).map(r => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                range === r.key ? "bg-foreground text-background border-foreground" : "bg-card border-border/60 text-foreground hover:bg-muted/40")}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-border/40 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Recent Attendance Records</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 h-8 rounded-lg border border-border/60 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <button onClick={handleExport} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border/60 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border/40">
                {["Worker", "Ministry", "Time In", "Time Out", "Total Hours", "Date", "Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr><td colSpan={7} className="py-14 text-center text-sm text-muted-foreground">No records found.</td></tr>
              ) : paginatedRows.map((row, i) => {
                const ministry = (ministries as any[] || []).find(m => m.id === row.worker.majorMinistryId);
                return (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <WorkerInitials name={`${row.worker.firstName} ${row.worker.lastName}`} />
                        <span className="text-sm font-semibold text-foreground">{row.worker.firstName} {row.worker.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{ministry?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{row.timeIn ? format(row.timeIn, "H:mm") : "——"}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{row.timeOut ? format(row.timeOut, "H:mm") : "——"}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                      {row.hours != null ? `${(row.hours / 60).toFixed(1)}h` : "——"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{format(row.date, "MMM d, yyyy")}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={row.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Showing {filteredRows.length > 0 ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filteredRows.length)}` : "0"} of {filteredRows.length} records
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 3 + i;
                if (pageNum + (5 - i) > totalPages) pageNum = totalPages - 4 + i;
              }
              if (pageNum <= 0 || pageNum > totalPages) return null;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={cn("h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all",
                    page === pageNum ? "bg-primary text-primary-foreground shadow-xs" : "border border-border text-foreground hover:bg-muted")}>
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Meal Stub Claims Tab ──────────────────────────────────────────────────────
function MealStubClaimsTab() {
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);

  const { data: mealstubs, isLoading } = useQuery({
    queryKey: ["mealstubs-report"],
    queryFn: () => getMealStubs({ dateFrom: monthStart, dateTo: monthEnd }),
  });
  const { data: workers } = useQuery({ queryKey: ["workers"], queryFn: getWorkers });
  const { data: ministries } = useQuery({ queryKey: ["ministries"], queryFn: getMinistries });

  const [search, setSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState<"today" | "this-week" | "custom">("today");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    if (!mealstubs) return { issued: 0, claimed: 0, unclaimed: 0, claimRate: "0%" };
    const claimed = mealstubs.filter(s => s.status === "Claimed").length;
    const unclaimed = mealstubs.length - claimed;
    return {
      issued: mealstubs.length,
      claimed,
      unclaimed,
      claimRate: mealstubs.length > 0 ? `${Math.round((claimed / mealstubs.length) * 100)}%` : "0%",
    };
  }, [mealstubs]);

  const getMinistry = useCallback((wId: string) => {
    const w = workers?.find(x => x.id === wId);
    if (!w) return null;
    return (ministries as any[] || []).find(m => m.id === w.majorMinistryId);
  }, [workers, ministries]);

  const rows = useMemo(() => {
    return (mealstubs || []).map(s => {
      const w = workers?.find(x => x.id === s.workerId);
      const min = w ? (ministries as any[] || []).find(m => m.id === w.majorMinistryId) : null;
      return { ...s, worker: w, ministry: min };
    });
  }, [mealstubs, workers, ministries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (q && !r.workerName.toLowerCase().includes(q)) return false;
      if (ministryFilter !== "all" && r.ministry?.id !== ministryFilter) return false;
      if (workerTypeFilter !== "all" && r.worker?.employmentType !== workerTypeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, ministryFilter, workerTypeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    exportCsv("mealstub-claims.csv",
      ["Worker", "Ministry", "Date Issued", "Date Claimed", "Status", "Claim Type"],
      filtered.map(s => [
        s.workerName,
        s.ministry?.name || "—",
        format(toJsDate(s.date), "MMM d, yyyy"),
        (s as any).claimedAt ? format(toJsDate((s as any).claimedAt), "MMM d, yyyy") : "——",
        s.status,
        (s as any).stubType || "—",
      ])
    );
  };

  // Donut chart data
  const donutData = [
    { name: "Claimed", value: stats.claimed, color: "#22c55e" },
    { name: "Unclaimed", value: stats.unclaimed, color: "#f59e0b" },
  ];

  if (isLoading) return <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Issued" value={stats.issued.toLocaleString()} sub="this month" icon={UtensilsCrossed} iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-500" accentColor="bg-blue-500" />
        <StatCard label="Total Claimed" value={stats.claimed.toLocaleString()} sub="this month" icon={CheckCircle2} iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500" accentColor="bg-emerald-500" />
        <StatCard label="Total Unclaimed" value={stats.unclaimed.toLocaleString()} sub="this month" icon={XCircle} iconBg="bg-orange-50 dark:bg-orange-950/40 text-orange-500" accentColor="bg-orange-400" />
        <StatCard label="Claim Rate" value={stats.claimRate} sub="of issued stubs" icon={TrendingUp} iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-500" accentColor="bg-amber-400" />
      </div>

      {/* Filter bar */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters:
            </span>
            {([{ key: "today", label: "Today" }, { key: "this-week", label: "This Week" }, { key: "custom", label: "Custom Range" }] as const).map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                  range === r.key ? "bg-foreground text-background border-foreground" : "bg-card border-border/60 text-foreground hover:bg-muted/40")}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto self-end sm:self-auto">
            <SelectFilter value={ministryFilter} onChange={v => { setMinistryFilter(v); setPage(1); }}>
              <option value="all">Ministry</option>
              {(ministries as any[] || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </SelectFilter>
            <SelectFilter value={workerTypeFilter} onChange={v => { setWorkerTypeFilter(v); setPage(1); }} minWidth="120px">
              <option value="all">Worker Type</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Volunteer">Volunteer</option>
              <option value="On-Call">On-Call</option>
            </SelectFilter>
            <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} minWidth="110px">
              <option value="all">Status</option>
              <option value="Claimed">Claimed</option>
              <option value="Issued">Unclaimed</option>
            </SelectFilter>
          </div>
        </div>
      </div>

      {/* Table + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
        {/* Table */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-border/40 flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-foreground">Recent Attendance Records</h2>
            <div className="flex items-center gap-2">
              <div className="relative w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-8 pr-3 h-8 rounded-lg border border-border/60 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <button onClick={handleExport} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border/60 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 border-b border-border/40">
                  {["Worker", "Ministry", "Date Issued", "Date Claimed", "Status", "Claim Type"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="py-14 text-center text-sm text-muted-foreground">No records found.</td></tr>
                ) : paginated.map((s, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <WorkerInitials name={s.workerName} />
                        <span className="text-sm font-semibold text-foreground">{s.workerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{s.ministry?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{format(toJsDate(s.date), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                      {(s as any).claimedAt ? format(toJsDate((s as any).claimedAt), "MMM d, yyyy") : "——"}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.status === "Claimed"
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Claimed</span>
                        : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unclaimed</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60 capitalize">
                        {(s as any).stubType || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length > 0 ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)}` : "0"} of {filtered.length} records
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = i + 1;
                if (totalPages > 5 && page > 3) { n = page - 3 + i; if (n + (5 - i) > totalPages) n = totalPages - 4 + i; }
                if (n <= 0 || n > totalPages) return null;
                return <button key={n} onClick={() => setPage(n)} className={cn("h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all", page === n ? "bg-primary text-primary-foreground shadow-xs" : "border border-border text-foreground hover:bg-muted")}>{n}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5">
          <h3 className="text-sm font-bold text-foreground mb-0.5">Claimed vs Unclaimed</h3>
          <p className="text-xs text-muted-foreground mb-4">This month.</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {donutData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Allocations Tab ───────────────────────────────────────────────────────────
function AllocationsTab() {
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);
  const { workerProfile, isSuperAdmin } = useUserRole();
  const { toast } = useToast();

  const { data: workers, isLoading: wL } = useQuery({ queryKey: ["workers"], queryFn: getWorkers });
  const { data: ministries, isLoading: mL } = useQuery({ queryKey: ["ministries"], queryFn: getMinistries });
  const { data: mealstubs, isLoading: msL } = useQuery({
    queryKey: ["mealstubs-alloc"],
    queryFn: () => getMealStubs({ dateFrom: monthStart, dateTo: monthEnd }),
  });

  const [search, setSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [range, setRange] = useState<"today" | "this-week" | "custom">("today");
  const [page, setPage] = useState(1);

  const getMinistry = useCallback((id: string) => (ministries as any[] || []).find(m => m.id === id), [ministries]);
  const isAssignerFor = useCallback((worker: Worker) => {
    if (isSuperAdmin) return true;
    if (!workerProfile) return false;
    return getMinistry(worker.majorMinistryId)?.mealStubAssignerId === workerProfile.id;
  }, [isSuperAdmin, workerProfile, getMinistry]);

  const eligibleWorkers = useMemo(() => (workers || []).filter(w => w.employmentType === "Full-Time" || w.employmentType === "On-Call" || w.employmentType === "Part-Time" || w.employmentType === "Volunteer"), [workers]);

  const getStats = useCallback((wId: string) => {
    const stubs = (mealstubs || []).filter(s => s.workerId === wId);
    const weekday = stubs.filter(s => !isSunday(toJsDate(s.date))).length;
    const sunday = stubs.filter(s => isSunday(toJsDate(s.date))).length;
    const weekdayLimit = 5;
    const sundayLimit = 2;
    const remaining = Math.max(0, (weekdayLimit - weekday) + (sundayLimit - sunday));
    return { weekday, sunday, weekdayLimit, sundayLimit, remaining };
  }, [mealstubs]);

  // Summary stats
  const totalAllocations = useMemo(() => (mealstubs || []).length, [mealstubs]);
  const fullTimeCount = useMemo(() => (workers || []).filter(w => w.employmentType === "Full-Time").length, [workers]);
  const onCallCount = useMemo(() => (workers || []).filter(w => w.employmentType === "On-Call").length, [workers]);
  const remainingAllocations = useMemo(() => {
    const maxPerWorker = 7;
    const total = eligibleWorkers.length * maxPerWorker;
    return Math.max(0, total - totalAllocations);
  }, [eligibleWorkers, totalAllocations]);

  // Allocation usage for sidebar
  const weekdayUsed = useMemo(() => (mealstubs || []).filter(s => !isSunday(toJsDate(s.date))).length, [mealstubs]);
  const sundayUsed = useMemo(() => (mealstubs || []).filter(s => isSunday(toJsDate(s.date))).length, [mealstubs]);
  const weekdayMax = eligibleWorkers.length * 5;
  const sundayMax = eligibleWorkers.length * 2;
  const ftAllocated = useMemo(() => (mealstubs || []).filter(s => { const w = workers?.find(x => x.id === s.workerId); return w?.employmentType === "Full-Time"; }).length, [mealstubs, workers]);
  const ftMax = fullTimeCount * 7;
  const ocAllocated = useMemo(() => (mealstubs || []).filter(s => { const w = workers?.find(x => x.id === s.workerId); return w?.employmentType === "On-Call"; }).length, [mealstubs, workers]);
  const ocMax = onCallCount * 7;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return eligibleWorkers.filter(w => {
      const name = `${w.firstName} ${w.lastName}`.toLowerCase();
      if (q && !name.includes(q)) return false;
      if (ministryFilter !== "all" && w.majorMinistryId !== ministryFilter) return false;
      if (workerTypeFilter !== "all" && w.employmentType !== workerTypeFilter) return false;
      return true;
    });
  }, [eligibleWorkers, search, ministryFilter, workerTypeFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    exportCsv("allocations.csv",
      ["Worker", "Ministry", "Worker Type", "Weekday Used", "Sunday Used", "Remaining"],
      filtered.map(w => {
        const s = getStats(w.id);
        return [`${w.firstName} ${w.lastName}`, getMinistry(w.majorMinistryId)?.name || "—", w.employmentType || "—", `${s.weekday}/${s.weekdayLimit}`, `${s.sunday}/${s.sundayLimit}`, s.remaining];
      })
    );
  };

  if (wL || mL || msL) return <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;

  function UsageBar({ label, used, max, color }: { label: string; used: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">{used.toLocaleString()} / {max.toLocaleString()}</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Allocations" value={totalAllocations.toLocaleString()} sub="this month" icon={UtensilsCrossed} iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-500" accentColor="bg-blue-500" />
        <StatCard label="Full-Time Workers" value={fullTimeCount.toLocaleString()} sub="eligible" icon={CheckCircle2} iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500" accentColor="bg-emerald-500" />
        <StatCard label="On-Call Workers" value={onCallCount.toLocaleString()} sub="eligible" icon={Users} iconBg="bg-orange-50 dark:bg-orange-950/40 text-orange-500" accentColor="bg-orange-400" />
        <StatCard label="Remaining Allocations" value={remainingAllocations.toLocaleString()} sub="available" icon={TrendingUp} iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-500" accentColor="bg-amber-400" />
      </div>

      {/* Filter bar */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters:
            </span>
            {([{ key: "today", label: "Today" }, { key: "this-week", label: "This Week" }, { key: "custom", label: "Custom Range" }] as const).map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                  range === r.key ? "bg-foreground text-background border-foreground" : "bg-card border-border/60 text-foreground hover:bg-muted/40")}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto self-end sm:self-auto">
            <SelectFilter value={ministryFilter} onChange={v => { setMinistryFilter(v); setPage(1); }}>
              <option value="all">Ministry</option>
              {(ministries as any[] || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </SelectFilter>
            <SelectFilter value={workerTypeFilter} onChange={v => { setWorkerTypeFilter(v); setPage(1); }} minWidth="120px">
              <option value="all">Worker Type</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Volunteer">Volunteer</option>
              <option value="On-Call">On-Call</option>
            </SelectFilter>
          </div>
        </div>
      </div>

      {/* Table + Usage sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Table */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-border/40 flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-foreground">Recent Attendance Records</h2>
            <div className="flex items-center gap-2">
              <div className="relative w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-8 pr-3 h-8 rounded-lg border border-border/60 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <button onClick={handleExport} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border/60 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 border-b border-border/40">
                  {["Worker", "Ministry", "Worker Type", "Weekday Used", "Sunday Used", "Remaining"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="py-14 text-center text-sm text-muted-foreground">No workers found.</td></tr>
                ) : paginated.map((worker, i) => {
                  const s = getStats(worker.id);
                  const min = getMinistry(worker.majorMinistryId);
                  return (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <WorkerInitials name={`${worker.firstName} ${worker.lastName}`} />
                          <span className="text-sm font-semibold text-foreground">{worker.firstName} {worker.lastName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{min?.name || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">{worker.employmentType || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{s.weekday}/{s.weekdayLimit}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{s.sunday}/{s.sundayLimit}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-foreground">{s.remaining}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length > 0 ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)}` : "0"} of {filtered.length} records
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let n = i + 1; if (totalPages > 5 && page > 3) { n = page - 3 + i; if (n + (5 - i) > totalPages) n = totalPages - 4 + i; } if (n <= 0 || n > totalPages) return null; return <button key={n} onClick={() => setPage(n)} className={cn("h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all", page === n ? "bg-primary text-primary-foreground shadow-xs" : "border border-border text-foreground hover:bg-muted")}>{n}</button>; })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Allocation Usage sidebar */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Allocation Usage</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Used vs available this month.</p>
          </div>
          <div className="flex flex-col gap-4">
            <UsageBar label="Weekday Allocation" used={weekdayUsed} max={weekdayMax} color="#3b82f6" />
            <UsageBar label="Sunday Allocation" used={sundayUsed} max={sundayMax} color="#22c55e" />
            <UsageBar label="Full-Time Allocations" used={ftAllocated} max={ftMax} color="#f97316" />
            <UsageBar label="On-Call Allocations" used={ocAllocated} max={ocMax} color="#f59e0b" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reservations Tab ──────────────────────────────────────────────────────────
function ReservationsTab() {
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);
  const { data: workers } = useQuery({ queryKey: ["workers"], queryFn: getWorkers });
  const { data: rooms } = useQuery({ queryKey: ["rooms"], queryFn: getRooms });
  const { data: ministries } = useQuery({ queryKey: ["ministries"], queryFn: getMinistries });
  const { data: reservations, isLoading } = useQuery({
    queryKey: ["bookings-report"],
    queryFn: () => getBookings({ dateFrom: monthStart, dateTo: monthEnd }),
  });

  const [search, setSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState<"today" | "this-week" | "custom">("today");
  const [page, setPage] = useState(1);

  const getWorkerName = useCallback((id: string) => { const w = workers?.find(x => x.id === id); return w ? `${w.firstName} ${w.lastName}` : "Unknown"; }, [workers]);
  const getRoomName = useCallback((id: string) => rooms?.find(r => r.id === id)?.name ?? "Unknown", [rooms]);
  const getWorker = useCallback((id: string) => workers?.find(x => x.id === id), [workers]);
  const getWorkerMinistry = useCallback((wId: string) => {
    const w = workers?.find(x => x.id === wId);
    if (!w) return null;
    return (ministries as any[] || []).find(m => m.id === w.majorMinistryId);
  }, [workers, ministries]);

  const stats = useMemo(() => {
    if (!reservations) return { total: 0, approved: 0, pending: 0, rejected: 0 };
    return {
      total: reservations.length,
      approved: reservations.filter(r => r.status === "Approved").length,
      pending: reservations.filter(r => r.status?.startsWith("Pending")).length,
      rejected: reservations.filter(r => r.status === "Rejected").length,
    };
  }, [reservations]);

  // Status distribution donut
  const donutData = [
    { name: "Approved", value: stats.approved, color: "#22c55e" },
    { name: "Pending",  value: stats.pending,  color: "#f59e0b" },
    { name: "Rejected", value: stats.rejected,  color: "#ef4444" },
  ];

  // Most utilized rooms (top 5)
  const topRooms = useMemo(() => {
    if (!reservations || !rooms) return [];
    const counts: Record<string, number> = {};
    for (const r of reservations) {
      counts[r.roomId] = (counts[r.roomId] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([roomId, count]) => ({ name: getRoomName(roomId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [reservations, rooms, getRoomName]);

  const maxRoomCount = topRooms[0]?.count || 1;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (reservations || []).filter(r => {
      if (q && !r.title.toLowerCase().includes(q) && !getWorkerName(r.workerProfileId).toLowerCase().includes(q)) return false;
      if (ministryFilter !== "all") {
        const min = r.workerProfileId ? getWorkerMinistry(r.workerProfileId) : null;
        if (min?.id !== ministryFilter) return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && !r.status?.startsWith("Pending")) return false;
        if (statusFilter === "approved" && r.status !== "Approved") return false;
        if (statusFilter === "rejected" && r.status !== "Rejected") return false;
      }
      return true;
    });
  }, [reservations, search, ministryFilter, statusFilter, getWorkerName, getWorkerMinistry]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    exportCsv("reservations.csv",
      ["Worker", "Ministry", "Facility", "Date", "Time", "Purpose", "Status"],
      filtered.map(r => {
        const start = toJsDate(r.start);
        const end = toJsDate(r.end);
        const min = r.workerProfileId ? getWorkerMinistry(r.workerProfileId) : null;
        return [
          r.workerProfileId ? getWorkerName(r.workerProfileId) : "N/A",
          min?.name || "—",
          getRoomName(r.roomId),
          format(start, "MMM d, yyyy"),
          `${format(start, "H:mm")} - ${format(end, "H:mm")}`,
          r.purpose || r.title || "—",
          r.status,
        ];
      })
    );
  };

  if (isLoading) return <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={stats.total.toLocaleString()} sub="this month" icon={CalendarCheck} iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-500" accentColor="bg-blue-500" />
        <StatCard label="Approved" value={stats.approved.toLocaleString()} sub="confirmed" icon={CheckCircle2} iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500" accentColor="bg-emerald-500" />
        <StatCard label="Pending" value={stats.pending.toLocaleString()} sub="awaiting" icon={Clock} iconBg="bg-orange-50 dark:bg-orange-950/40 text-orange-500" accentColor="bg-orange-400" />
        <StatCard label="Rejected" value={stats.rejected.toLocaleString()} sub="declined" icon={XCircle} iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-500" accentColor="bg-amber-400" />
      </div>

      {/* Filter bar */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters:
            </span>
            {([{ key: "today", label: "Today" }, { key: "this-week", label: "This Week" }, { key: "custom", label: "Custom Range" }] as const).map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                  range === r.key ? "bg-foreground text-background border-foreground" : "bg-card border-border/60 text-foreground hover:bg-muted/40")}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto self-end sm:self-auto">
            <SelectFilter value={ministryFilter} onChange={v => { setMinistryFilter(v); setPage(1); }}>
              <option value="all">Ministry</option>
              {(ministries as any[] || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </SelectFilter>
            <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} minWidth="110px">
              <option value="all">Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </SelectFilter>
          </div>
        </div>
      </div>

      {/* Table + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Table */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-border/40 flex items-center justify-between gap-4">
            <h2 className="text-base font-bold text-foreground">Recent Attendance Records</h2>
            <div className="flex items-center gap-2">
              <div className="relative w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-8 pr-3 h-8 rounded-lg border border-border/60 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <button onClick={handleExport} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-border/60 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40 border-b border-border/40">
                  {["Worker", "Ministry", "Facility", "Date", "Time", "Purpose", "Status"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="py-14 text-center text-sm text-muted-foreground">No records found.</td></tr>
                ) : paginated.map((r, i) => {
                  const start = toJsDate(r.start);
                  const end = toJsDate(r.end);
                  const w = r.workerProfileId ? getWorker(r.workerProfileId) : null;
                  const min = r.workerProfileId ? getWorkerMinistry(r.workerProfileId) : null;
                  const name = w ? `${w.firstName} ${w.lastName}` : "Unknown";
                  return (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <WorkerInitials name={name} />
                          <span className="text-sm font-semibold text-foreground">{name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{min?.name || "—"}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{getRoomName(r.roomId)}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{format(start, "MMM d, yyyy")}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">{format(start, "H:mm")} - {format(end, "H:mm")}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{r.purpose || r.title || "—"}</td>
                      <td className="px-5 py-3.5">
                        {r.status === "Approved" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Approved</span>}
                        {r.status?.startsWith("Pending") && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending</span>}
                        {r.status === "Rejected" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Rejected</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length > 0 ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)}` : "0"} of {filtered.length} records
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let n = i + 1; if (totalPages > 5 && page > 3) { n = page - 3 + i; if (n + (5 - i) > totalPages) n = totalPages - 4 + i; } if (n <= 0 || n > totalPages) return null; return <button key={n} onClick={() => setPage(n)} className={cn("h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all", page === n ? "bg-primary text-primary-foreground shadow-xs" : "border border-border text-foreground hover:bg-muted")}>{n}</button>; })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          {/* Status Distribution donut */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5">
            <h3 className="text-sm font-bold text-foreground mb-0.5">Status Distribution</h3>
            <p className="text-xs text-muted-foreground mb-3">All reservation requests</p>
            <div className="h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-3 mt-1">
              {donutData.map(d => (
                <div key={d.name} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          {/* Most Utilized Rooms */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5">
            <h3 className="text-sm font-bold text-foreground mb-0.5">Most Utilized Rooms</h3>
            <p className="text-xs text-muted-foreground mb-4">Top 5 facilities this month.</p>
            <div className="flex flex-col gap-3">
              {topRooms.map((room, i) => (
                <div key={room.name} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground truncate">{room.name}</span>
                      <span className="text-[11px] text-muted-foreground ml-2 shrink-0">{room.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round((room.count / maxRoomCount) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {topRooms.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No data.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { canViewReports, isLoading } = useUserRole();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") || "attendance") as "attendance" | "meal-stubs" | "allocations" | "reservations";

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  if (!canViewReports) return <AppLayout><div className="p-8 text-center text-sm text-muted-foreground">Access Denied</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-7 pb-12 w-full">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">Reports &amp; Analytics</h1>
          <div className="flex items-center justify-between gap-4 mt-0.5">
            <p className="text-sm text-muted-foreground">Monitor attendance, meal stub usage, allocations, and room reservations across the organization.</p>
            <button className="h-9 px-4 flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0">
              <Download className="h-4 w-4" /> Export All Reports
            </button>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "attendance"   && <AttendanceTab />}
        {activeTab === "meal-stubs"   && <MealStubClaimsTab />}
        {activeTab === "allocations"  && <AllocationsTab />}
        {activeTab === "reservations" && <ReservationsTab />}
      </div>
    </AppLayout>
  );
}
