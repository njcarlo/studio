"use client";

import React, { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
    LoaderCircle,
    BarChart3,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Download,
    Users,
    UtensilsCrossed,
    Utensils,
    CalendarCheck,
    CheckCircle2,
    Clock,
    XCircle,
    TrendingUp,
    PlusCircle,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection, query, where, orderBy, collectionGroup, Timestamp } from "firebase/firestore";
import {
    format,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subDays,
    addDays,
    subWeeks,
    addWeeks,
    subMonths,
    addMonths,
    eachDayOfInterval,
    isSunday,
    isWithinInterval,
    getDay,
} from "date-fns";
import type { AttendanceRecord, MealStub, Booking, Worker, Room, Ministry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";

// ─── Date Range Controller ────────────────────────────────────────────────────

type ViewMode = "day" | "week" | "month";
type DateRange = { start: Date; end: Date };

function useDateRange() {
    const [viewMode, setViewMode] = useState<ViewMode>("week");
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrev = () => {
        if (viewMode === "day") setCurrentDate((d) => subDays(d, 1));
        else if (viewMode === "week") setCurrentDate((d) => subWeeks(d, 1));
        else setCurrentDate((d) => subMonths(d, 1));
    };

    const handleNext = () => {
        if (viewMode === "day") setCurrentDate((d) => addDays(d, 1));
        else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, 1));
        else setCurrentDate((d) => addMonths(d, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    const dateRange = useMemo<DateRange>(() => {
        if (viewMode === "day") return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
        if (viewMode === "week") return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }, [currentDate, viewMode]);

    const dateRangeDisplay = useMemo(() => {
        if (viewMode === "day") return format(currentDate, "MMMM d, yyyy");
        if (viewMode === "week") {
            return `${format(startOfWeek(currentDate), "MMM d")} – ${format(endOfWeek(currentDate), "MMM d, yyyy")}`;
        }
        return format(currentDate, "MMMM yyyy");
    }, [currentDate, viewMode]);

    return { viewMode, setViewMode, currentDate, setCurrentDate, handlePrev, handleNext, handleToday, dateRange, dateRangeDisplay };
}

// ─── Date Range Toolbar ───────────────────────────────────────────────────────

function DateRangeToolbar({
    viewMode, setViewMode, currentDate, setCurrentDate,
    handlePrev, handleNext, handleToday, dateRangeDisplay, onExport,
}: ReturnType<typeof useDateRange> & { onExport?: () => void }) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="icon" onClick={handlePrev}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
                <Button variant="outline" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal text-sm">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRangeDisplay}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={(d) => d && setCurrentDate(d)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex rounded-md border overflow-hidden">
                    {(["day", "week", "month"] as ViewMode[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => setViewMode(v)}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium transition-colors",
                                viewMode === v
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground"
                            )}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
                {onExport && (
                    <Button variant="outline" size="sm" onClick={onExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, icon: Icon, color, sub }: {
    title: string; value: number | string; icon: React.ElementType; color: string; sub?: string;
}) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("rounded-xl p-3", color)}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <p className="text-3xl font-bold tracking-tight">{value}</p>
                    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── CSV Export Helper ────────────────────────────────────────────────────────

function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent = [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Summary Dashboard ────────────────────────────────────────────────────────

function SummaryDashboard() {
    const firestore = useFirestore();

    const last30Start = useMemo(() => startOfDay(subDays(new Date(), 29)), []);
    const last30End = useMemo(() => endOfDay(new Date()), []);

    const attendanceRef = useMemoFirebase(() =>
        query(
            collection(firestore, "attendance_records"),
            where("time", ">=", Timestamp.fromDate(last30Start)),
            where("time", "<=", Timestamp.fromDate(last30End)),
            orderBy("time", "asc")
        ), [firestore, last30Start, last30End]);

    const mealstubsRef = useMemoFirebase(() =>
        query(
            collection(firestore, "mealstubs"),
            where("date", ">=", Timestamp.fromDate(last30Start)),
            where("date", "<=", Timestamp.fromDate(last30End))
        ), [firestore, last30Start, last30End]);

    const workersRef = useMemoFirebase(() => collection(firestore, "workers"), [firestore]);
    const approvalsRef = useMemoFirebase(() => collection(firestore, "approvals"), [firestore]);

    const { data: attendanceData, isLoading: aLoading } = useCollection<AttendanceRecord>(attendanceRef);
    const { data: mealstubData, isLoading: mLoading } = useCollection<MealStub>(mealstubsRef);
    const { data: workers, isLoading: wLoading } = useCollection<Worker>(workersRef);
    const { data: approvals, isLoading: apLoading } = useCollection<any>(approvalsRef);

    const isLoading = aLoading || mLoading || wLoading || apLoading;

    // Chart: daily clock-ins over last 30 days
    const dailyAttendanceChart = useMemo(() => {
        const days = eachDayOfInterval({ start: last30Start, end: last30End });
        return days.map((day) => {
            const dayStr = format(day, "MMM d");
            const clockIns = attendanceData?.filter((a) => {
                const d = a.time.toDate();
                return a.type === "Clock In" && format(d, "MMM d") === dayStr;
            }).length ?? 0;
            return { date: dayStr, "Clock Ins": clockIns };
        });
    }, [attendanceData, last30Start, last30End]);

    const workerStatusData = useMemo(() => {
        if (!workers) return [];
        const active = workers.filter((w) => w.status === "Active").length;
        const inactive = workers.filter((w) => w.status === "Inactive").length;
        const pending = workers.filter((w) => w.status === "Pending Approval").length;
        return [
            { name: "Active", value: active, color: "#22c55e" },
            { name: "Inactive", value: inactive, color: "#94a3b8" },
            { name: "Pending", value: pending, color: "#f59e0b" },
        ];
    }, [workers]);

    const pendingApprovals = useMemo(() => approvals?.filter((a) => a.status === "Pending").length ?? 0, [approvals]);
    const totalClockIns = useMemo(() => attendanceData?.filter((a) => a.type === "Clock In").length ?? 0, [attendanceData]);
    const claimedMeals = useMemo(() => mealstubData?.filter((m) => m.status === "Claimed").length ?? 0, [mealstubData]);
    const activeWorkers = useMemo(() => workers?.filter((w) => w.status === "Active").length ?? 0, [workers]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Last 30 Days</h2>
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <KpiCard title="Active Workers" value={activeWorkers} icon={Users} color="bg-blue-100 text-blue-700" sub={`of ${workers?.length ?? 0} total`} />
                    <KpiCard title="Clock Ins" value={totalClockIns} icon={TrendingUp} color="bg-green-100 text-green-700" sub="attendance records" />
                    <KpiCard title="Meals Claimed" value={claimedMeals} icon={UtensilsCrossed} color="bg-orange-100 text-orange-700" sub={`of ${mealstubData?.length ?? 0} issued`} />
                    <KpiCard title="Pending Approvals" value={pendingApprovals} icon={Clock} color="bg-yellow-100 text-yellow-700" sub="awaiting action" />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Daily Clock-Ins (Last 30 Days)</CardTitle>
                        <CardDescription>Number of attendance clock-ins per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={dailyAttendanceChart} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    interval={Math.floor(dailyAttendanceChart.length / 6)}
                                />
                                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                                />
                                <Bar dataKey="Clock Ins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Worker Status</CardTitle>
                        <CardDescription>Breakdown by employment status</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={workerStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {workerStatusData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-1 w-full text-sm">
                            {workerStatusData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                                        <span className="text-muted-foreground">{item.name}</span>
                                    </div>
                                    <span className="font-semibold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ─── Attendance Report ────────────────────────────────────────────────────────

function AttendanceReport({ dateRange }: { dateRange: DateRange }) {
    const firestore = useFirestore();
    const { data: workers } = useCollection<Worker>(
        useMemoFirebase(() => collection(firestore, "workers"), [firestore])
    );

    const attendanceQuery = useMemoFirebase(() =>
        query(
            collection(firestore, "attendance_records"),
            where("time", ">=", Timestamp.fromDate(dateRange.start)),
            where("time", "<=", Timestamp.fromDate(dateRange.end)),
            orderBy("time", "desc")
        ), [firestore, dateRange]);

    const { data: attendance, isLoading } = useCollection<AttendanceRecord>(attendanceQuery);

    const getWorkerName = useCallback(
        (id: string) => {
            const w = workers?.find((w) => w.id === id);
            return w ? `${w.firstName} ${w.lastName}` : "Unknown";
        },
        [workers]
    );

    const stats = useMemo(() => {
        if (!attendance) return { clockIns: 0, clockOuts: 0, uniqueWorkers: 0 };
        const ids = new Set(attendance.map((a) => a.workerProfileId));
        return {
            clockIns: attendance.filter((a) => a.type === "Clock In").length,
            clockOuts: attendance.filter((a) => a.type === "Clock Out").length,
            uniqueWorkers: ids.size,
        };
    }, [attendance]);

    const handleExport = () => {
        if (!attendance) return;
        exportCsv(
            `attendance-${format(dateRange.start, "yyyy-MM-dd")}.csv`,
            ["Worker", "Type", "Time"],
            attendance.map((a) => [getWorkerName(a.workerProfileId), a.type, format(a.time.toDate(), "Pp")])
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <KpiCard title="Clock Ins" value={stats.clockIns} icon={TrendingUp} color="bg-green-100 text-green-700" />
                <KpiCard title="Clock Outs" value={stats.clockOuts} icon={CheckCircle2} color="bg-blue-100 text-blue-700" />
                <KpiCard title="Unique Workers" value={stats.uniqueWorkers} icon={Users} color="bg-purple-100 text-purple-700" />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Attendance Log</CardTitle>
                    <Button size="sm" variant="outline" onClick={handleExport} disabled={!attendance?.length}>
                        <Download className="mr-2 h-4 w-4" />Export CSV
                    </Button>
                </CardHeader>
                <CardContent className="w-full overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Worker</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8">
                                        <LoaderCircle className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && attendance?.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{getWorkerName(log.workerProfileId)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "text-xs",
                                            log.type === "Clock In" ? "border-green-500 text-green-700 bg-green-50" : "border-blue-500 text-blue-700 bg-blue-50"
                                        )}>
                                            {log.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{format(log.time.toDate(), "PPp")}</TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && attendance?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No attendance records found for this period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Meal Stubs Report ────────────────────────────────────────────────────────

function MealStubsReport({ dateRange }: { dateRange: DateRange }) {
    const firestore = useFirestore();

    const mealstubsQuery = useMemoFirebase(() =>
        query(
            collection(firestore, "mealstubs"),
            where("date", ">=", Timestamp.fromDate(dateRange.start)),
            where("date", "<=", Timestamp.fromDate(dateRange.end)),
            orderBy("date", "desc")
        ), [firestore, dateRange]);

    const { data: mealstubs, isLoading } = useCollection<MealStub>(mealstubsQuery);

    const stats = useMemo(() => {
        if (!mealstubs) return { issued: 0, claimed: 0, claimRate: 0 };
        const claimed = mealstubs.filter((s) => s.status === "Claimed").length;
        return {
            issued: mealstubs.length,
            claimed,
            claimRate: mealstubs.length > 0 ? Math.round((claimed / mealstubs.length) * 100) : 0,
        };
    }, [mealstubs]);

    const handleExport = () => {
        if (!mealstubs) return;
        exportCsv(
            `mealstubs-${format(dateRange.start, "yyyy-MM-dd")}.csv`,
            ["Worker", "Date", "Status"],
            mealstubs.map((s) => [s.workerName, format(s.date.toDate(), "P"), s.status])
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <KpiCard title="Total Issued" value={stats.issued} icon={UtensilsCrossed} color="bg-orange-100 text-orange-700" />
                <KpiCard title="Claimed" value={stats.claimed} icon={CheckCircle2} color="bg-green-100 text-green-700" />
                <KpiCard title="Claim Rate" value={`${stats.claimRate}%`} icon={TrendingUp} color="bg-blue-100 text-blue-700" />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Meal Stub Log</CardTitle>
                    <Button size="sm" variant="outline" onClick={handleExport} disabled={!mealstubs?.length}>
                        <Download className="mr-2 h-4 w-4" />Export CSV
                    </Button>
                </CardHeader>
                <CardContent className="w-full overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Worker</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8">
                                        <LoaderCircle className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && mealstubs?.map((stub) => (
                                <TableRow key={stub.id}>
                                    <TableCell className="font-medium">{stub.workerName}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{format(stub.date.toDate(), "PPP")}</TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            "text-xs",
                                            stub.status === "Issued" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-green-100 text-green-800 hover:bg-green-100"
                                        )}>
                                            {stub.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && mealstubs?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No meal stub records found for this period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Meal Allocations Report ────────────────────────────────────────────────
function MealAllocationsReport({ dateRange }: { dateRange: DateRange }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { workerProfile, isSuperAdmin } = useUserRole();
    const { toast } = useToast();

    const { data: workers, isLoading: wLoading } = useCollection<Worker>(
        useMemoFirebase(() => collection(firestore, "workers"), [firestore])
    );
    const { data: ministries, isLoading: mLoading } = useCollection<Ministry>(
        useMemoFirebase(() => collection(firestore, "ministries"), [firestore])
    );

    const mealstubsQuery = useMemoFirebase(() =>
        query(
            collection(firestore, "mealstubs"),
            where("date", ">=", Timestamp.fromDate(dateRange.start)),
            where("date", "<=", Timestamp.fromDate(dateRange.end)),
            orderBy("date", "desc")
        ), [firestore, dateRange]);

    const { data: mealstubs, isLoading: msLoading } = useCollection<MealStub>(mealstubsQuery);

    const isLoading = wLoading || msLoading || mLoading;

    const filteredWorkers = useMemo(() => {
        return workers?.filter(w => w.employmentType === 'Full-Time' || w.employmentType === 'On-Call')
            .sort((a, b) => a.firstName.localeCompare(b.firstName)) || [];
    }, [workers]);

    const getMinistry = useCallback((id: string) => ministries?.find(m => m.id === id), [ministries]);

    const isAssignerFor = useCallback((worker: Worker) => {
        if (isSuperAdmin) return true;
        if (!workerProfile) return false;
        const primaryMinistry = getMinistry(worker.primaryMinistryId);
        const secondaryMinistry = getMinistry(worker.secondaryMinistryId);
        return (primaryMinistry?.mealStubAssignerId === workerProfile.id) ||
            (secondaryMinistry?.mealStubAssignerId === workerProfile.id);
    }, [isSuperAdmin, workerProfile, getMinistry]);

    const handleAssignSunday = async (worker: Worker) => {
        if (!isAssignerFor(worker)) {
            toast({ variant: "destructive", title: "Access Denied", description: "You are not the meal stub assigner for this ministry." });
            return;
        }

        const today = new Date();
        if (!isSunday(today)) {
            toast({ variant: "destructive", title: "Not Allowed", description: "Sunday meal stubs can only be assigned on Sundays." });
            return;
        }

        const newStub = {
            workerId: worker.id,
            workerName: `${worker.firstName} ${worker.lastName}`,
            date: Timestamp.fromDate(today),
            status: 'Issued' as const,
        };

        try {
            await addDocumentNonBlocking(collection(firestore, "mealstubs"), newStub);
            toast({ title: "Meal Stub Assigned", description: `Assigned a Sunday meal stub to ${worker.firstName}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to assign meal stub." });
        }
    };

    const getWorkerStats = (workerId: string) => {
        const workerStubs = mealstubs?.filter(s => s.workerId === workerId) || [];
        const weekdayStubs = workerStubs.filter(s => {
            const d = s.date.toDate();
            return !isSunday(d) && isWithinInterval(d, dateRange);
        });
        const sundayStubs = workerStubs.filter(s => {
            const d = s.date.toDate();
            return isSunday(d) && isWithinInterval(d, dateRange);
        });

        return {
            weekdayCount: weekdayStubs.length,
            sundayCount: sundayStubs.length,
        };
    };

    const isCurrentlySunday = isSunday(new Date());

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Utensils className="h-4 w-4" /> Weekly Meal Allocations
                    </CardTitle>
                    <CardDescription>
                        Tracking for Full-Time and On-Call workers. Weekdays: 5 limit, Sunday: 2 limit.
                    </CardDescription>
                </CardHeader>
                <CardContent className="w-full overflow-x-auto">
                    <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Worker</TableHead>
                                <TableHead>Ministry</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-center">Mon-Sat (Used/5)</TableHead>
                                <TableHead className="text-center">Sunday (Used/2)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <LoaderCircle className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredWorkers.map((worker) => {
                                const stats = getWorkerStats(worker.id);
                                const primaryMinistry = getMinistry(worker.primaryMinistryId);
                                const secondaryMinistry = getMinistry(worker.secondaryMinistryId);
                                const canAssign = isAssignerFor(worker) && isCurrentlySunday;

                                return (
                                    <TableRow key={worker.id}>
                                        <TableCell className="font-medium">{worker.firstName} {worker.lastName}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm">{primaryMinistry?.name || '---'}</span>
                                                {secondaryMinistry && (
                                                    <span className="text-[10px] text-muted-foreground italic">({secondaryMinistry.name})</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                {worker.employmentType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={cn(
                                                    "font-bold",
                                                    stats.weekdayCount > 5 ? "text-red-500" : "text-green-600"
                                                )}>
                                                    {stats.weekdayCount} / 5
                                                </span>
                                                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full", stats.weekdayCount > 5 ? "bg-red-500" : "bg-green-500")}
                                                        style={{ width: `${Math.min((stats.weekdayCount / 5) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={cn(
                                                    "font-bold",
                                                    stats.sundayCount > 2 ? "text-red-500" : "text-blue-600"
                                                )}>
                                                    {stats.sundayCount} / 2
                                                </span>
                                                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full", stats.sundayCount > 2 ? "bg-red-500" : "bg-blue-500")}
                                                        style={{ width: `${Math.min((stats.sundayCount / 2) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {canAssign && (
                                                <Button size="sm" variant="outline" onClick={() => handleAssignSunday(worker)}>
                                                    <PlusCircle className="mr-1 h-3 w-3" /> Assign Sunday
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!isLoading && filteredWorkers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No Full-Time or On-Call workers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Reservations Report ──────────────────────────────────────────────────────

function ReservationsReport({ dateRange }: { dateRange: DateRange }) {
    const firestore = useFirestore();
    const { data: workers } = useCollection<Worker>(
        useMemoFirebase(() => collection(firestore, "workers"), [firestore])
    );
    const { data: rooms } = useCollection<Room>(
        useMemoFirebase(() => collection(firestore, "rooms"), [firestore])
    );

    const reservationsQuery = useMemoFirebase(() =>
        query(
            collectionGroup(firestore, "reservations"),
            where("start", ">=", Timestamp.fromDate(dateRange.start)),
            where("start", "<=", Timestamp.fromDate(dateRange.end)),
            orderBy("start", "desc")
        ), [firestore, dateRange]);

    const { data: reservations, isLoading } = useCollection<Booking>(reservationsQuery);

    const getWorkerName = useCallback(
        (id: string) => {
            const w = workers?.find((w) => w.id === id);
            return w ? `${w.firstName} ${w.lastName}` : "Unknown";
        },
        [workers]
    );

    const getRoomName = useCallback(
        (id: string) => rooms?.find((r) => r.id === id)?.name ?? "Unknown",
        [rooms]
    );

    const stats = useMemo(() => {
        if (!reservations) return { total: 0, approved: 0, pending: 0, rejected: 0 };
        return {
            total: reservations.length,
            approved: reservations.filter((r) => r.status === "Approved").length,
            pending: reservations.filter((r) => r.status === "Pending").length,
            rejected: reservations.filter((r) => r.status === "Rejected").length,
        };
    }, [reservations]);

    const handleExport = () => {
        if (!reservations) return;
        exportCsv(
            `reservations-${format(dateRange.start, "yyyy-MM-dd")}.csv`,
            ["Room", "Title", "Booked By", "Start", "End", "Status"],
            reservations.map((r) => [
                getRoomName(r.roomId),
                r.title,
                r.workerProfileId ? getWorkerName(r.workerProfileId) : "N/A",
                format(r.start.toDate(), "Pp"),
                format(r.end.toDate(), "p"),
                r.status,
            ])
        );
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <KpiCard title="Total" value={stats.total} icon={CalendarCheck} color="bg-slate-100 text-slate-700" />
                <KpiCard title="Approved" value={stats.approved} icon={CheckCircle2} color="bg-green-100 text-green-700" />
                <KpiCard title="Pending" value={stats.pending} icon={Clock} color="bg-yellow-100 text-yellow-700" />
                <KpiCard title="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-100 text-red-700" />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Reservations Log</CardTitle>
                    <Button size="sm" variant="outline" onClick={handleExport} disabled={!reservations?.length}>
                        <Download className="mr-2 h-4 w-4" />Export CSV
                    </Button>
                </CardHeader>
                <CardContent className="w-full overflow-x-auto">
                    <Table className="min-w-[700px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Room</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Booked By</TableHead>
                                <TableHead>Start</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <LoaderCircle className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && reservations?.map((res) => (
                                <TableRow key={res.id}>
                                    <TableCell className="font-medium">{getRoomName(res.roomId)}</TableCell>
                                    <TableCell>{res.title}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {res.workerProfileId ? getWorkerName(res.workerProfileId) : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{format(res.start.toDate(), "PPp")}</TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            "text-xs",
                                            res.status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                                res.status === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                                    "bg-red-100 text-red-800 hover:bg-red-100"
                                        )}>
                                            {res.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && reservations?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No reservation records found for this period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Tabbed Report Wrapper ────────────────────────────────────────────────────

function TabbedReport({ children }: { children: React.ReactNode }) {
    const dateRangeState = useDateRange();
    return (
        <div className="space-y-4">
            <DateRangeToolbar {...dateRangeState} />
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(child as React.ReactElement<any>, { dateRange: dateRangeState.dateRange })
                    : child
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const { canViewReports, isLoading } = useUserRole();

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    if (!canViewReports) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-6 w-6 text-primary" />
                <div>
                    <h1 className="text-2xl font-headline font-bold leading-none">Reports</h1>
                    <p className="text-sm text-muted-foreground mt-1">Analytics and operational data for administrators</p>
                </div>
            </div>

            <Tabs defaultValue="summary">
                <div className="w-full overflow-x-auto pb-2">
                    <TabsList className="mb-0 flex w-max">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        <TabsTrigger value="mealstubs">Meal Stubs</TabsTrigger>
                        <TabsTrigger value="mealallocations">Meal Allocations</TabsTrigger>
                        <TabsTrigger value="reservations">Room Reservations</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="summary">
                    <SummaryDashboard />
                </TabsContent>

                <TabsContent value="attendance">
                    <TabbedReport>
                        <AttendanceReport dateRange={{ start: new Date(), end: new Date() }} />
                    </TabbedReport>
                </TabsContent>

                <TabsContent value="mealstubs">
                    <TabbedReport>
                        <MealStubsReport dateRange={{ start: new Date(), end: new Date() }} />
                    </TabbedReport>
                </TabsContent>

                <TabsContent value="mealallocations">
                    <TabbedReport>
                        <MealAllocationsReport dateRange={{ start: new Date(), end: new Date() }} />
                    </TabbedReport>
                </TabsContent>

                <TabsContent value="reservations">
                    <TabbedReport>
                        <ReservationsReport dateRange={{ start: new Date(), end: new Date() }} />
                    </TabbedReport>
                </TabsContent>
            </Tabs>
        </AppLayout >
    );
}
