"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@studio/ui";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import {
  LoaderCircle,
  Clock,
  Utensils,
  Calendar,
  Users,
  AlertCircle,
  ArrowRight,
  User,
  Box,
  CheckCircle2,
  CalendarCheck,
  ChevronDown,
  Building2,
  CalendarDays,
} from "lucide-react";
import { useWorkers } from "@/hooks/use-workers";
import { useAttendance } from "@/hooks/use-attendance";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useApprovals } from "@/hooks/use-approvals";
import { useBookings } from "@/hooks/use-bookings";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format, subDays, isToday, isYesterday, startOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const {
    workerProfile,
    isLoading: userLoading,
    isSuperAdmin,
    isMinistryHead,
    isMinistryApprover,
    canManageWorkers,
    canManageMinistries,
    canManageRoles,
  } = useUserRole();

  const isManager =
    isSuperAdmin ||
    isMinistryHead ||
    isMinistryApprover ||
    canManageWorkers ||
    canManageMinistries ||
    canManageRoles ||
    (workerProfile as any)?.role === "Admin" ||
    (workerProfile as any)?.roleId === "admin" ||
    (user as any)?.role === "admin";

  const userName =
    workerProfile?.firstName ||
    user?.displayName?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "User";

  if (userLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground">
            Welcome back, {userName}!
          </h1>
        </div>

        {isManager ? <AdminDashboard /> : <WorkerDashboard />}
      </div>
    </AppLayout>
  );
}

// ── Admin / Ministry Head view ─────────────────────────────────────────────────
function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<"7" | "14" | "30">("7");

  const { workers, isLoading: workersLoading } = useWorkers();
  const { attendanceRecords, isLoading: attendanceLoading } = useAttendance({});
  const { mealStubs, isLoading: mealStubsLoading } = useMealStubs({});
  const { approvals, isLoading: approvalsLoading } = useApprovals();
  const { bookings, isLoading: bookingsLoading } = useBookings({});

  const isLoading =
    workersLoading ||
    attendanceLoading ||
    mealStubsLoading ||
    approvalsLoading ||
    bookingsLoading;

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Stat 1: Reservations Today
  const todayReservations = useMemo(() => {
    if (!bookings || bookings.length === 0) return 0;
    return (bookings as any[]).filter((b) => {
      if (!b.start) return false;
      const d = b.start instanceof Date ? b.start : new Date(b.start);
      return format(d, "yyyy-MM-dd") === todayStr || isToday(d);
    }).length;
  }, [bookings, todayStr]);

  // Stat 2: Clock Ins Today
  const todayClockIns = useMemo(() => {
    if (!attendanceRecords) return 0;
    return (attendanceRecords as any[]).filter((a) => {
      if (!a.time) return false;
      const d =
        a.time instanceof Date
          ? a.time
          : new Date(a.time?.seconds ? a.time.seconds * 1000 : a.time);
      return a.type === "Clock In" && (format(d, "yyyy-MM-dd") === todayStr || isToday(d));
    }).length;
  }, [attendanceRecords, todayStr]);

  // Stat 3: Meals Claimed & Issued
  const mealsClaimed = useMemo(() => {
    return (mealStubs as any[])?.filter((m) => m.status === "Claimed").length ?? 0;
  }, [mealStubs]);

  const totalMealsIssued = useMemo(() => {
    return (mealStubs as any[])?.length ?? 0;
  }, [mealStubs]);

  // Stat 4: Pending Approvals
  const pendingApprovals = useMemo(() => {
    return (
      (approvals as any[])?.filter((a) => a.status?.startsWith("Pending")).length ?? 0
    );
  }, [approvals]);

  // Demographics / Worker Status
  const totalWorkers = workers?.length ?? 0;
  const activeWorkers =
    (workers as any[])?.filter((w) => w.status === "Active" || !w.status).length ?? 0;
  const inactiveWorkers =
    (workers as any[])?.filter((w) => w.status === "Inactive").length ?? 0;
  const pendingWorkers =
    (workers as any[])?.filter((w) => w.status === "Pending Approval" || w.status === "Pending").length ?? 0;

  const activePct = totalWorkers > 0 ? Math.round((activeWorkers / totalWorkers) * 100) : 0;
  const inactivePct = totalWorkers > 0 ? Math.round((inactiveWorkers / totalWorkers) * 100) : 0;
  const pendingPct = totalWorkers > 0 ? Math.round((pendingWorkers / totalWorkers) * 100) : 0;

  const demographicsData = useMemo(() => {
    const data = [
      { name: "Active", value: activeWorkers, color: "#10b981" },
      { name: "Inactive", value: inactiveWorkers, color: "#64748b" },
      { name: "Pending", value: pendingWorkers, color: "#f59e0b" },
    ].filter((d) => d.value > 0);

    return data.length > 0 ? data : [{ name: "Active", value: 1, color: "#10b981" }];
  }, [activeWorkers, inactiveWorkers, pendingWorkers]);

  // Daily Check-Ins chart data
  const { chartData, periodTotal, prevPeriodTotal, pctChange } = useMemo(() => {
    const daysCount = parseInt(timeRange, 10) || 7;

    if (daysCount === 7) {
      // Days of the week Monday to Sunday
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      
      const currentWeekData = dayNames.map((name, idx) => {
        // Find attendance matching this day offset
        const targetDate = subDays(now, 6 - idx);
        const targetStr = format(targetDate, "yyyy-MM-dd");
        const count =
          (attendanceRecords as any[])?.filter((a) => {
            if (!a.time) return false;
            const d =
              a.time instanceof Date
                ? a.time
                : new Date(a.time?.seconds ? a.time.seconds * 1000 : a.time);
            return a.type === "Clock In" && format(d, "yyyy-MM-dd") === targetStr;
          }).length ?? 0;

        return { day: name, count, dateStr: targetStr };
      });

      const total = currentWeekData.reduce((acc, curr) => acc + curr.count, 0);

      // Compute previous week's real data for genuine comparison
      const prevWeekData = dayNames.map((_, idx) => {
        const targetDate = subDays(now, 13 - idx);
        const targetStr = format(targetDate, "yyyy-MM-dd");
        return (attendanceRecords as any[])?.filter((a) => {
          if (!a.time) return false;
          const d =
            a.time instanceof Date
              ? a.time
              : new Date(a.time?.seconds ? a.time.seconds * 1000 : a.time);
          return a.type === "Clock In" && format(d, "yyyy-MM-dd") === targetStr;
        }).length ?? 0;
      });
      const prevTotal = prevWeekData.reduce((acc, curr) => acc + curr, 0);
      const diff = total - prevTotal;
      const pct = prevTotal > 0 ? Math.round((diff / prevTotal) * 100) : 0;

      return {
        chartData: currentWeekData,
        periodTotal: total,
        prevPeriodTotal: prevTotal,
        pctChange: pct,
      };
    } else {
      const pastDays = Array.from({ length: daysCount }, (_, i) => {
        const date = subDays(new Date(), daysCount - 1 - i);
        const dateStr = format(date, "yyyy-MM-dd");
        const count =
          (attendanceRecords as any[])?.filter((a) => {
            if (!a.time) return false;
            const d =
              a.time instanceof Date
                ? a.time
                : new Date(a.time?.seconds ? a.time.seconds * 1000 : a.time);
            return a.type === "Clock In" && format(d, "yyyy-MM-dd") === dateStr;
          }).length ?? 0;
        return { day: format(date, "MMM d"), count, dateStr };
      });

      const total = pastDays.reduce((acc, curr) => acc + curr.count, 0);
      return {
        chartData: pastDays,
        periodTotal: total,
        prevPeriodTotal: total,
        pctChange: 0,
      };
    }
  }, [attendanceRecords, timeRange]);

  // Real Dynamic Recent Activities Feed
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      type: "clock-in" | "meal" | "reservation";
      title: string;
      subtitle: string;
      timeStr: string;
      timestamp: number;
    }> = [];

    // 1. Clock-ins
    if (attendanceRecords) {
      (attendanceRecords as any[]).forEach((att) => {
        if (!att.time) return;
        const d =
          att.time instanceof Date
            ? att.time
            : new Date(att.time?.seconds ? att.time.seconds * 1000 : att.time);
        const name = att.worker
          ? `${att.worker.firstName} ${att.worker.lastName}`
          : "Worker";
        list.push({
          id: `att-${att.id}`,
          type: "clock-in",
          title: `${name} clocked in`,
          subtitle: isToday(d)
            ? "Today"
            : isYesterday(d)
            ? "Yesterday"
            : format(d, "MMMM d, yyyy"),
          timeStr: format(d, "h:mm a"),
          timestamp: d.getTime(),
        });
      });
    }

    // 2. Meal Stubs
    if (mealStubs) {
      (mealStubs as any[]).forEach((stub) => {
        const d = stub.claimedAt
          ? stub.claimedAt instanceof Date
            ? stub.claimedAt
            : new Date(stub.claimedAt)
          : stub.date instanceof Date
          ? stub.date
          : new Date(stub.date || Date.now());
        list.push({
          id: `meal-${stub.id}`,
          type: "meal",
          title: `${stub.workerName || "Worker"} claimed meal`,
          subtitle: isToday(d)
            ? "Today"
            : isYesterday(d)
            ? "Yesterday"
            : format(d, "MMMM d, yyyy"),
          timeStr: format(d, "h:mm a"),
          timestamp: d.getTime(),
        });
      });
    }

    // 3. Bookings
    if (bookings) {
      (bookings as any[]).forEach((b) => {
        const d = b.dateRequested || b.createdAt || b.start;
        const parsedDate = d instanceof Date ? d : new Date(d || Date.now());
        const roomName = b.room?.name || "Room";
        const requester = b.name || (b.worker ? `${b.worker.firstName} ${b.worker.lastName}` : "User");
        const statusText =
          b.status === "Approved"
            ? "approved"
            : b.status === "Rejected"
            ? "rejected"
            : "requested";
        list.push({
          id: `booking-${b.id}`,
          type: "reservation",
          title: `Room reservation ${statusText}`,
          subtitle: `${roomName} • ${requester} • ${
            isToday(parsedDate)
              ? "Today"
              : isYesterday(parsedDate)
              ? "Yesterday"
              : format(parsedDate, "MMMM d, yyyy")
          }`,
          timeStr: format(parsedDate, "h:mm a"),
          timestamp: parsedDate.getTime(),
        });
      });
    }

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  }, [attendanceRecords, mealStubs, bookings]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Box}
          label="RESERVATIONS TODAY"
          value={todayReservations}
          subtitle="total reservations"
          iconClass="text-blue-600"
          iconBgClass="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          icon={Clock}
          label="CLOCK INS TODAY"
          value={todayClockIns}
          subtitle="attendance records"
          iconClass="text-emerald-600"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          icon={Utensils}
          label="MEALS CLAIMED"
          value={mealsClaimed}
          subtitle={`of ${totalMealsIssued} issued`}
          iconClass="text-orange-600"
          iconBgClass="bg-orange-50 dark:bg-orange-950/40"
        />
        <StatCard
          icon={AlertCircle}
          label="PENDING APPROVALS"
          value={pendingApprovals}
          subtitle={pendingApprovals > 0 ? "● Needs attention" : "All caught up"}
          subtitleClass={pendingApprovals > 0 ? "text-rose-500 font-semibold flex items-center gap-1.5" : "text-muted-foreground"}
          iconClass="text-amber-600"
          iconBgClass="bg-amber-50 dark:bg-amber-950/40"
        />
      </div>

      {/* 3 Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Widget 1: Daily Check-Ins */}
        <Card className="border border-border/60 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Daily Check-Ins
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Activity trends over the last {timeRange} days
                </CardDescription>
              </div>
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="appearance-none bg-muted/40 hover:bg-muted/60 border border-border/60 rounded-md px-2.5 py-1 pr-7 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                </select>
                <ChevronDown className="h-3 w-3 absolute right-2 top-2.5 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-2 flex flex-col justify-between flex-1 gap-4">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="day"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    domain={[0, 6]}
                    ticks={[0, 1, 2, 3, 4, 5, 6]}
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Clock Ins"
                    fill="#60a5fa"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Total Footer Pill */}
            <div className="bg-muted/30 dark:bg-muted/20 border border-border/40 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Weekly Total
                  </p>
                  <p className="text-xs font-bold text-foreground">
                    {periodTotal} clock-ins
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[11px] font-semibold">
                <span>↑ {pctChange}%</span>
                <span className="text-muted-foreground font-normal">
                  vs last week ({prevPeriodTotal})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget 2: Worker Status */}
        <Card className="border border-border/60 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">
              Worker Status
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Overview of active, inactive, and pending workers
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2 flex flex-col justify-between flex-1">
            <div className="relative flex items-center justify-center h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographicsData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={demographicsData.length > 1 ? 3 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    {demographicsData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} workers`, name]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black tracking-tight text-foreground">
                  {totalWorkers}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Total
                </span>
              </div>
            </div>

            {/* Status Breakdown Legend */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  <span className="font-medium text-foreground">Active</span>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  {activeWorkers} ({activePct}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
                  <span className="font-medium text-foreground">Inactive</span>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  {inactiveWorkers} ({inactivePct}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="font-medium text-foreground">Pending</span>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  {pendingWorkers} ({pendingPct}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget 3: Recent Activities */}
        <Card className="border border-border/60 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">
                Recent Activities
              </CardTitle>
              <Link
                href="/reports"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View All
              </Link>
            </div>
          </CardHeader>

          <CardContent className="pt-2 flex flex-col justify-between flex-1">
            <div className="space-y-3.5">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0 flex items-center justify-center",
                          act.type === "clock-in" &&
                            "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600",
                          act.type === "meal" &&
                            "bg-orange-50 dark:bg-orange-950/50 text-orange-600",
                          act.type === "reservation" &&
                            "bg-blue-50 dark:bg-blue-950/50 text-blue-600"
                        )}
                      >
                        {act.type === "clock-in" && <Clock className="h-3.5 w-3.5" />}
                        {act.type === "meal" && <Utensils className="h-3.5 w-3.5" />}
                        {act.type === "reservation" && <Box className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {act.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                      {act.timeStr}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No recent activities recorded.
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-border/40">
              <Link
                href="/reports"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View All activities <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Regular Worker view ────────────────────────────────────────────────────────
function WorkerDashboard() {
  const { user } = useAuthStore();
  const { workerProfile } = useUserRole();
  const activeUserId = workerProfile?.id || (user as any)?.uid;

  const { attendanceRecords, isLoading: attendanceLoading } = useAttendance(
    activeUserId ? { workerProfileId: activeUserId } : {}
  );
  const { mealStubs, isLoading: mealStubsLoading } = useMealStubs(
    activeUserId ? { workerId: activeUserId } : {}
  );

  const isLoading = attendanceLoading || mealStubsLoading;

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const myClockInsToday =
    (attendanceRecords as any[])?.filter((a) => {
      const d = a.time instanceof Date ? a.time : new Date(a.time?.seconds * 1000);
      return a.type === "Clock In" && format(d, "yyyy-MM-dd") === todayStr;
    }).length ?? 0;

  const myMealsClaimed = (mealStubs as any[])?.filter((m) => m.status === "Claimed").length ?? 0;
  const myMealsIssued = (mealStubs as any[])?.filter((m) => m.status === "Issued").length ?? 0;

  // My clock-ins last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const count =
      (attendanceRecords as any[])?.filter((a) => {
        const d = a.time instanceof Date ? a.time : new Date(a.time?.seconds * 1000);
        return a.type === "Clock In" && format(d, "yyyy-MM-dd") === dateStr;
      }).length ?? 0;
    return { date: format(date, "d"), month: format(date, "MMM"), count };
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Personal Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Clock}
          label="MY CLOCK-INS TODAY"
          value={myClockInsToday}
          subtitle="attendance today"
          iconClass="text-green-600"
          iconBgClass="bg-green-100"
        />
        <StatCard
          icon={Utensils}
          label="MEALS CLAIMED"
          value={myMealsClaimed}
          subtitle={`of ${myMealsIssued} issued`}
          iconClass="text-orange-600"
          iconBgClass="bg-orange-100"
        />
        <StatCard
          icon={Calendar}
          label="TOTAL ATTENDANCE"
          value={(attendanceRecords as any[])?.length ?? 0}
          subtitle="all time records"
          iconClass="text-blue-600"
          iconBgClass="bg-blue-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">My Clock-Ins</CardTitle>
            <CardDescription>Your attendance over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last14Days} margin={{ top: 4, right: 4, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  label={{
                    value:
                      last14Days[0]?.month === last14Days[13]?.month
                        ? last14Days[0]?.month
                        : `${last14Days[0]?.month} – ${last14Days[13]?.month}`,
                    position: "insideBottom",
                    offset: -10,
                    fontSize: 11,
                    fill: "#6b7280",
                  }}
                />
                <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                  labelFormatter={(label, payload) => {
                    const item = (payload as any)?.[0]?.payload;
                    return item ? `${item.month} ${item.date}` : label;
                  }}
                />
                <Bar dataKey="count" name="Clock Ins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Shared StatCard ────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  subtitleClass,
  iconClass,
  iconBgClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subtitle: string;
  subtitleClass?: string;
  iconClass: string;
  iconBgClass: string;
}) {
  return (
    <Card className="border border-border/60 shadow-sm bg-card hover:shadow-md transition-shadow">
      <CardContent className="pt-3.5 pb-3.5 px-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-0.5">
            {label}
          </p>
          <div className={cn("p-1.5 rounded-lg flex items-center justify-center shrink-0", iconBgClass)}>
            <Icon className={cn("h-4 w-4 sm:h-4.5 sm:w-4.5", iconClass)} />
          </div>
        </div>
        <div className="mt-1">
          <p className="text-4xl sm:text-5xl font-black tracking-tight font-headline text-foreground leading-tight">
            {value}
          </p>
          <p className={cn("text-xs text-muted-foreground mt-3.5 font-medium", subtitleClass)}>
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
