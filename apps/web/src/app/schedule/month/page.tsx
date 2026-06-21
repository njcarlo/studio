"use client";

import { useMemo, useState } from "react";
import { addMonths, endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label } from "@studio/ui";
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
    const { schedules, isLoading, createSchedule } = useServiceSchedules();
    const { ministries } = useMinistries();

    const [isAddDateOpen, setIsAddDateOpen] = useState(false);
    const [newDate, setNewDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
    const [isCreating, setIsCreating] = useState(false);

    const monthSchedules = useMemo(() => {
        const start = startOfMonth(refDate);
        const end = endOfMonth(refDate);
        return (schedules ?? []).filter((s: any) => isWithinInterval(new Date(s.date), { start, end }));
    }, [schedules, refDate]);

    const handleAddDate = async () => {
        if (!newDate) return;
        setIsCreating(true);
        try {
            await createSchedule({
                date: new Date(newDate),
                title: "Sunday Service",
                createdBy: user?.uid || "system",
            });
            toast({ title: "Date added" });
            setIsAddDateOpen(false);
        } catch (e: any) {
            toast({ title: "Failed to add date", description: e.message, variant: "destructive" });
        } finally {
            setIsCreating(false);
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
                        onAddDate={() => { setNewDate(format(refDate, "yyyy-MM-dd")); setIsAddDateOpen(true); }}
                    />
                )}
            </div>

            <Dialog open={isAddDateOpen} onOpenChange={setIsAddDateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a Date to {format(refDate, "MMMM yyyy")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5 py-2">
                        <Label>Date</Label>
                        <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDateOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddDate} disabled={isCreating}>
                            {isCreating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
