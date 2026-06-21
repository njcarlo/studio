"use client";

import { useMemo, useState } from "react";
import {
    addDays,
    addMonths,
    addWeeks,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isWithinInterval,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { Button } from "@studio/ui";
import { Tabs, TabsList, TabsTrigger } from "@studio/ui";
import { ChevronLeft, ChevronRight, Download, RotateCcw } from "lucide-react";
import { useAuthStore } from "@studio/store";

type Assignment = {
    id: string;
    ministryId: string;
    roleName: string;
    workerName: string | null;
    slotType: string | null;
    order: number;
};

type Schedule = {
    id: string;
    title: string;
    date: string | Date;
    assignments: Assignment[];
};

type Ministry = { id: string; name: string };

type Period = "day" | "week" | "month";

function periodRange(period: Period, refDate: Date) {
    if (period === "day") return { start: refDate, end: refDate };
    if (period === "week") return { start: startOfWeek(refDate), end: endOfWeek(refDate) };
    return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
}

function shift(period: Period, refDate: Date, dir: 1 | -1) {
    if (period === "day") return addDays(refDate, dir);
    if (period === "week") return addWeeks(refDate, dir);
    return addMonths(refDate, dir);
}

function csvEscape(val: string) {
    return `"${val.replace(/"/g, '""')}"`;
}

export function ScheduleMatrixPortal({ schedules, ministries }: { schedules: Schedule[]; ministries: Ministry[] }) {
    const { user } = useAuthStore();
    const [period, setPeriod] = useState<Period>("week");
    const [refDate, setRefDate] = useState(() => new Date());

    const ministryName = (id: string) => ministries.find((m) => m.id === id)?.name || id;

    const { start, end } = periodRange(period, refDate);

    const visibleSchedules = useMemo(() => {
        return schedules
            .filter((s) => isWithinInterval(new Date(s.date), { start, end }) || isSameDay(new Date(s.date), start))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [schedules, start, end]);

    const dateColumns = useMemo(
        () => Array.from(new Set(visibleSchedules.map((s) => format(new Date(s.date), "yyyy-MM-dd")))),
        [visibleSchedules],
    );

    const ministrySections = useMemo(() => {
        const byMinistry = new Map<string, { dateKey: string; slotType: string; roleName: string; workerName: string | null }[]>();
        for (const schedule of visibleSchedules) {
            const dateKey = format(new Date(schedule.date), "yyyy-MM-dd");
            for (const a of schedule.assignments) {
                const list = byMinistry.get(a.ministryId) ?? [];
                list.push({ dateKey, slotType: a.slotType || "Standard", roleName: a.roleName, workerName: a.workerName });
                byMinistry.set(a.ministryId, list);
            }
        }

        return Array.from(byMinistry.entries())
            .map(([ministryId, rows]) => {
                const slotsByDate = new Map<string, string[]>();
                for (const dateKey of dateColumns) {
                    const slotTypes = Array.from(new Set(rows.filter((r) => r.dateKey === dateKey).map((r) => r.slotType)));
                    if (slotTypes.length) slotsByDate.set(dateKey, slotTypes);
                }
                const roleNames = Array.from(new Set(rows.map((r) => r.roleName)));
                return { ministryId, name: ministryName(ministryId), rows, slotsByDate, roleNames };
            })
            .filter((section) => section.slotsByDate.size > 0)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [visibleSchedules, dateColumns]);

    const cellValue = (section: typeof ministrySections[number], roleName: string, dateKey: string, slotType: string) => {
        const matches = section.rows.filter((r) => r.roleName === roleName && r.dateKey === dateKey && r.slotType === slotType);
        const names = matches.map((m) => m.workerName).filter(Boolean);
        return names.length ? names.join(", ") : "—";
    };

    const periodLabel = period === "day"
        ? format(refDate, "EEEE, MMMM d, yyyy")
        : period === "week"
        ? `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
        : format(refDate, "MMMM yyyy");

    const exportCSV = () => {
        const header = ["Role", ...dateColumns.flatMap((dateKey) => {
            const slotTypes = new Set<string>();
            ministrySections.forEach((s) => (s.slotsByDate.get(dateKey) ?? []).forEach((st) => slotTypes.add(st)));
            return Array.from(slotTypes).map((st) => `${dateKey} (${st})`);
        })];
        const rows: string[][] = [];
        for (const section of ministrySections) {
            rows.push([section.name]);
            for (const roleName of section.roleNames) {
                const row = [roleName];
                for (const dateKey of dateColumns) {
                    const slotTypes = section.slotsByDate.get(dateKey) ?? [];
                    for (const slotType of slotTypes) {
                        row.push(cellValue(section, roleName, dateKey, slotType));
                    }
                }
                rows.push(row);
            }
        }
        const csv = [header.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `schedule_${period}_${format(refDate, "yyyy-MM-dd")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
                    <TabsList>
                        <TabsTrigger value="day">Day</TabsTrigger>
                        <TabsTrigger value="week">Week</TabsTrigger>
                        <TabsTrigger value="month">Month</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => setRefDate((d) => shift(period, d, -1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setRefDate(new Date())} title="Today">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setRefDate((d) => shift(period, d, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="ml-2 text-sm font-medium text-gray-700">{periodLabel}</span>
                </div>

                {user && (
                    <Button variant="outline" size="sm" onClick={exportCSV} disabled={ministrySections.length === 0}>
                        <Download className="mr-1.5 h-4 w-4" /> Export CSV
                    </Button>
                )}
            </div>

            {ministrySections.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center text-muted-foreground">
                    No published assignments for this {period}.
                </div>
            ) : (
                <div className="space-y-6">
                    {ministrySections.map((section) => (
                        <div key={section.ministryId} className="overflow-x-auto rounded-lg border shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr>
                                        <th
                                            colSpan={1 + dateColumns.reduce((n, dk) => n + (section.slotsByDate.get(dk)?.length ?? 0), 0)}
                                            className="bg-blue-600 px-3 py-2 text-left font-semibold text-white"
                                        >
                                            {section.name}
                                        </th>
                                    </tr>
                                    <tr className="bg-blue-50">
                                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-r">Role</th>
                                        {dateColumns.map((dateKey) => {
                                            const slotTypes = section.slotsByDate.get(dateKey) ?? [];
                                            if (!slotTypes.length) return null;
                                            return (
                                                <th key={dateKey} colSpan={slotTypes.length} className="px-3 py-2 text-center font-medium text-gray-700 border-l">
                                                    {format(new Date(dateKey), "MMM d")}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                    <tr className="bg-blue-50/60">
                                        <th className="border-r" />
                                        {dateColumns.flatMap((dateKey) => {
                                            const slotTypes = section.slotsByDate.get(dateKey) ?? [];
                                            return slotTypes.map((slotType) => (
                                                <th key={`${dateKey}-${slotType}`} className="px-3 py-1.5 text-center text-xs font-medium text-gray-500 border-l">
                                                    {slotType}
                                                </th>
                                            ));
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.roleNames.map((roleName, i) => (
                                        <tr key={roleName} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                                            <td className="px-3 py-2 font-medium text-gray-800 border-r border-t">{roleName}</td>
                                            {dateColumns.flatMap((dateKey) => {
                                                const slotTypes = section.slotsByDate.get(dateKey) ?? [];
                                                return slotTypes.map((slotType) => (
                                                    <td key={`${dateKey}-${slotType}`} className="px-3 py-2 text-center text-gray-600 border-l border-t">
                                                        {cellValue(section, roleName, dateKey, slotType)}
                                                    </td>
                                                ));
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
