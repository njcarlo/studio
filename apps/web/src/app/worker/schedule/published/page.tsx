"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@studio/ui";
import { CalendarDays, LoaderCircle } from "lucide-react";
import { useServiceSchedules } from "@/hooks/use-schedule";
import { MonthCalendar, type MonthCalendarEntry } from "@/components/schedule/month-calendar";

export default function PublishedSchedulesPortalPage() {
    const router = useRouter();
    const { schedules, isLoading } = useServiceSchedules();

    const published = (schedules ?? []).filter((s: any) => s.status === "Published");

    const entries: MonthCalendarEntry[] = published.map((s: any) => ({
        id: s.id,
        date: s.date,
        label: s.title,
        status: s.status,
    }));

    return (
        <AppLayout>
            <div className="flex flex-col gap-6 p-4 md:p-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Published Schedules</h1>
                    <p className="text-muted-foreground">Browse every published service schedule by month. Click a date to view who's serving.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : published.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <CalendarDays className="mx-auto mb-3 h-8 w-8" />
                            No published schedules yet.
                        </CardContent>
                    </Card>
                ) : (
                    <MonthCalendar
                        entries={entries}
                        emptyHint="No published schedules yet."
                        onSelectEntry={(entry) => router.push(`/schedule/${entry.id}`)}
                    />
                )}
            </div>
        </AppLayout>
    );
}
