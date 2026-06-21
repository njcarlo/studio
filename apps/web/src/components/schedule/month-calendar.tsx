"use client";

import { useMemo, useState } from "react";
import { addMonths, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Button } from "@studio/ui";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export type MonthCalendarEntry = {
    id: string;
    date: Date | string;
    label: string;
    status?: string;
    href?: string;
};

const STATUS_DOT: Record<string, string> = {
    Draft: "bg-muted-foreground/50",
    Published: "bg-green-500",
    Completed: "bg-blue-500",
};

function eachDayBetween(start: Date, end: Date) {
    const days: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return days;
}

export function MonthCalendar({
    entries,
    initialMonth,
    onSelectEntry,
    emptyHint,
}: {
    entries: MonthCalendarEntry[];
    initialMonth?: Date;
    onSelectEntry?: (entry: MonthCalendarEntry) => void;
    emptyHint?: string;
}) {
    const [month, setMonth] = useState(() => initialMonth ?? new Date());

    const days = useMemo(() => {
        const gridStart = startOfWeek(startOfMonth(month));
        const gridEnd = endOfWeek(endOfMonth(month));
        return eachDayBetween(gridStart, gridEnd);
    }, [month]);

    const entriesByDay = useMemo(() => {
        const map = new Map<string, MonthCalendarEntry[]>();
        for (const entry of entries) {
            const key = format(new Date(entry.date), "yyyy-MM-dd");
            map.set(key, [...(map.get(key) ?? []), entry]);
        }
        return map;
    }, [entries]);

    return (
        <div className="rounded-lg border shadow-sm">
            <div className="flex items-center justify-between border-b p-3">
                <Button variant="ghost" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-semibold">{format(month, "MMMM yyyy")}</div>
                <Button variant="ghost" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="py-2">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {days.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayEntries = entriesByDay.get(key) ?? [];
                    const inMonth = isSameMonth(day, month);
                    return (
                        <div
                            key={key}
                            className={cn(
                                "min-h-[88px] border-b border-r p-1.5 last:border-r-0",
                                !inMonth && "bg-muted/30 text-muted-foreground/50",
                            )}
                        >
                            <div className={cn(
                                "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                                isToday(day) && "bg-primary text-primary-foreground font-semibold",
                            )}>
                                {format(day, "d")}
                            </div>
                            <div className="flex flex-col gap-1">
                                {dayEntries.map((entry) => (
                                    <button
                                        key={entry.id}
                                        onClick={() => onSelectEntry?.(entry)}
                                        className="flex w-full items-center gap-1 truncate rounded bg-muted px-1.5 py-0.5 text-left text-[11px] hover:bg-muted/70"
                                        title={entry.label}
                                    >
                                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", entry.status ? STATUS_DOT[entry.status] ?? "bg-muted-foreground" : "bg-muted-foreground")} />
                                        <span className="truncate">{entry.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {entries.length === 0 && emptyHint && (
                <div className="flex flex-col items-center justify-center gap-2 border-t p-8 text-center text-sm text-muted-foreground">
                    <CalendarDays className="h-6 w-6" />
                    {emptyHint}
                </div>
            )}
        </div>
    );
}
