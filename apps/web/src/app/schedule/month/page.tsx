"use client";

import { useMemo, useState } from "react";
import { addMonths, endOfMonth, isWithinInterval, startOfMonth, subMonths } from "date-fns";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { useAuthStore } from "@studio/store";
import { ChevronLeft, ChevronRight, LoaderCircle, RotateCcw } from "lucide-react";
import { useServiceSchedules } from "@/hooks/use-schedule";
import { useMinistries } from "@/hooks/use-ministries";
import { useToast } from "@/hooks/use-toast";
import { MonthEditorMatrix } from "./MonthEditorMatrix";

export default function MonthSchedulingEditorPage() {
    const { toast } = useToast();
    const { user } = useAuthStore();
    const [refDate, setRefDate] = useState(() => new Date());
    const { schedules, isLoading, createSchedule, updateSchedule } = useServiceSchedules();
    const { ministries } = useMinistries();

    const monthSchedules = useMemo(() => {
        const start = startOfMonth(refDate);
        const end = endOfMonth(refDate);
        return (schedules ?? []).filter((s: any) => isWithinInterval(new Date(s.date), { start, end }));
    }, [schedules, refDate]);

    const handleAddDate = async (date: Date) => {
        try {
            await createSchedule({
                date,
                title: "Sunday Service",
                createdBy: user?.uid || "system",
            });
            toast({ title: "Date added" });
        } catch (e: any) {
            toast({ title: "Failed to add date", description: e.message, variant: "destructive" });
        }
    };

    const handleRescheduleDate = async (scheduleId: string, date: Date) => {
        try {
            await updateSchedule({ id: scheduleId, data: { date } });
            toast({ title: "Date updated" });
        } catch (e: any) {
            toast({ title: "Failed to update date", description: e.message, variant: "destructive" });
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col gap-6 p-4 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Month Scheduling Editor</h1>
                        <p className="text-muted-foreground">
                            Reassign workers or add roles across every Sunday in the month at once.
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" onClick={() => setRefDate((d) => subMonths(d, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setRefDate(new Date())} title="This month">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setRefDate((d) => addMonths(d, 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <span className="ml-2 text-sm font-medium">{format(refDate, "MMMM yyyy")}</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <MonthEditorMatrix
                        schedules={monthSchedules}
                        ministries={ministries ?? []}
                        onAddDate={handleAddDate}
                        onRescheduleDate={handleRescheduleDate}
                    />
                )}
            </div>
        </AppLayout>
    );
}
