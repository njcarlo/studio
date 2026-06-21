"use client";

import { format } from "date-fns";
import { Calendar, List, CalendarRange } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@studio/ui";
import { MonthCalendar, type MonthCalendarEntry } from "@/components/schedule/month-calendar";

export function PublicServicesView({ schedules }: { schedules: any[] }) {
    const entries: MonthCalendarEntry[] = schedules.map((s) => ({
        id: s.id,
        date: s.date,
        label: s.title,
        status: s.status,
        href: `/worker/schedule/${s.publicToken}`,
    }));

    return (
        <Tabs defaultValue="month">
            <TabsList className="mb-4">
                <TabsTrigger value="month"><CalendarRange className="mr-1.5 h-4 w-4" /> Month</TabsTrigger>
                <TabsTrigger value="list"><List className="mr-1.5 h-4 w-4" /> List</TabsTrigger>
            </TabsList>

            <TabsContent value="month">
                <MonthCalendar entries={entries} emptyHint="No service schedules have been published yet." />
            </TabsContent>

            <TabsContent value="list">
                <div className="space-y-3">
                    {schedules.map((schedule) => (
                        <a
                            key={schedule.id}
                            href={`/worker/schedule/${schedule.publicToken}`}
                            className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">{schedule.title}</h2>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <Calendar className="h-4 w-4" />
                                        {format(new Date(schedule.date), "EEEE, MMMM d, yyyy")}
                                    </p>
                                </div>
                                <span className="text-sm font-medium text-primary">View →</span>
                            </div>
                        </a>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    );
}
