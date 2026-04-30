"use client";

import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@studio/ui";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { LoaderCircle, Clock, Utensils, Calendar, Users, AlertCircle } from "lucide-react";
import { useWorkers } from "@/hooks/use-workers";
import { useAttendance } from "@/hooks/use-attendance";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useApprovals } from "@/hooks/use-approvals";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { format, subDays } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const {
    workerProfile,
    isLoading: userLoading,
    isSuperAdmin,
    isMinistryHead,
    isMinistryApprover,
    canManageWorkers,
  } = useUserRole();

  const isManager = isSuperAdmin || isMinistryHead || isMinistryApprover || canManageWorkers;

  const userName = workerProfile?.firstName || user?.email?.split("@")[0] || "User";

  if (userLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-muted-foreground mb-1 uppercase tracking-wider text-xs font-semibold">
            Dashboard
          </p>
          <h1 className="text-3xl font-headline font-bold tracking-tight">
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
  const { workers, isLoading: workersLoading } = useWorkers();
  const { attendanceRecords, isLoading: attendanceLoading } = useAttendance({});
  const { mealStubs, isLoading: mealStubsLoading } = useMealStubs({});
  const { approvals, isLoading: approvalsLoading } = useApprovals();

  const isLoading = workersLoading || attendanceLoading || mealStubsLoading || approvalsLoading;

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const activeWorkers = (workers as any[])?.filter((w) => w.status === "Active").length ?? 0;
  const totalWorkers = workers?.length ?? 0;

  const todayClockIns =
    (attendanceRecords as any[])?.filter((a) => {
      const d = a.time instanceof Date ? a.time : new Date(a.time?.seconds * 1000);
      return a.type === "Clock In" && format(d, "yyyy-MM-dd") === todayStr;
    }).length ?? 0;

  const mealsClaimed = (mealStubs as any[])?.filter((m) => m.status === "Claimed").length ?? 0;
  const totalMealsIssued = (mealStubs as any[])?.filter((m) => m.status === "Issued").length ?? 0;

  const pendingApprovals =
    (approvals as any[])?.filter((a) => a.status?.startsWith("Pending")).length ?? 0;

  const demographicsData = [
    { name: "Active",   value: (workers as any[])?.filter((w) => w.status === "Active").length ?? 0,            color: "#10b981" },
    { name: "Inactive", value: (workers as any[])?.filter((w) => w.status === "Inactive").length ?? 0,          color: "#6b7280" },
    { name: "Pending",  value: (workers as any[])?.filter((w) => w.status === "Pending Approval").length ?? 0,  color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const count =
      (attendanceRecords as any[])?.filter((a) => {
        const d = a.time instanceof Date ? a.time : new Date(a.time?.seconds * 1000);
        return a.type === "Clock In" && format(d, "yyyy-MM-dd") === dateStr;
      }).length ?? 0;
    return { date: format(date, "MMM d"), count };
  });

  if (isLoading) {
    return <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Active Workers"    value={activeWorkers}    subtitle={`of ${totalWorkers} total`}       iconClass="bg-blue-100 text-blue-600" />
        <StatCard icon={Clock}       label="Clock Ins Today"   value={todayClockIns}    subtitle="attendance records"               iconClass="bg-green-100 text-green-600" />
        <StatCard icon={Utensils}    label="Meals Claimed"     value={mealsClaimed}     subtitle={`of ${totalMealsIssued} issued`}  iconClass="bg-orange-100 text-orange-600" />
        <StatCard icon={AlertCircle} label="Pending Approvals" value={pendingApprovals} subtitle="awaiting action"                  iconClass="bg-yellow-100 text-yellow-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Clock-Ins</CardTitle>
            <CardDescription>Activity trends over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last30Days} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                <Bar dataKey="count" name="Clock Ins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Worker Demographics</CardTitle>
            <CardDescription>Worker status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={demographicsData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {demographicsData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { name: "Active",   color: "#10b981", value: (workers as any[])?.filter((w) => w.status === "Active").length ?? 0 },
                { name: "Inactive", color: "#6b7280", value: (workers as any[])?.filter((w) => w.status === "Inactive").length ?? 0 },
                { name: "Pending",  color: "#f59e0b", value: (workers as any[])?.filter((w) => w.status === "Pending Approval").length ?? 0 },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{item.value}</span>
                </div>
              ))}
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
  const myMealsIssued  = (mealStubs as any[])?.filter((m) => m.status === "Issued").length ?? 0;

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
    return <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Personal Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Clock}    label="My Clock-Ins Today" value={myClockInsToday} subtitle="attendance today"                  iconClass="bg-green-100 text-green-600" />
        <StatCard icon={Utensils} label="Meals Claimed"      value={myMealsClaimed}  subtitle={`of ${myMealsIssued} issued`}      iconClass="bg-orange-100 text-orange-600" />
        <StatCard icon={Calendar} label="Total Attendance"   value={(attendanceRecords as any[])?.length ?? 0} subtitle="all time records" iconClass="bg-blue-100 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* My Clock-Ins Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Clock-Ins</CardTitle>
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
                  label={{ value: last14Days[0]?.month === last14Days[13]?.month ? last14Days[0]?.month : `${last14Days[0]?.month} – ${last14Days[13]?.month}`, position: "insideBottom", offset: -10, fontSize: 11, fill: "#6b7280" }}
                />
                <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
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
  icon: Icon, label, value, subtitle, iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  subtitle: string;
  iconClass: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2.5 rounded-lg ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
        <p className="text-3xl font-black mb-1">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
